import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { TwitComment, TwitComments } from '../../libs/dto/twit-comment/twit-comment';
import {
	CreateTwitCommentInput,
	TwitCommentsInquiry,
} from '../../libs/dto/twit-comment/twit-comment.input';
import { UpdateTwitCommentInput } from '../../libs/dto/twit-comment/twit-comment.update';
import { Member } from '../../libs/dto/member/member';
import { MemberType } from '../../libs/enums/member.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { lookupMember } from '../../libs/config';

interface TwitDoc {
	_id: ObjectId;
	deletedAt?: Date | null;
}

interface TwitCommentDoc {
	_id: ObjectId;
	twitId: ObjectId;
	memberId: ObjectId;
	text: string;
	parentCommentId?: ObjectId | null;
	depth: number;
	likes: ObjectId[];
	likeCount: number;
	deletedAt?: Date | null;
}

@Injectable()
export class TwitCommentService {
	constructor(
		@InjectModel('TwitComment')
		private readonly twitCommentModel: Model<TwitCommentDoc>,
		@InjectModel('Twit') private readonly twitModel: Model<TwitDoc>,
	) {}

	public async createTwitComment(
		memberId: ObjectId,
		input: CreateTwitCommentInput,
	): Promise<TwitComment> {
		await this.checkTwitExists(input.twitId);

		const text = input.text?.trim();
		if (!text) throw new BadRequestException(Message.BAD_REQUEST);

		let depth = 0;
		let parentCommentId: ObjectId | null = null;

		if (input.parentCommentId) {
			parentCommentId = input.parentCommentId;
			const parent: TwitCommentDoc = await this.twitCommentModel
				.findOne({
					_id: parentCommentId,
					twitId: input.twitId,
					deletedAt: null,
				})
				.exec();
			if (!parent) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
			if (parent.depth >= 2) throw new BadRequestException(Message.BAD_REQUEST);
			depth = parent.depth + 1;
		}

		try {
			const result = await this.twitCommentModel.create({
				twitId: input.twitId,
				memberId,
				text,
				parentCommentId,
				depth,
			});
			return result as unknown as TwitComment;
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			console.log('Error, Service.model:', msg);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getTwitComments(
		twitId: ObjectId,
		viewerId: ObjectId | null,
		input: TwitCommentsInquiry,
	): Promise<TwitComments> {
		await this.checkTwitExists(twitId);

		const sort: T = {
			[input?.sort ?? 'createdAt']: input?.direction ?? Direction.ASC,
		};

		const result = await this.twitCommentModel
			.aggregate([
				{ $match: { twitId, deletedAt: null } },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{
								$unwind: {
									path: '$memberData',
									preserveNullAndEmptyArrays: true,
								},
							},
							{
								$addFields: {
									meLiked: viewerId ? { $in: [viewerId, '$likes'] } : false,
								},
							},
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) return { list: [], metaCounter: [] };
		return result[0];
	}

	public async updateTwitComment(
		authMember: Member,
		input: UpdateTwitCommentInput,
	): Promise<TwitComment> {
		const target: TwitCommentDoc = await this.twitCommentModel
			.findById(input.commentId)
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (target.deletedAt) throw new BadRequestException(Message.BAD_REQUEST);

		this.assertOwnerOrAdmin(authMember, target.memberId);

		const text = input.text?.trim();
		if (!text) throw new BadRequestException(Message.BAD_REQUEST);

		const result = await this.twitCommentModel
			.findOneAndUpdate(
				{ _id: input.commentId, deletedAt: null },
				{ text },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result as unknown as TwitComment;
	}

	public async deleteTwitComment(
		authMember: Member,
		commentId: ObjectId,
	): Promise<TwitComment> {
		const target: TwitCommentDoc = await this.twitCommentModel
			.findById(commentId)
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (target.deletedAt) throw new BadRequestException(Message.BAD_REQUEST);

		this.assertOwnerOrAdmin(authMember, target.memberId);

		const result = await this.twitCommentModel
			.findOneAndUpdate(
				{ _id: commentId, deletedAt: null },
				{ deletedAt: new Date() },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result as unknown as TwitComment;
	}

	public async likeTwitComment(
		memberId: ObjectId,
		commentId: ObjectId,
	): Promise<TwitComment> {
		const target: TwitCommentDoc = await this.twitCommentModel
			.findOne({ _id: commentId, deletedAt: null })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (target.deletedAt) throw new BadRequestException(Message.BAD_REQUEST);

		const alreadyLiked = target.likes.some(
			(likeMemberId: ObjectId) => likeMemberId.toString() === memberId.toString(),
		);

		const result = alreadyLiked
			? await this.twitCommentModel
					.findOneAndUpdate(
						{ _id: commentId, likes: memberId, deletedAt: null },
						{ $pull: { likes: memberId }, $inc: { likeCount: -1 } },
						{ new: true },
					)
					.exec()
			: await this.twitCommentModel
					.findOneAndUpdate(
						{ _id: commentId, likes: { $ne: memberId }, deletedAt: null },
						{ $addToSet: { likes: memberId }, $inc: { likeCount: 1 } },
						{ new: true },
					)
					.exec();

		if (!result)
			throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result as unknown as TwitComment;
	}

	public async removeTwitCommentByAdmin(commentId: ObjectId): Promise<TwitComment> {
		const result = await this.twitCommentModel
			.findOneAndUpdate(
				{ _id: commentId, deletedAt: null },
				{ deletedAt: new Date() },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result as unknown as TwitComment;
	}

	private async checkTwitExists(twitId: ObjectId): Promise<void> {
		const twit = await this.twitModel
			.findOne({ _id: twitId, deletedAt: null })
			.exec();
		if (!twit) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
	}

	private assertOwnerOrAdmin(authMember: Member, ownerId: ObjectId): void {
		const isOwner = authMember?._id?.toString() === ownerId.toString();
		const isAdmin = authMember?.memberType === MemberType.ADMIN;
		if (!isOwner && !isAdmin) {
			throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);
		}
	}
}
