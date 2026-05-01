import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { BookStatus } from '../../libs/enums/book.enum';
import { RobotStatus } from '../../libs/enums/robot.enum';
import { MemberType } from '../../libs/enums/member.enum';
import {
	RequestErrorCode,
	RequestStatus,
} from '../../libs/enums/request.enum';
import { T } from '../../libs/types/common';
import { shapeIntoMongoObjectId } from '../../libs/config';
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

@Injectable()
export class RequestService {
	constructor(
		@InjectModel('Request') private readonly requestModel: Model<RequestTask>,
		@InjectModel('Book') private readonly bookModel: Model<Book>,
		@InjectModel('Robot') private readonly robotModel: Model<Robot>,
	) {}

	public async createDeliveryRequest(
		input: CreateDeliveryRequestInput,
		memberId?: ObjectId,
	): Promise<RequestTask> {
		try {
			if (!memberId && !input.sessionId) {
				throw new BadRequestException(Message.BAD_REQUEST);
			}

			const bookId = shapeIntoMongoObjectId(input.bookId);
			const book = await this.bookModel.findOne({ _id: bookId }).exec();
			if (!book) throw new BadRequestException(RequestErrorCode.BOOK_UNAVAILABLE);
			if (!book.available || book.bookStatus !== BookStatus.AVAILABLE) {
				throw new BadRequestException(RequestErrorCode.BOOK_UNAVAILABLE);
			}

			if (!input.destinationDeskId || !input.destination?.floorId) {
				throw new BadRequestException(RequestErrorCode.INVALID_DESTINATION);
			}

			const robot = await this.robotModel
				.findOne({
					status: RobotStatus.IDLE,
					isOnline: true,
				})
				.sort({ updatedAt: 1 })
				.exec();

			const payload: T = {
				bookId,
				memberId: memberId ?? null,
				sessionId: input.sessionId ?? null,
				destinationDeskId: input.destinationDeskId,
				destination: input.destination,
				status: robot ? RequestStatus.ASSIGNED : RequestStatus.QUEUED,
				timeline: [this.buildTimelineItem(RequestStatus.QUEUED, 'Request created.')],
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

				await this.bookModel
					.findOneAndUpdate(
						{ _id: bookId },
						{
							available: false,
							bookStatus: BookStatus.RESERVED,
						},
						{ new: true },
					)
					.exec();
			}

			return created;
		} catch (err) {
			console.log('Error, Service.model:', err.message);
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
		const update: T = {
			status: input.status,
		};

		if (input.errorCode) {
			update.error = {
				code: input.errorCode,
				message: input.message ?? '',
				timestamp: new Date(),
			};
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

		if (target.robotId) {
			await this.robotModel
				.findOneAndUpdate(
					{ _id: target.robotId },
					{
						status: RobotStatus.IDLE,
						currentRequestId: null,
					},
					{ new: true },
				)
				.exec();
		}

		if (target.bookId) {
			await this.bookModel
				.findOneAndUpdate(
					{ _id: target.bookId },
					{
						available: true,
						bookStatus: BookStatus.AVAILABLE,
					},
					{ new: true },
				)
				.exec();
		}

		return result;
	}

	private shapeMatchQuery(match: T, input: RequestsInquiry): void {
		if (!input.search || Object.keys(input.search).length === 0) return;

		const { status, bookId, robotId, memberId, sessionId, destinationDeskId } =
			input.search;

		if (status) match.status = status;
		if (bookId) match.bookId = shapeIntoMongoObjectId(bookId);
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
}
