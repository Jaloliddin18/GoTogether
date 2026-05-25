import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { availableLostItemSorts } from '../../config';
import { Direction } from '../../enums/common.enum';
import {
	LostItemObjectType,
	LostItemPriority,
	LostItemStatus,
} from '../../enums/lost-item.enum';

@InputType()
class LostItemsSearchInput {
	@IsOptional()
	@Field(() => LostItemStatus, { nullable: true })
	status?: LostItemStatus;

	@IsOptional()
	@Field(() => LostItemObjectType, { nullable: true })
	objectType?: LostItemObjectType;

	@IsOptional()
	@Field(() => LostItemPriority, { nullable: true })
	priority?: LostItemPriority;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	robotId?: string;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	detectedAtFrom?: Date;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	detectedAtTo?: Date;
}

@InputType()
export class LostItemsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableLostItemSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => LostItemsSearchInput, { nullable: true })
	search?: LostItemsSearchInput;
}
