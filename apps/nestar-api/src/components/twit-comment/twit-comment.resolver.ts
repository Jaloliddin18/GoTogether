import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Member } from '../../libs/dto/member/member';
import { TwitCommentService } from './twit-comment.service';
import { TwitComment, TwitComments } from '../../libs/dto/twit-comment/twit-comment';
import {
	CreateTwitCommentInput,
	TwitCommentsInquiry,
} from '../../libs/dto/twit-comment/twit-comment.input';
import { UpdateTwitCommentInput } from '../../libs/dto/twit-comment/twit-comment.update';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class TwitCommentResolver {
	constructor(private readonly twitCommentService: TwitCommentService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => TwitComment)
	public async createTwitComment(
		@Args('input') input: CreateTwitCommentInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<TwitComment> {
		console.log('Mutation: createTwitComment');
		input.twitId = shapeIntoMongoObjectId(input.twitId);
		if (input.parentCommentId) {
			input.parentCommentId = shapeIntoMongoObjectId(input.parentCommentId);
		}
		return await this.twitCommentService.createTwitComment(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => TwitComments)
	public async getTwitComments(
		@Args('input') input: TwitCommentsInquiry,
		@AuthMember('_id') viewerId: ObjectId,
	): Promise<TwitComments> {
		console.log('Query: getTwitComments');
		return await this.twitCommentService.getTwitComments(viewerId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => TwitComment)
	public async updateTwitComment(
		@Args('input') input: UpdateTwitCommentInput,
		@AuthMember() authMember: Member,
	): Promise<TwitComment> {
		console.log('Mutation: updateTwitComment');
		input.commentId = shapeIntoMongoObjectId(input.commentId);
		return await this.twitCommentService.updateTwitComment(authMember, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => TwitComment)
	public async deleteTwitComment(
		@Args('commentId') input: string,
		@AuthMember() authMember: Member,
	): Promise<TwitComment> {
		console.log('Mutation: deleteTwitComment');
		const commentId = shapeIntoMongoObjectId(input);
		return await this.twitCommentService.deleteTwitComment(authMember, commentId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => TwitComment)
	public async likeTwitComment(
		@Args('commentId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<TwitComment> {
		console.log('Mutation: likeTwitComment');
		const commentId = shapeIntoMongoObjectId(input);
		return await this.twitCommentService.likeTwitComment(memberId, commentId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => TwitComment)
	public async removeTwitCommentByAdmin(
		@Args('commentId') input: string,
	): Promise<TwitComment> {
		console.log('Mutation: removeTwitCommentByAdmin');
		const commentId = shapeIntoMongoObjectId(input);
		return await this.twitCommentService.removeTwitCommentByAdmin(commentId);
	}
}
