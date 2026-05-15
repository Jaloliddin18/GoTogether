import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { TwitService } from './twit.service';
import { Twit, Twits } from '../../libs/dto/twit/twit';
import {
	AllTwitsInquiry,
	CreateTwitInput,
	TwitInquiry,
	TwitsInquiry,
} from '../../libs/dto/twit/twit.input';
import { TwitUpdate } from '../../libs/dto/twit/twit.update';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ViewService } from '../view/view.service';
import { ViewGroup } from '../../libs/enums/view.enum';

@Resolver()
export class TwitResolver {
	constructor(
		private readonly twitService: TwitService,
		private readonly viewService: ViewService,
	) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Twit)
	public async createTwit(
		@Args('input') input: CreateTwitInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Twit> {
		console.log('Mutation: createTwit');
		return await this.twitService.createTwit(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Twit)
	public async getTwit(
		@Args('input') input: TwitInquiry,
		@AuthMember('_id') memberId: ObjectId | null,
	): Promise<Twit> {
		console.log('Query: getTwit');
		input._id = shapeIntoMongoObjectId(input._id);
		const twit = await this.twitService.getTwit(memberId, input);
		if (memberId) {
			const newView = await this.viewService.recordView({
				memberId,
				viewRefId: input._id,
				viewGroup: ViewGroup.TWIT,
			});
			if (newView) {
				twit.viewCount = (twit.viewCount ?? 0) + 1;
				await this.twitService.incrementViewCount(input._id);
			}
		}
		return twit;
	}

	@UseGuards(WithoutGuard)
	@Query(() => Twits)
	public async getTwits(
		@Args('input') input: TwitsInquiry,
		@AuthMember('_id') viewerId: ObjectId | null,
	): Promise<Twits> {
		console.log('Query: getTwits');
		return await this.twitService.getTwits(viewerId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Twits)
	public async getMemberTwits(
		@Args('input') input: TwitsInquiry,
		@AuthMember('_id') viewerId: ObjectId | null,
	): Promise<Twits> {
		console.log('Query: getMemberTwits');
		return await this.twitService.getMemberTwits(viewerId, input);
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

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Twits)
	public async getAllTwitsByAdmin(
		@Args('input') input: AllTwitsInquiry,
	): Promise<Twits> {
		console.log('Query: getAllTwitsByAdmin');
		return await this.twitService.getAllTwitsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Twit)
	public async updateTwitByAdmin(
		@Args('input') input: TwitUpdate,
	): Promise<Twit> {
		console.log('Mutation: updateTwitByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.twitService.updateTwitByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Twit)
	public async removeTwitByAdmin(@Args('twitId') input: string): Promise<Twit> {
		console.log('Mutation: removeTwitByAdmin');
		const twitId = shapeIntoMongoObjectId(input);
		return await this.twitService.removeTwitByAdmin(twitId);
	}
}
