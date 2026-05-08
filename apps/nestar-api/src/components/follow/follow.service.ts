import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import {
	Follower,
	Followers,
	Following,
	Followings,
} from '../../libs/dto/follow/follow';
import { MemberService } from '../member/member.service';
import { Direction, Message } from '../../libs/enums/common.enum';
import { FollowInquiry } from '../../libs/dto/follow/follow.input';
import { T } from '../../libs/types/common';
import {
	lookupAuthMemberFollowed,
	lookupFollowerData,
	lookupFollowingData,
} from '../../libs/config';

@Injectable()
export class FollowService {
	constructor(
		@InjectModel('Follow')
		private readonly followModel: Model<Follower | Following>,
		private readonly memberService: MemberService,
	) {}

	public async followMember(
		followerId: ObjectId,
		followingId: ObjectId,
	): Promise<Follower> {
		if (followerId.toString() === followingId.toString())
			throw new InternalServerErrorException(Message.SELF_SUBSCRIPTION_DENIED);

		await this.memberService.getMember(null, followingId);
		const existing = await this.followModel
			.findOne({ followerId, followingId })
			.exec();
		if (existing) return existing as Follower;

		return await this.registerFollow(followerId, followingId);
	}

	public async unfollowMember(
		followerId: ObjectId,
		followingId: ObjectId,
	): Promise<Follower> {
		await this.memberService.getMember(null, followingId);

		const result = await this.followModel
			.findOneAndDelete({
				followerId: followerId,
				followingId: followingId,
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result;
	}

	private async registerFollow(
		followerId: ObjectId,
		followingId: ObjectId,
	): Promise<Follower> {
		try {
			return await this.followModel.create({
				followerId,
				followingId,
			});
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			console.log('Error, Service.model:', msg);
			// duplicate follow can happen during concurrent requests: return existing row
			if (msg.includes('E11000')) {
				const existing = await this.followModel
					.findOne({ followerId, followingId })
					.exec();
				if (existing) return existing as Follower;
			}
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getFollowing(
		targetMemberId: ObjectId,
		viewerId: ObjectId | null,
		input: FollowInquiry,
	): Promise<Followings> {
		await this.memberService.getMember(null, targetMemberId);
		const { page, limit } = input;
		const match: T = { followerId: targetMemberId };

		const result = await this.followModel
			.aggregate([
				{ $match: match },
				{ $sort: { createdAt: Direction.DESC } },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							lookupAuthMemberFollowed({
								followerId: viewerId,
								followingId: '$followingId',
							}),
							lookupFollowingData,
							{ $unwind: '$followingData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result[0];
	}

	public async getFollowers(
		targetMemberId: ObjectId,
		viewerId: ObjectId | null,
		input: FollowInquiry,
	): Promise<Followers> {
		await this.memberService.getMember(null, targetMemberId);
		const { page, limit } = input;
		const match: T = { followingId: targetMemberId };

		const result = await this.followModel
			.aggregate([
				{ $match: match },
				{ $sort: { createdAt: Direction.DESC } },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							lookupAuthMemberFollowed({
								followerId: viewerId,
								followingId: '$followerId',
							}),
							lookupFollowerData,
							{ $unwind: '$followerData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result[0];
	}

	public async checkFollowing(
		followerId: ObjectId,
		followingId: ObjectId,
	): Promise<boolean> {
		await this.memberService.getMember(null, followingId);
		const existing = await this.followModel
			.findOne({ followerId, followingId })
			.exec();
		return !!existing;
	}
}
