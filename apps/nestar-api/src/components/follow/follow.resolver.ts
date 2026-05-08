import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FollowService } from './follow.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Follower, Followers, Followings } from '../../libs/dto/follow/follow';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';
import { FollowInquiry } from '../../libs/dto/follow/follow.input';

@Resolver()
export class FollowResolver {
	constructor(private readonly followService: FollowService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Follower)
	public async followMember(
		@Args('memberId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Follower> {
		console.log('Mutation: followMember');
		const followingId = shapeIntoMongoObjectId(input);
		return await this.followService.followMember(memberId, followingId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Follower)
	public async unfollowMember(
		@Args('memberId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Follower> {
		console.log('Mutation: unfollowMember');
		const followingId = shapeIntoMongoObjectId(input);
		return await this.followService.unfollowMember(memberId, followingId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Followings)
	public async getFollowing(
		@Args('memberId') targetId: string,
		@Args('input') input: FollowInquiry,
		@AuthMember('_id') viewerId: ObjectId,
	): Promise<Followings> {
		console.log('Query: getFollowing');
		const memberId = shapeIntoMongoObjectId(targetId);
		return await this.followService.getFollowing(memberId, viewerId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Followers)
	public async getFollowers(
		@Args('memberId') targetId: string,
		@Args('input') input: FollowInquiry,
		@AuthMember('_id') viewerId: ObjectId,
	): Promise<Followers> {
		console.log('Query: getFollowers');
		const memberId = shapeIntoMongoObjectId(targetId);
		return await this.followService.getFollowers(memberId, viewerId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Boolean)
	public async checkFollowing(
		@Args('memberId') targetId: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<boolean> {
		console.log('Query: checkFollowing');
		const followingId = shapeIntoMongoObjectId(targetId);
		return await this.followService.checkFollowing(memberId, followingId);
	}
}
