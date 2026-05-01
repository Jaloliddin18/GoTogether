import { Field, InputType, Int } from '@nestjs/graphql';
import {
	IsBoolean,
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Length,
	Min,
} from 'class-validator';
import { availableBookSorts } from '../../config';
import { Direction } from '../../enums/common.enum';
import { BookStatus } from '../../enums/book.enum';

@InputType()
export class ShelfInput {
	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	section: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	row: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	level: string;
}

@InputType()
export class BookLocationInput {
	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	floorId: string;

	@IsNotEmpty()
	@IsNumber()
	@Field(() => Number)
	x: number;

	@IsNotEmpty()
	@IsNumber()
	@Field(() => Number)
	y: number;

	@IsNotEmpty()
	@IsNumber()
	@Field(() => Number)
	theta: number;
}

@InputType()
export class BookPickupInput {
	@IsNotEmpty()
	@Min(0)
	@Field(() => Int)
	mastHeightCm: number;

	@IsNotEmpty()
	@Min(0)
	@Field(() => Int)
	forkDepthCm: number;
}

@InputType()
export class CreateBookInput {
	@IsNotEmpty()
	@Length(1, 200)
	@Field(() => String)
	title: string;

	@IsNotEmpty()
	@Length(1, 120)
	@Field(() => String)
	author: string;

	@IsNotEmpty()
	@Length(3, 40)
	@Field(() => String)
	isbn: string;

	@IsNotEmpty()
	@Length(1, 80)
	@Field(() => String)
	callNumber: string;

	@IsNotEmpty()
	@Length(1, 80)
	@Field(() => String)
	category: string;

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

	@IsNotEmpty()
	@Field(() => ShelfInput)
	shelf: ShelfInput;

	@IsNotEmpty()
	@Field(() => BookLocationInput)
	location: BookLocationInput;

	@IsNotEmpty()
	@Field(() => BookPickupInput)
	pickup: BookPickupInput;
}

@InputType()
export class BookSearchInput {
	@IsOptional()
	@Field(() => String, { nullable: true })
	title?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	author?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	isbn?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	callNumber?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	category?: string;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	available?: boolean;

	@IsOptional()
	@Field(() => BookStatus, { nullable: true })
	bookStatus?: BookStatus;
}

@InputType()
export class BooksInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableBookSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => BookSearchInput, { nullable: true })
	search?: BookSearchInput;
}
