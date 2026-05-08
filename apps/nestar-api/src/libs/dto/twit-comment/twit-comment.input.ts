import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { availableTwitCommentSorts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class CreateTwitCommentInput {
	@IsNotEmpty()
	@Field(() => String)
	twitId: ObjectId;

	@IsNotEmpty()
	@Length(1, 1000)
	@Field(() => String)
	text: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	parentCommentId?: ObjectId;
}

@InputType()
export class TwitCommentsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableTwitCommentSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;
}
