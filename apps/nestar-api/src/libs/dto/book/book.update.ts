import { Field, InputType, Int } from '@nestjs/graphql';
import {
	IsArray,
	IsBoolean,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Length,
	Min,
} from 'class-validator';
import type { ObjectId } from 'mongoose';
import {
	BookAudience,
	BookCategory,
	BookFormat,
	BookLanguage,
	BookStatus,
	BookType,
} from '../../enums/book.enum';

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
class BookPriceUpdateInput {
	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	amount?: number;

	@IsOptional()
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
class BookDimensionsUpdateInput {
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
class BookRanksUpdateInput {
	@IsOptional()
	@Field(() => Number, { nullable: true })
	daily?: number;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	weekly?: number;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	monthly?: number;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	allTime?: number;
}

@InputType()
class BookRatingUpdateInput {
	@IsOptional()
	@Field(() => Number, { nullable: true })
	average?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	count?: number;
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
	@Length(0, 200)
	@Field(() => String, { nullable: true })
	subtitle?: string;

	@IsOptional()
	@Length(1, 120)
	@Field(() => String, { nullable: true })
	author?: string;

	@IsOptional()
	@IsArray()
	@Field(() => [String], { nullable: true })
	authors?: string[];

	@IsOptional()
	@Length(3, 40)
	@Field(() => String, { nullable: true })
	isbn?: string;

	@IsOptional()
	@Length(0, 80)
	@Field(() => String, { nullable: true })
	callNumber?: string;

	@IsOptional()
	@IsArray()
	@Field(() => [String], { nullable: true })
	bookImages?: string[];

	@IsOptional()
	@Field(() => BookType, { nullable: true })
	bookType?: BookType;

	@IsOptional()
	@Field(() => BookCategory, { nullable: true })
	category?: BookCategory;

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
	@Field(() => BookPriceUpdateInput, { nullable: true })
	price?: BookPriceUpdateInput;

	@IsOptional()
	@Field(() => BookDimensionsUpdateInput, { nullable: true })
	dimensions?: BookDimensionsUpdateInput;

	@IsOptional()
	@IsBoolean()
	@Field(() => Boolean, { nullable: true })
	isBorrowable?: boolean;

	@IsOptional()
	@IsBoolean()
	@Field(() => Boolean, { nullable: true })
	isPurchasable?: boolean;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	bookLikes?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	bookViews?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	bookComments?: number;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	bookRank?: number;

	@IsOptional()
	@Field(() => BookRanksUpdateInput, { nullable: true })
	bookRanks?: BookRanksUpdateInput;

	@IsOptional()
	@Field(() => BookRatingUpdateInput, { nullable: true })
	rating?: BookRatingUpdateInput;

	@IsOptional()
	@IsArray()
	@Field(() => [String], { nullable: true })
	tags?: string[];

	@IsOptional()
	@Length(0, 160)
	@Field(() => String, { nullable: true })
	slug?: string;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

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
