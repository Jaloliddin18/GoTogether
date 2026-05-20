import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, PipelineStage } from 'mongoose';
import { BookStatus } from '../../libs/enums/book.enum';
import { RobotStatus } from '../../libs/enums/robot.enum';
import { MemberType } from '../../libs/enums/member.enum';
import {
	DeliveryDestinationType,
	PaymentStatus,
	RequestErrorCode,
	RequestStatus,
	RequestType,
} from '../../libs/enums/request.enum';
import {
	REQUEST_RECEPTION_DESTINATION,
	shapeIntoMongoObjectId,
} from '../../libs/config';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { Book } from '../../libs/dto/book/book';
import { Robot } from '../../libs/dto/robot/robot';
import { Member } from '../../libs/dto/member/member';
import { Requests, RequestTask } from '../../libs/dto/request/request';
import {
	CreateDeliveryRequestInput,
	RequestsInquiry,
	SessionRequestsInquiry,
} from '../../libs/dto/request/request.input';
import {
	CancelRequestInput,
	UpdateRequestStatusInput,
} from '../../libs/dto/request/request.update';
import { BookInventory } from '../../libs/dto/book-inventory/book-inventory';
import {
	BookInventoryStatus,
	BookInventoryType,
} from '../../libs/enums/book-inventory.enum';
import { MqttRobotService } from '../../robot-comm/mqtt.service';
import {
	MqttCancelCommandPayload,
	MqttCommandPayload,
	MqttReturnToDockCommandPayload,
} from '../../robot-comm/mqtt.types';
import { RobotGateway } from '../../socket/robot.gateway';

const CHARGING_DOCK_DESTINATION = {
	floorId: 'floor_1',
	x: 53.529,
	y: 9.706,
	theta: 0,
} as const;

@Injectable()
export class RequestService {
	constructor(
		@InjectModel('Request') private readonly requestModel: Model<RequestTask>,
		@InjectModel('Book') private readonly bookModel: Model<Book>,
		@InjectModel('BookInventory')
		private readonly bookInventoryModel: Model<BookInventory>,
		@InjectModel('Robot') private readonly robotModel: Model<Robot>,
		private readonly mqttRobotService: MqttRobotService,
		private readonly robotGateway: RobotGateway,
	) {}

