import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { availableTwitSorts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class CreateTwitInput {
	@IsNotEmpty()
	@Length(1, 280)
	@Field(() => String)
	text: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	image?: string;
}

@InputType()
class TwitSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
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
}
