import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { TwitService } from './twit.service';
import { Twit, Twits } from '../../libs/dto/twit/twit';
import { CreateTwitInput, TwitsInquiry } from '../../libs/dto/twit/twit.input';

@Resolver()
export class TwitResolver {
	constructor(private readonly twitService: TwitService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Twit)
	public async createTwit(
		@Args('input') input: CreateTwitInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Twit> {
		console.log('Mutation: createTwit');
		return await this.twitService.createTwit(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Twits)
	public async getTwits(
		@Args('input') input: TwitsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Twits> {
		console.log('Query: getTwits');
		return await this.twitService.getTwits(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Twits)
	public async getMemberTwits(
		@Args('memberId') input: string,
		@Args('input') inquiry: TwitsInquiry,
	): Promise<Twits> {
		console.log('Query: getMemberTwits');
		const memberId = shapeIntoMongoObjectId(input);
		return await this.twitService.getMemberTwits(memberId, inquiry);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Twit)
	public async likeTwit(
		@Args('twitId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Twit> {
		console.log('Mutation: likeTwit');
		const twitId = shapeIntoMongoObjectId(input);
		return await this.twitService.likeTwit(memberId, twitId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Twit)
	public async deleteTwit(
		@Args('twitId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Twit> {
		console.log('Mutation: deleteTwit');
		const twitId = shapeIntoMongoObjectId(input);
		return await this.twitService.deleteTwit(memberId, twitId);
	}
}
