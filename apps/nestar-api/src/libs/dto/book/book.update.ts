import { Field, InputType, Int } from '@nestjs/graphql';
import {
	IsBoolean,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Length,
	Min,
} from 'class-validator';
import type { ObjectId } from 'mongoose';
import { BookStatus } from '../../enums/book.enum';

@InputType()
class ShelfUpdateInput {
	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	section?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	row?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	level?: string;
}

@InputType()
class BookLocationUpdateInput {
	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	floorId?: string;

	@IsOptional()
	@IsNumber()
	@Field(() => Number, { nullable: true })
	x?: number;

	@IsOptional()
	@IsNumber()
	@Field(() => Number, { nullable: true })
	y?: number;

	@IsOptional()
	@IsNumber()
	@Field(() => Number, { nullable: true })
	theta?: number;
}

@InputType()
class BookPickupUpdateInput {
	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	mastHeightCm?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	forkDepthCm?: number;
}

@InputType()
export class UpdateBookInput {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Length(1, 200)
	@Field(() => String, { nullable: true })
	title?: string;

	@IsOptional()
	@Length(1, 120)
	@Field(() => String, { nullable: true })
	author?: string;

	@IsOptional()
	@Length(3, 40)
	@Field(() => String, { nullable: true })
	isbn?: string;

	@IsOptional()
	@Length(1, 80)
	@Field(() => String, { nullable: true })
	callNumber?: string;

	@IsOptional()
	@Length(1, 80)
	@Field(() => String, { nullable: true })
	category?: string;

	@IsOptional()
	@Length(0, 1000)
	@Field(() => String, { nullable: true })
	description?: string;

	@IsOptional()
	@IsBoolean()
	@Field(() => Boolean, { nullable: true })
	available?: boolean;

	@IsOptional()
	@Field(() => BookStatus, { nullable: true })
	bookStatus?: BookStatus;

	@IsOptional()
	@Field(() => ShelfUpdateInput, { nullable: true })
	shelf?: ShelfUpdateInput;

	@IsOptional()
	@Field(() => BookLocationUpdateInput, { nullable: true })
	location?: BookLocationUpdateInput;

	@IsOptional()
	@Field(() => BookPickupUpdateInput, { nullable: true })
	pickup?: BookPickupUpdateInput;
}

@InputType()
export class UpdateBookAvailabilityInput {
	@IsNotEmpty()
	@Field(() => String)
	bookId: ObjectId;

	@IsNotEmpty()
	@IsBoolean()
	@Field(() => Boolean)
	available: boolean;

	@IsOptional()
	@Field(() => BookStatus, { nullable: true })
	bookStatus?: BookStatus;
}
