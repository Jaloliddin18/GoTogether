import { Field, InputType, Int } from '@nestjs/graphql';
import {
	IsArray,
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
import {
	BookAudience,
	BookCategory,
	BookFormat,
	BookLanguage,
	BookStatus,
	BookType,
} from '../../enums/book.enum';

@InputType()
export class ShelfInput {
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
export class BookLocationInput {
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
export class BookPickupInput {
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
export class BookPriceInput {
	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	amount?: number;

	@IsOptional()
	@IsString()
	@Length(1, 10)
	@Field(() => String, { nullable: true })
	currency?: string;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	discountAmount?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	discountPercent?: number;

	@IsOptional()
	@IsBoolean()
	@Field(() => Boolean, { nullable: true })
	isDiscounted?: boolean;
}

@InputType()
export class BookDimensionsInput {
	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	widthCm?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	heightCm?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	thicknessCm?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	weightGrams?: number;
}

@InputType()
export class CreateBookInput {
	@IsNotEmpty()
	@Length(1, 200)
	@Field(() => String)
	title: string;

	@IsOptional()
	@Length(0, 200)
	@Field(() => String, { nullable: true })
	subtitle?: string;

	@IsNotEmpty()
	@Length(1, 120)
	@Field(() => String)
	author: string;

	@IsOptional()
	@IsArray()
	@Field(() => [String], { nullable: true })
	authors?: string[];

	@IsNotEmpty()
	@Length(3, 40)
	@Field(() => String)
	isbn: string;

	@IsOptional()
	@Length(0, 80)
	@Field(() => String, { nullable: true })
	callNumber?: string;

	@IsOptional()
	@IsArray()
	@Field(() => [String], { nullable: true })
	bookImages?: string[];

	@IsNotEmpty()
	@Field(() => BookType)
	bookType: BookType;

	@IsNotEmpty()
	@Field(() => BookCategory)
	category: BookCategory;

	@IsOptional()
	@IsArray()
	@Field(() => [String], { nullable: true })
	subCategories?: string[];

	@IsOptional()
	@Field(() => BookAudience, { nullable: true })
	audience?: BookAudience;

	@IsOptional()
	@Field(() => BookFormat, { nullable: true })
	format?: BookFormat;

	@IsOptional()
	@Field(() => BookLanguage, { nullable: true })
	language?: BookLanguage;

	@IsOptional()
	@Length(0, 120)
	@Field(() => String, { nullable: true })
	publisher?: string;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	publishedYear?: number;

	@IsOptional()
	@Length(0, 80)
	@Field(() => String, { nullable: true })
	edition?: string;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	pages?: number;

	@IsOptional()
	@Length(0, 300)
	@Field(() => String, { nullable: true })
	shortDescription?: string;

	@IsOptional()
	@Length(0, 1000)
	@Field(() => String, { nullable: true })
	description?: string;

	@IsOptional()
	@Field(() => BookPriceInput, { nullable: true })
	price?: BookPriceInput;

	@IsOptional()
	@Field(() => BookDimensionsInput, { nullable: true })
	dimensions?: BookDimensionsInput;

	@IsOptional()
	@IsBoolean()
	@Field(() => Boolean, { nullable: true })
	isBorrowable?: boolean;

	@IsOptional()
	@IsBoolean()
	@Field(() => Boolean, { nullable: true })
	isPurchasable?: boolean;

	@IsOptional()
	@IsArray()
	@Field(() => [String], { nullable: true })
	tags?: string[];

	@IsOptional()
	@Length(0, 160)
	@Field(() => String, { nullable: true })
	slug?: string;

	@IsOptional()
	@IsBoolean()
	@Field(() => Boolean, { nullable: true })
	available?: boolean;

	@IsOptional()
	@Field(() => BookStatus, { nullable: true })
	bookStatus?: BookStatus;

	@IsOptional()
	@Field(() => ShelfInput, { nullable: true })
	shelf?: ShelfInput;

	@IsOptional()
	@Field(() => BookLocationInput, { nullable: true })
	location?: BookLocationInput;

	@IsOptional()
	@Field(() => BookPickupInput, { nullable: true })
	pickup?: BookPickupInput;
}

@InputType()
export class BookSearchInput {
	@IsOptional()
	@Field(() => String, { nullable: true })
	keyword?: string;

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
	@Field(() => BookCategory, { nullable: true })
	category?: BookCategory;

	@IsOptional()
	@IsArray()
	@Field(() => [String], { nullable: true })
	subCategories?: string[];

	@IsOptional()
	@Field(() => BookType, { nullable: true })
	bookType?: BookType;

	@IsOptional()
	@Field(() => BookAudience, { nullable: true })
	audience?: BookAudience;

	@IsOptional()
	@Field(() => BookFormat, { nullable: true })
	format?: BookFormat;

	@IsOptional()
	@Field(() => BookLanguage, { nullable: true })
	language?: BookLanguage;

	@IsOptional()
	@Field(() => BookStatus, { nullable: true })
	bookStatus?: BookStatus;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	isBorrowable?: boolean;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	isPurchasable?: boolean;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	minPrice?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	maxPrice?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	minRating?: number;

	@IsOptional()
	@IsArray()
	@Field(() => [String], { nullable: true })
	tags?: string[];

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	available?: boolean;
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
