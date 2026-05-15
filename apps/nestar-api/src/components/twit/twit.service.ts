import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Twit, Twits } from '../../libs/dto/twit/twit';
import {
	AllTwitsInquiry,
	CreateTwitInput,
	TwitInquiry,
	TwitsInquiry,
} from '../../libs/dto/twit/twit.input';
import { TwitUpdate } from '../../libs/dto/twit/twit.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { lookupMember, shapeIntoMongoObjectId } from '../../libs/config';

interface FollowDoc {
	followerId: ObjectId;
	followingId: ObjectId;
}

@Injectable()
export class TwitService {
	constructor(
		@InjectModel('Twit') private readonly twitModel: Model<Twit>,
		@InjectModel('Follow') private readonly followModel: Model<FollowDoc>,
	) {}

	public async createTwit(
		memberId: ObjectId,
		input: CreateTwitInput,
	): Promise<Twit> {
		const text = input.text?.trim();
		if (!text || text.length > 280)
			throw new BadRequestException(Message.BAD_REQUEST);

		try {
			return await this.twitModel.create({
				memberId,
				text,
				image: input.image ?? '',
			});
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			console.log('Error, Service.model:', msg);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getTwit(input: TwitInquiry): Promise<Twit> {
		const result = await this.twitModel
			.aggregate([
				{ $match: { _id: input._id, deletedAt: null } },
				lookupMember,
				{ $unwind: '$memberData' },
			])
			.exec();
		const targetTwit: Twit = result[0];
		if (!targetTwit)
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return targetTwit;
	}

	public async getTwits(memberId: ObjectId, input: TwitsInquiry): Promise<Twits> {
		const followingIds: ObjectId[] = await this.followModel
			.distinct('followingId', { followerId: memberId })
			.exec();
		const feedMemberIds: ObjectId[] = [memberId, ...followingIds];
		const sort: T = {
			[input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
		};
		const match: T = {
			memberId: { $in: feedMemberIds },
			deletedAt: null,
		};

		if (input.search?.text) {
			match.text = { $regex: new RegExp(input.search.text.trim(), 'i') };
		}

		const result = await this.twitModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
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

	public async getMemberTwits(
		viewerId: ObjectId | null,
		input: TwitsInquiry,
	): Promise<Twits> {
		const targetMemberId = input.search?.memberId
			? shapeIntoMongoObjectId(input.search.memberId)
			: viewerId;
		if (!targetMemberId) throw new BadRequestException(Message.BAD_REQUEST);

		const sort: T = {
			[input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
		};
		const match: T = {
			memberId: targetMemberId,
			deletedAt: null,
		};
		if (input.search?.text) {
			match.text = { $regex: new RegExp(input.search.text.trim(), 'i') };
		}

		const result = await this.twitModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
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

	public async likeTwit(memberId: ObjectId, twitId: ObjectId): Promise<Twit> {
		const target = await this.twitModel
			.findOne({ _id: twitId, deletedAt: null })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const alreadyLiked = target.likes.some(
			(likeMemberId: ObjectId) => likeMemberId.toString() === memberId.toString(),
		);

		const result = alreadyLiked
			? await this.twitModel
					.findOneAndUpdate(
						{ _id: twitId, likes: memberId, deletedAt: null },
						{ $pull: { likes: memberId }, $inc: { likeCount: -1 } },
						{ new: true },
					)
					.exec()
			: await this.twitModel
					.findOneAndUpdate(
						{ _id: twitId, likes: { $ne: memberId }, deletedAt: null },
						{ $addToSet: { likes: memberId }, $inc: { likeCount: 1 } },
						{ new: true },
					)
					.exec();

		if (!result)
			throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	public async deleteTwit(memberId: ObjectId, twitId: ObjectId): Promise<Twit> {
		const result = await this.twitModel
			.findOneAndUpdate(
				{ _id: twitId, memberId, deletedAt: null },
				{ deletedAt: new Date() },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result;
	}

	public async getAllTwitsByAdmin(input: AllTwitsInquiry): Promise<Twits> {
		const sort: T = {
			[input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
		};
		const match: T = {};

		if (input.search?.text) {
			match.text = { $regex: new RegExp(input.search.text.trim(), 'i') };
		}
		if (input.search?.memberId) {
			match.memberId = shapeIntoMongoObjectId(input.search.memberId);
		}
		if (input.search?.isDeleted !== undefined) {
			match.deletedAt = input.search.isDeleted ? { $ne: null } : null;
		}

		const result = await this.twitModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
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

	public async updateTwitByAdmin(input: TwitUpdate): Promise<Twit> {
		const update: T = {};
		if (input.text !== undefined) update.text = input.text.trim();
		if (input.image !== undefined) update.image = input.image;

		if (!Object.keys(update).length)
			throw new BadRequestException(Message.BAD_REQUEST);

		const result = await this.twitModel
			.findOneAndUpdate(
				{ _id: input._id, deletedAt: null },
				update,
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async removeTwitByAdmin(twitId: ObjectId): Promise<Twit> {
		const result = await this.twitModel
			.findOneAndUpdate(
				{ _id: twitId, deletedAt: null },
				{ deletedAt: new Date() },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}
}
