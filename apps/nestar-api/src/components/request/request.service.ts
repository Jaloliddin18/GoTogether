import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
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

@Injectable()
export class RequestService {
	constructor(
		@InjectModel('Request') private readonly requestModel: Model<RequestTask>,
		@InjectModel('Book') private readonly bookModel: Model<Book>,
		@InjectModel('BookInventory')
		private readonly bookInventoryModel: Model<BookInventory>,
		@InjectModel('Robot') private readonly robotModel: Model<Robot>,
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
			const payload: T = {
				bookId,
				sourceInventoryId: reservedInventory._id,
				requestType: input.requestType,
				memberId: memberId ?? null,
				sessionId: input.sessionId ?? null,
				destinationDeskId: isBorrow ? input.destinationDeskId ?? null : null,
				destinationType: isBorrow
					? DeliveryDestinationType.STUDENT_DESK
					: DeliveryDestinationType.RECEPTION,
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
		const result = await this.requestModel.findOne({ _id: requestId }).exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result;
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

		if (
			target.robotId &&
			[
				RequestStatus.COMPLETED,
				RequestStatus.FAILED,
				RequestStatus.CANCELLED,
			].includes(input.status)
		) {
			await this.releaseRobot(target.robotId);
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
		return result;
	}

	public async cancelRequest(
		requestId: ObjectId,
		input: CancelRequestInput,
		authMember?: Member,
	): Promise<RequestTask> {
		const target = await this.requestModel.findOne({ _id: requestId }).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (target.status === RequestStatus.COMPLETED) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}
		if (target.status === RequestStatus.CANCELLED) {
			return target;
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
			await this.releaseRobot(target.robotId);
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

	private async releaseRobot(robotId: ObjectId): Promise<void> {
		await this.robotModel
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
}