	public async createDeliveryRequest(
		input: CreateDeliveryRequestInput,
		memberId?: ObjectId,
	): Promise<RequestTask> {
		let reservedInventoryId: ObjectId | undefined;
		let createdRequestId: ObjectId | undefined;
		try {
			if (!memberId && !input.sessionId) {
				throw new BadRequestException(Message.BAD_REQUEST);
			}

			const bookId = shapeIntoMongoObjectId(input.bookId);
			const book = await this.bookModel
				.findOne({
					_id: bookId,
					deletedAt: null,
					bookStatus: { $ne: BookStatus.DELETED },
				})
				.lean()
				.exec();
			if (!book) throw new BadRequestException(RequestErrorCode.BOOK_UNAVAILABLE);
			if (
				typeof book.bookCallNumber !== 'string' ||
				!book.bookCallNumber.trim()
			) {
				throw new BadRequestException(Message.BAD_REQUEST);
			}

			if (input.requestType === RequestType.BORROW && !book.isBorrowable) {
				throw new BadRequestException(RequestErrorCode.BOOK_UNAVAILABLE);
			}
			if (input.requestType === RequestType.PURCHASE && !book.isPurchasable) {
				throw new BadRequestException(RequestErrorCode.BOOK_UNAVAILABLE);
			}

			if (
				input.requestType === RequestType.BORROW &&
				(!input.destinationDeskId || !input.destination?.floorId)
			) {
				throw new BadRequestException(RequestErrorCode.INVALID_DESTINATION);
			}

			const sourceInventoryId = input.sourceInventoryId
				? shapeIntoMongoObjectId(input.sourceInventoryId)
				: undefined;

			const reservedInventory = await this.reserveInventory({
				bookId,
				requestType: input.requestType,
				sourceInventoryId,
			});
			if (!reservedInventory) {
				throw new BadRequestException(RequestErrorCode.BOOK_UNAVAILABLE);
			}
			reservedInventoryId = reservedInventory._id;

			const robot = await this.robotModel
				.findOne({
					status: RobotStatus.IDLE,
					isOnline: true,
				})
				.sort({ updatedAt: 1 })
				.exec();

			const isBorrow = input.requestType === RequestType.BORROW;
			const expectedDestinationType = isBorrow
				? DeliveryDestinationType.STUDENT_DESK
				: DeliveryDestinationType.RECEPTION;
			if (
				input.destinationType &&
				input.destinationType !== expectedDestinationType
			) {
				throw new BadRequestException(RequestErrorCode.INVALID_DESTINATION);
			}
			const payload: T = {
				bookId,
				sourceInventoryId: reservedInventory._id,
				requestType: input.requestType,
				memberId: memberId ?? null,
				sessionId: input.sessionId ?? null,
				destinationDeskId: isBorrow ? input.destinationDeskId ?? null : null,
				destinationType: input.destinationType ?? expectedDestinationType,
				destination: isBorrow
					? input.destination
					: REQUEST_RECEPTION_DESTINATION,
				paymentStatus: isBorrow
					? PaymentStatus.NOT_REQUIRED
					: PaymentStatus.PAY_AT_RECEPTION,
				status: robot ? RequestStatus.ASSIGNED : RequestStatus.QUEUED,
				timeline: [
					this.buildTimelineItem(RequestStatus.QUEUED, 'Request created.'),
				],
			};

			if (robot) {
				payload.robotId = robot._id;
				payload.timeline.push(
					this.buildTimelineItem(
						RequestStatus.ASSIGNED,
						'Robot assigned for delivery request.',
					),
				);
			}

			const created: RequestTask = await this.requestModel.create(payload);
			createdRequestId = created._id;

			if (robot) {
				await this.robotModel
					.findOneAndUpdate(
						{ _id: robot._id },
						{
							status: RobotStatus.ASSIGNED,
							currentRequestId: created._id,
						},
						{ new: true },
					)
					.exec();
				this.mqttRobotService.subscribeToRobotTopics(robot.robotId);
				this.mqttRobotService.publishCommand(
					robot.robotId,
					this.buildDeliveryCommandPayload(book, reservedInventory, created),
				);
			}

			return created;
		} catch (err) {
			if (reservedInventoryId && !createdRequestId) {
				await this.releaseInventoryReservation(reservedInventoryId);
			}
			const msg = err instanceof Error ? err.message : String(err);
			console.log('Error, Service.model:', msg);
			if (
				err instanceof BadRequestException ||
				err instanceof ForbiddenException ||
				err instanceof InternalServerErrorException
			) {
				throw err;
			}
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getRequestById(requestId: ObjectId): Promise<RequestTask> {
		const result = await this.requestModel
			.aggregate([
				{ $match: { _id: requestId } },
				...this.buildRequestNestedLookupPipeline(),
			])
			.exec();
		if (!result.length)
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async getRequests(input: RequestsInquiry): Promise<Requests> {
		const match: T = {};
		const sort: T = {
			[input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
		};
		this.shapeMatchQuery(match, input);

		const result = await this.requestModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							...this.buildRequestNestedLookupPipeline(),
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length)
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async getSessionRequests(
		input: SessionRequestsInquiry,
		memberId?: ObjectId,
	): Promise<Requests> {
		const match: T = {};
		const sort: T = {
			[input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
		};

		if (memberId) {
			match.memberId = memberId;
		} else if (input.sessionId) {
			match.sessionId = input.sessionId;
		} else {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const result = await this.requestModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							...this.buildRequestNestedLookupPipeline(),
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length)
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async updateRequestStatus(
		requestId: ObjectId,
		input: UpdateRequestStatusInput,
	): Promise<RequestTask> {
		const target = await this.requestModel.findOne({ _id: requestId }).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (target.status === input.status) return target;
		if (
			[
				RequestStatus.COMPLETED,
				RequestStatus.FAILED,
				RequestStatus.CANCELLED,
			].includes(target.status)
		) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		const update: T = {
			status: input.status,
		};

		if (input.paymentStatus) {
			update.paymentStatus = input.paymentStatus;
		}

		if (input.errorCode) {
			update.error = {
				code: input.errorCode,
				message: input.message ?? '',
				timestamp: new Date(),
			};
		}

		if (input.status === RequestStatus.COMPLETED) {
			await this.applyCompletionToInventory(target);
			if (
				target.requestType === RequestType.PURCHASE &&
				!input.paymentStatus
			) {
				update.paymentStatus = PaymentStatus.PAID;
			}
		}

		if (
			input.status === RequestStatus.FAILED ||
			input.status === RequestStatus.CANCELLED
		) {
			await this.releaseInventoryReservation(target.sourceInventoryId);
			if (input.status === RequestStatus.CANCELLED && !input.paymentStatus) {
				update.paymentStatus = PaymentStatus.CANCELLED;
			}
		}

		const result = await this.requestModel
			.findOneAndUpdate(
				{ _id: requestId },
				{
					$set: update,
					$push: {
						timeline: this.buildTimelineItem(input.status, input.message),
					},
				},
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		this.emitRequestUpdatedPayload(result);

		if (
			target.robotId &&
			[
				RequestStatus.COMPLETED,
				RequestStatus.FAILED,
				RequestStatus.CANCELLED,
			].includes(input.status)
		) {
			const releasedRobot = await this.releaseRobot(target.robotId);
			if (releasedRobot) {
				const nextAssignedRequest = await this.tryAssignNextQueuedRequest(releasedRobot);
				if (nextAssignedRequest) {
					this.emitRequestUpdatedPayload(nextAssignedRequest);
				} else if (input.status === RequestStatus.COMPLETED) {
					await this.startRobotReturnToDock(releasedRobot, result._id);
				}
			}
		}

		return result;
	}

	public async cancelRequest(
		requestId: ObjectId,
		input: CancelRequestInput,
		authMember?: Member,
	): Promise<RequestTask> {
		const target = await this.requestModel.findOne({ _id: requestId }).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (
			[
				RequestStatus.COMPLETED,
				RequestStatus.FAILED,
				RequestStatus.CANCELLED,
			].includes(target.status)
		) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		const isAdmin = authMember?.memberType === MemberType.ADMIN;
		if (!isAdmin) {
			if (authMember?._id && target.memberId) {
				const ownerMatches = String(target.memberId) === String(authMember._id);
				if (!ownerMatches) throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
			} else if (target.sessionId) {
				if (!input.sessionId || input.sessionId !== target.sessionId) {
					throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
				}
			} else {
				throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
			}
		}

		const result = await this.requestModel
			.findOneAndUpdate(
				{ _id: requestId },
				{
					$set: {
						status: RequestStatus.CANCELLED,
						paymentStatus: PaymentStatus.CANCELLED,
						error: {
							code: RequestErrorCode.USER_CANCELLED,
							message: input.reason ?? 'Cancelled by user.',
							timestamp: new Date(),
						},
					},
					$push: {
						timeline: this.buildTimelineItem(
							RequestStatus.CANCELLED,
							input.reason ?? 'Request cancelled.',
						),
					},
				},
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		await this.releaseInventoryReservation(target.sourceInventoryId);

		if (target.robotId) {
			const robot = await this.robotModel
				.findOne({ _id: target.robotId })
				.lean()
				.exec();
			await this.releaseRobot(target.robotId);
			if (robot?.robotId) {
				const cancelPayload: MqttCancelCommandPayload = {
					type: 'CANCEL_TASK',
					requestId: String(target._id),
				};
				this.mqttRobotService.publishCommand(robot.robotId, cancelPayload);
			}
		}

		return result;
	}

	private shapeMatchQuery(match: T, input: RequestsInquiry): void {
		if (!input.search || Object.keys(input.search).length === 0) return;

		const {
			status,
			requestType,
			destinationType,
			paymentStatus,
			bookId,
			sourceInventoryId,
			robotId,
			memberId,
			sessionId,
			destinationDeskId,
		} = input.search;

		if (status) match.status = status;
		if (requestType) match.requestType = requestType;
		if (destinationType) match.destinationType = destinationType;
		if (paymentStatus) match.paymentStatus = paymentStatus;
		if (bookId) match.bookId = shapeIntoMongoObjectId(bookId);
		if (sourceInventoryId)
			match.sourceInventoryId = shapeIntoMongoObjectId(sourceInventoryId);
		if (robotId) match.robotId = shapeIntoMongoObjectId(robotId);
		if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
		if (sessionId) match.sessionId = sessionId;
		if (destinationDeskId)
			match.destinationDeskId = { $regex: new RegExp(destinationDeskId, 'i') };
	}

	private buildRequestNestedLookupPipeline(): PipelineStage.FacetPipelineStage[] {
		return [
			{
				$lookup: {
					from: 'books',
					localField: 'bookId',
					foreignField: '_id',
					pipeline: [
						{
							$project: {
								_id: 1,
								bookTitle: 1,
								bookAuthor: 1,
								bookImages: 1,
								bookCallNumber: 1,
								bookStatus: 1,
								bookType: 1,
								bookCategory: 1,
							},
						},
					],
					as: 'bookData',
				},
			},
			{
				$unwind: {
					path: '$bookData',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: 'robots',
					localField: 'robotId',
					foreignField: '_id',
					pipeline: [
						{
							$project: {
								_id: 1,
								robotId: 1,
								status: 1,
								isOnline: 1,
								battery: 1,
								currentPose: 1,
								lastSeenAt: 1,
							},
						},
					],
					as: 'robotData',
				},
			},
			{
				$unwind: {
					path: '$robotData',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: 'bookInventories',
					localField: 'sourceInventoryId',
					foreignField: '_id',
					pipeline: [
						{
							$project: {
								_id: 1,
								bookInventoryType: 1,
								bookInventoryStatus: 1,
								bookLocation: 1,
								bookShelf: 1,
								bookPickup: 1,
								bookTotalQuantity: 1,
								bookReservedQuantity: 1,
								bookBorrowedQuantity: 1,
								bookSoldQuantity: 1,
							},
						},
					],
					as: 'inventoryData',
				},
			},
			{
				$unwind: {
					path: '$inventoryData',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: 'members',
					localField: 'memberId',
					foreignField: '_id',
					pipeline: [
						{
							$project: {
								_id: 1,
								memberNick: 1,
								memberImage: 1,
								memberType: 1,
								memberStatus: 1,
							},
						},
					],
					as: 'memberData',
				},
			},
			{
				$unwind: {
					path: '$memberData',
					preserveNullAndEmptyArrays: true,
				},
			},
		];
	}

	private buildTimelineItem(status: RequestStatus, message?: string): T {
		return {
			status,
			message: message ?? '',
			timestamp: new Date(),
		};
	}

	private async reserveInventory(input: {
		bookId: ObjectId;
		requestType: RequestType;
		sourceInventoryId?: ObjectId;
	}): Promise<BookInventory | null> {
		const { bookId, requestType, sourceInventoryId } = input;
		const expectedType =
			requestType === RequestType.BORROW
				? BookInventoryType.LIBRARY
				: BookInventoryType.COMMERCIAL;

		const filter: T = {
			bookId,
			bookInventoryType: expectedType,
			bookInventoryStatus: BookInventoryStatus.AVAILABLE,
			deletedAt: null,
			$expr: {
				$gt: [
					{
						$subtract: [
							'$bookTotalQuantity',
							{
								$add: [
									'$bookSoldQuantity',
									'$bookReservedQuantity',
									'$bookBorrowedQuantity',
								],
							},
						],
					},
					0,
				],
			},
		};
		if (sourceInventoryId) filter._id = sourceInventoryId;

		const result = await this.bookInventoryModel
			.findOneAndUpdate(filter, { $inc: { bookReservedQuantity: 1 } }, { new: true })
			.exec();
		if (!result) return null;

		await this.syncInventoryStatusByAvailability(result._id);
		return result;
	}

	private async releaseInventoryReservation(
		sourceInventoryId: ObjectId,
	): Promise<void> {
		const updated = await this.bookInventoryModel
			.findOneAndUpdate(
				{
					_id: sourceInventoryId,
					deletedAt: null,
					bookReservedQuantity: { $gt: 0 },
				},
				{ $inc: { bookReservedQuantity: -1 } },
				{ new: true },
			)
			.exec();

		if (updated) {
			await this.syncInventoryStatusByAvailability(updated._id);
		}
	}

	private async applyCompletionToInventory(request: RequestTask): Promise<void> {
		if (request.requestType === RequestType.BORROW) {
			const updated = await this.bookInventoryModel
				.findOneAndUpdate(
					{
						_id: request.sourceInventoryId,
						deletedAt: null,
						bookReservedQuantity: { $gt: 0 },
					},
					{ $inc: { bookReservedQuantity: -1, bookBorrowedQuantity: 1 } },
					{ new: true },
				)
				.exec();
			if (updated) {
				await this.syncInventoryStatusByAvailability(updated._id);
			}
			return;
		}

		if (request.requestType === RequestType.PURCHASE) {
			const updated = await this.bookInventoryModel
				.findOneAndUpdate(
					{
						_id: request.sourceInventoryId,
						deletedAt: null,
						bookReservedQuantity: { $gt: 0 },
					},
					{ $inc: { bookReservedQuantity: -1, bookSoldQuantity: 1 } },
					{ new: true },
				)
				.exec();
			if (updated) {
				await this.syncInventoryStatusByAvailability(updated._id);
			}
		}
	}

	private async syncInventoryStatusByAvailability(
		sourceInventoryId: ObjectId,
	): Promise<void> {
		const inventory = await this.bookInventoryModel
			.findOne({
				_id: sourceInventoryId,
				deletedAt: null,
			})
			.lean()
			.exec();
		if (!inventory) return;

		const availableStock = this.calculateAvailableStock(inventory);
		const nextStatus =
			availableStock > 0
				? BookInventoryStatus.AVAILABLE
				: BookInventoryStatus.RESERVED;
		if (inventory.bookInventoryStatus === nextStatus) return;

		await this.bookInventoryModel
			.findOneAndUpdate(
				{ _id: sourceInventoryId },
				{ bookInventoryStatus: nextStatus },
				{ new: true },
			)
			.exec();
	}

	private calculateAvailableStock(inventory: Partial<BookInventory>): number {
		const total = inventory.bookTotalQuantity ?? 0;
		const sold = inventory.bookSoldQuantity ?? 0;
		const reserved = inventory.bookReservedQuantity ?? 0;
		const borrowed = inventory.bookBorrowedQuantity ?? 0;
		return total - sold - reserved - borrowed;
	}

	private async releaseRobot(robotId: ObjectId): Promise<Robot | null> {
		return await this.robotModel
			.findOneAndUpdate(
				{ _id: robotId },
				{
					status: RobotStatus.IDLE,
					currentRequestId: null,
				},
				{ new: true },
			)
			.exec();
	}

	private emitRequestUpdatedPayload(request: RequestTask): void {
		const latestTimeline = request.timeline?.[request.timeline.length - 1];
		this.robotGateway.emitRequestUpdated(String(request._id), {
			requestId: String(request._id),
			status: request.status,
			message: latestTimeline?.message ?? '',
			timestamp:
				latestTimeline?.timestamp instanceof Date
					? latestTimeline.timestamp.toISOString()
					: new Date().toISOString(),
			timeline: request.timeline ?? [],
		});
	}

	private async tryAssignNextQueuedRequest(robot: Robot): Promise<RequestTask | null> {
		const nextQueuedRequest = await this.requestModel
			.findOneAndUpdate(
				{
					status: RequestStatus.QUEUED,
					$or: [{ robotId: null }, { robotId: { $exists: false } }],
				},
				{
					$set: {
						status: RequestStatus.ASSIGNED,
						robotId: robot._id,
					},
					$push: {
						timeline: this.buildTimelineItem(
							RequestStatus.ASSIGNED,
							'Robot assigned for delivery request.',
						),
					},
				},
				{ new: true },
			)
			.sort({ createdAt: 1 })
			.exec();

		if (!nextQueuedRequest) {
			return null;
		}

		await this.robotModel
			.findOneAndUpdate(
				{ _id: robot._id },
				{
					$set: {
						status: RobotStatus.ASSIGNED,
						currentRequestId: nextQueuedRequest._id,
					},
				},
				{ new: true },
			)
			.exec();

		this.mqttRobotService.subscribeToRobotTopics(robot.robotId);

		const [book, sourceInventory] = await Promise.all([
			this.bookModel
				.findOne({
					_id: nextQueuedRequest.bookId,
					deletedAt: null,
					bookStatus: { $ne: BookStatus.DELETED },
				})
				.lean()
				.exec(),
			this.bookInventoryModel
				.findOne({
					_id: nextQueuedRequest.sourceInventoryId,
					deletedAt: null,
				})
				.lean()
				.exec(),
		]);

		if (book && sourceInventory) {
			this.mqttRobotService.publishCommand(
				robot.robotId,
				this.buildDeliveryCommandPayload(book, sourceInventory, nextQueuedRequest),
			);
		}

		return nextQueuedRequest;
	}

	private async startRobotReturnToDock(
		robot: Robot,
		completedRequestId: ObjectId,
	): Promise<void> {
		await this.robotModel
			.findOneAndUpdate(
				{ _id: robot._id },
				{
					$set: {
						status: RobotStatus.RETURNING,
						currentRequestId: null,
						isOnline: true,
						lastSeenAt: new Date(),
					},
				},
				{ new: true },
			)
			.exec();

		const requestId = String(completedRequestId);
		const timestamp = new Date().toISOString();
		this.robotGateway.emitRobotStatus(requestId, {
			robotId: robot.robotId,
			requestId,
			status: RobotStatus.RETURNING,
			message: 'Returning to charging dock.',
			timestamp,
		});

		this.mqttRobotService.publishCommand(
			robot.robotId,
			this.buildReturnToDockCommandPayload(requestId),
		);
	}

	private buildDeliveryCommandPayload(
		book: Book,
		reservedInventory: BookInventory,
		request: RequestTask,
	): MqttCommandPayload {
		return {
			type: 'DELIVERY_TASK',
			requestId: String(request._id),
			book: {
				bookId: String(book._id),
				title: book.bookTitle,
				callNumber: book.bookCallNumber,
			},
			pickup: {
				floorId: reservedInventory.bookLocation.floorId,
				x: reservedInventory.bookLocation.x,
				y: reservedInventory.bookLocation.y,
				theta: reservedInventory.bookLocation.theta,
				gripperOpenWidthCm: reservedInventory.bookPickup.gripperOpenWidthCm,
				gripperCloseWidthCm: reservedInventory.bookPickup.gripperCloseWidthCm,
				gripHoldSeconds: reservedInventory.bookPickup.gripHoldSeconds,
				pickupDirection: reservedInventory.bookPickup.pickupDirection,
			},
			dropoff: {
				seatId:
					request.destinationDeskId ??
					String(request.destinationType ?? DeliveryDestinationType.RECEPTION),
				x: request.destination.x,
				y: request.destination.y,
				theta: request.destination.theta,
			},
		};
	}

	private buildReturnToDockCommandPayload(
		requestId: string,
	): MqttReturnToDockCommandPayload {
		return {
			type: 'RETURN_TO_DOCK',
			requestId,
			dock: CHARGING_DOCK_DESTINATION,
		};
	}
}
