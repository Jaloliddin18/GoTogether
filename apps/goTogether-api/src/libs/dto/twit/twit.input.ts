import { Field, InputType, Int } from '@nestjs/graphql';
import {
	ArrayMaxSize,
	IsArray,
	IsBoolean,
	IsIn,
	IsNotEmpty,
	IsOptional,
	Length,
	Min,
} from 'class-validator';
import type { ObjectId } from 'mongoose';
import { availableTwitSorts } from '../../config';
import { Direction } from '../../enums/common.enum';
import { TwitFeedType } from '../../enums/twit.enum';

@InputType()
export class CreateTwitInput {
	@IsNotEmpty()
	@Length(1, 500)
	@Field(() => String)
	text: string;

	@IsArray()
	@ArrayMaxSize(3)
	@IsOptional()
	@Field(() => [String], { nullable: true })
	images?: string[];
}

@InputType()
export class TwitInquiry {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;
}

@InputType()
class TwitSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: string;
}

@InputType()
export class TwitsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableTwitSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => TwitSearch, { nullable: true })
	search?: TwitSearch;

	@IsOptional()
	@IsIn(Object.values(TwitFeedType))
	@Field(() => TwitFeedType, { nullable: true })
	feedType?: TwitFeedType;
}

@InputType()
class AllTwitsSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@IsBoolean()
	@Field(() => Boolean, { nullable: true })
	isDeleted?: boolean;
}

@InputType()
export class AllTwitsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableTwitSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => AllTwitsSearch, { nullable: true })
	search?: AllTwitsSearch;
}
