import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Member, MemberProfile, Members } from '../../libs/dto/member/member';
import {
	LoginInput,
	MemberInput,
	MembersInquiry,
} from '../../libs/dto/member/member.input';
import { MemberStatus } from '../../libs/enums/member.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { AuthService } from '../auth/auth.service';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { StatisticModifier, T } from '../../libs/types/common';
import { ViewService } from '../view/view.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { LikeService } from '../like/like.service';
import { Follower, Following, MeFollowed } from '../../libs/dto/follow/follow';

interface TwitCounterDoc {
	memberId: ObjectId;
	deletedAt?: Date | null;
}

@Injectable()
export class MemberService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Follow')
		private readonly followModel: Model<Follower | Following>,
		@InjectModel('Twit') private readonly twitModel: Model<TwitCounterDoc>,
		private readonly authService: AuthService,
		private readonly viewService: ViewService,
		private readonly likeService: LikeService,
	) {}

	public async signup(input: MemberInput): Promise<Member> {
		input.memberPassword = await this.authService.hashPasword(
			input.memberPassword,
		);
		try {
			const result = await this.memberModel.create(input);

			result.accessToken = await this.authService.createToken(result);

			return result;
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
		}
	}
	public async login(input: LoginInput): Promise<Member> {
		const { memberNick, memberPassword } = input;
		const response = await this.memberModel
			.findOne({ memberNick: memberNick })
			.select('+memberPassword')
			.exec();
		if (!response || response.memberStatus === MemberStatus.DELETE) {
			throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
		} else if (response.memberStatus === MemberStatus.BLOCK) {
			throw new InternalServerErrorException(Message.BLOCKED_USER);
		}

		const isMatch = await this.authService.comparePasswords(
			input.memberPassword,
			response.memberPassword,
		);

		if (!isMatch)
			throw new InternalServerErrorException(Message.WRONG_PASSWORD);

		response.accessToken = await this.authService.createToken(response);
		return response;
	}
	public async updateMember(
		memberId: ObjectId,
		input: MemberUpdate,
	): Promise<Member> {
		const result: Member = await this.memberModel
			.findOneAndUpdate(
				{
					_id: memberId,
					memberStatus: MemberStatus.ACTIVE,
				},
				input,
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		result.accessToken = await this.authService.createToken(result);
		// Member is returned and new regenerated accessToken is also returned
		return result;
	}
	public async getMember(
		memberId: ObjectId,
		targetId: ObjectId,
	): Promise<Member> {
		const search: T = {
			_id: targetId,
			memberStatus: {
				$in: [MemberStatus.ACTIVE, MemberStatus.BLOCK],
			},
		};
		//const search is MongoDB search query
		const targetMember = await this.memberModel.findOne(search).lean().exec();
		// lean() return JavaScript object
		if (!targetMember)
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (memberId) {
			const viewInput = {
				memberId: memberId,
				viewRefId: targetId,
				viewGroup: ViewGroup.MEMBER,
			};
			// building viewInput object and 3 properties inside it
			const newView = await this.viewService.recordView(viewInput);
			if (newView) {
				await this.memberModel
					.findOneAndUpdate(
						search,
						{
							$inc: { memberViews: 1 },
						},
						{ new: true },
					)
					.exec();
				targetMember.memberViews++;
			}
			const likeInput = {
				memberId: memberId,
				likeRefId: targetId,
				likeGroup: LikeGroup.MEMBER,
			};
			targetMember.meLiked =
				await this.likeService.checkLikeExistance(likeInput);

			targetMember.meFollowed = await this.checkSubscription(
				memberId,
				targetId,
			);
		}
		return targetMember;
	}

	public async getMemberProfile(
		memberId: ObjectId | null,
		targetId: ObjectId,
	): Promise<MemberProfile> {
		const member: Member = await this.getMember(memberId, targetId);

		const [twitCount, followerCount, followingCount] = await Promise.all([
			this.twitModel.countDocuments({ memberId: targetId, deletedAt: null }).exec(),
			this.followModel.countDocuments({ followingId: targetId }).exec(),
			this.followModel.countDocuments({ followerId: targetId }).exec(),
		]);

		let isFollowing = false;
		if (memberId && memberId.toString() !== targetId.toString()) {
			const existing = await this.followModel
				.findOne({
					followerId: memberId,
					followingId: targetId,
				})
				.exec();
			isFollowing = !!existing;
		}

		return {
			member,
			twitCount,
			followerCount,
			followingCount,
			isFollowing,
		};
	}

	private async checkSubscription(
		followerId: ObjectId,
		followingId: ObjectId,
	): Promise<MeFollowed[]> {
		const result = await this.followModel
			.findOne({
				followingId: followingId,
				followerId: followerId,
			})
			.exec();
		return result
			? [
					{
						followerId: followerId,
						followingId: followingId,
						myFollowing: true,
					},
				]
			: [];
	}

	public async likeTargetMember(
		memberId: ObjectId,
		likeRefId: ObjectId,
	): Promise<Member> {
		const target: Member = await this.memberModel
			.findOne({ _id: likeRefId, memberStatus: MemberStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.MEMBER,
		};
		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.memberStatsEditor({
			_id: likeRefId,
			targetKey: 'memberLikes',
			modifier: modifier,
		});
		if (!result)
			throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	public async getAllMembersByAdmin(input: MembersInquiry): Promise<Members> {
		const { memberStatus, memberType, text } = input.search;
		const match: T = {};
		const sort: T = {
			[input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
		};
		// dynamic sorting
		if (memberStatus) match.memberStatus = memberStatus;
		if (memberType) match.memberType = memberType;
		if (text) match.memberNick = { $regex: new RegExp(text, 'i') };

		console.log('match:', match);

		const result = await this.memberModel
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

		console.log('result:', result);

		if (!result.length)
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}
	public async updateMemberByAdmin(input: MemberUpdate): Promise<Member> {
		const result = await this.memberModel
			.findOneAndUpdate({ _id: input._id }, input, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async memberStatsEditor(input: StatisticModifier): Promise<Member> {
		console.log('executed');
		const { _id, targetKey, modifier } = input;
		return await this.memberModel
			.findOneAndUpdate(
				{ _id },
				{
					$inc: { [targetKey]: modifier },
					// dynamically increasing and decreasing the target value
				},
				{ new: true },
			)
			.exec();
	}
}
