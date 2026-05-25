import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
	LostItem,
	LostItems,
} from '../../libs/dto/lost-item/lost-item';
import { LostItemsInquiry } from '../../libs/dto/lost-item/lost-item.input';
import { UpdateLostItemStatusInput } from '../../libs/dto/lost-item/lost-item.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import {
	LostItemEventType,
	LostItemObjectType,
	LostItemPriority,
	LostItemStatus,
} from '../../libs/enums/lost-item.enum';
import { T } from '../../libs/types/common';

export interface LostItemLocationInput {
	source?: string;
	floorId?: string;
	x?: number | null;
	y?: number | null;
	patrolCheckpoint?: string;
}

export interface CreateLostItemFromPatrolEventInput {
	robotId: string;
	eventType: LostItemEventType;
	objectType: LostItemObjectType;
	confidence: number;
	priority: LostItemPriority;
	detectedAt: Date;
	snapshotPath?: string;
	snapshotUrl?: string;
	location?: LostItemLocationInput;
	status: LostItemStatus;
	notes?: string;
}

@Injectable()
export class LostItemService {
	constructor(
		@InjectModel('LostItem')
		private readonly lostItemModel: Model<LostItem>,
	) {}

	public async createLostItemFromPatrolEvent(
		input: CreateLostItemFromPatrolEventInput,
	): Promise<LostItem> {
		const result = await this.lostItemModel.create(input);
		if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
		return result;
	}

	public async getLostItems(input: LostItemsInquiry): Promise<LostItems> {
		const match: T = {};
		const sort: T = {
			[input?.sort ?? 'detectedAt']: input?.direction ?? Direction.DESC,
		};
		this.shapeMatchQuery(match, input);

		const result = await this.lostItemModel
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

	public async updateLostItemStatus(
		input: UpdateLostItemStatusInput,
	): Promise<LostItem> {
		const result = await this.lostItemModel
			.findOneAndUpdate(
				{ _id: input.lostItemId },
				{ status: input.status },
				{ new: true },
			)
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	private shapeMatchQuery(match: T, input: LostItemsInquiry): void {
		if (!input.search || Object.keys(input.search).length === 0) return;

		const {
			status,
			objectType,
			priority,
			robotId,
			detectedAtFrom,
			detectedAtTo,
		} = input.search;

		if (status) match.status = status;
		if (objectType) match.objectType = objectType;
		if (priority) match.priority = priority;
		if (robotId) match.robotId = { $regex: new RegExp(robotId, 'i') };

		if (detectedAtFrom || detectedAtTo) {
			match.detectedAt = {};
			if (detectedAtFrom) match.detectedAt.$gte = detectedAtFrom;
			if (detectedAtTo) match.detectedAt.$lte = detectedAtTo;
		}
	}
}
