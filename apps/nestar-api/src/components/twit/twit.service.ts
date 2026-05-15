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
import { TwitFeedType } from '../../libs/enums/twit.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { T } from '../../libs/types/common';
import {
	lookupAuthMemberLiked,
	lookupMember,
	shapeIntoMongoObjectId,
} from '../../libs/config';
import { ViewService } from '../view/view.service';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';

const normalizeMemberDataCounters = {
	$addFields: {
		'memberData.memberBooks': { $ifNull: ['$memberData.memberBooks', 0] },
		'memberData.memberTwits': { $ifNull: ['$memberData.memberTwits', 0] },
		'memberData.memberFollowers': { $ifNull: ['$memberData.memberFollowers', 0] },
		'memberData.memberFollowings': { $ifNull: ['$memberData.memberFollowings', 0] },
		'memberData.memberPoints': { $ifNull: ['$memberData.memberPoints', 0] },
		'memberData.memberLikes': { $ifNull: ['$memberData.memberLikes', 0] },
		'memberData.memberViews': { $ifNull: ['$memberData.memberViews', 0] },
		'memberData.memberComments': { $ifNull: ['$memberData.memberComments', 0] },
		'memberData.memberRank': { $ifNull: ['$memberData.memberRank', 0] },
		'memberData.memberWarnings': { $ifNull: ['$memberData.memberWarnings', 0] },
		'memberData.memberBlocks': { $ifNull: ['$memberData.memberBlocks', 0] },
	},
};

const normalizeTwitCounters = {
	$addFields: {
		likeCount: { $ifNull: ['$likeCount', 0] },
		viewCount: { $ifNull: ['$viewCount', 0] },
	},
};

const projectMeLiked = {
	$addFields: {
		meLiked: { $gt: [{ $size: '$meLiked' }, 0] },
	},
};

@Injectable()
export class TwitService {
	constructor(
		@InjectModel('Twit') private readonly twitModel: Model<Twit>,
		@InjectModel('Follow') private readonly followModel: Model<{ followingId: ObjectId }>,
		private readonly viewService: ViewService,
		private readonly likeService: LikeService,
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

	public async getTwit(
		memberId: ObjectId | null,
		input: TwitInquiry,
	): Promise<Twit> {
		const result = await this.twitModel
			.aggregate([
				{ $match: { _id: input._id, deletedAt: null } },
				normalizeTwitCounters,
				lookupAuthMemberLiked(memberId),
				projectMeLiked,
				lookupMember,
				{ $unwind: '$memberData' },
				normalizeMemberDataCounters,
			])
			.exec();
		const targetTwit: Twit = result[0];
		if (!targetTwit)
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = {
				memberId,
				viewRefId: input._id,
				viewGroup: ViewGroup.TWIT,
			};
			const newView = await this.viewService.recordView(viewInput);
			if (newView) {
				await this.twitModel
					.findOneAndUpdate(
						{ _id: input._id, deletedAt: null },
						{ $inc: { viewCount: 1 } },
						{ new: true },
					)
					.exec();
				targetTwit.viewCount = (targetTwit.viewCount ?? 0) + 1;
			}
		}

		return targetTwit;
	}

	public async getTwits(
		viewerId: ObjectId | null,
		input: TwitsInquiry,
	): Promise<Twits> {
		const sort: T = {
			[input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
		};
		const match: T = {
			deletedAt: null,
		};
		const feedType = input.feedType ?? TwitFeedType.FOR_YOU;

		let followingMemberIds: ObjectId[] | null = null;
		if (feedType === TwitFeedType.FOLLOWING) {
			if (!viewerId) {
				followingMemberIds = [];
			} else {
				followingMemberIds = await this.followModel
					.distinct('followingId', { followerId: viewerId })
					.exec();
			}
		}

		if (input.search?.memberId) {
			const targetMemberId = shapeIntoMongoObjectId(input.search.memberId);
			if (followingMemberIds) {
				match.memberId = {
					$in: followingMemberIds.filter(
						(memberId) => memberId.toString() === targetMemberId.toString(),
					),
				};
			} else {
				match.memberId = targetMemberId;
			}
		} else if (followingMemberIds) {
			match.memberId = { $in: followingMemberIds };
		}

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
							normalizeTwitCounters,
							lookupAuthMemberLiked(viewerId),
							projectMeLiked,
							lookupMember,
							{ $unwind: '$memberData' },
							normalizeMemberDataCounters,
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
							normalizeTwitCounters,
							lookupMember,
							{ $unwind: '$memberData' },
							normalizeMemberDataCounters,
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

		const input: LikeInput = {
			memberId,
			likeRefId: twitId,
			likeGroup: LikeGroup.TWIT,
		};
		const modifier = await this.likeService.toggleLike(input);
		const result = await this.twitModel
			.findOneAndUpdate(
				{ _id: twitId, deletedAt: null },
				[
					{
						$set: {
							likeCount: {
								$max: [
									{
										$add: [{ $ifNull: ['$likeCount', 0] }, modifier],
									},
									0,
								],
							},
						},
					},
				],
				{ new: true },
			)
			.exec();

		if (!result)
			throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return this.getTwit(memberId, { _id: twitId });
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
							normalizeTwitCounters,
							lookupMember,
							{ $unwind: '$memberData' },
							normalizeMemberDataCounters,
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
