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
	weightGrams?: number;
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
	bookTitle?: string;

	@IsOptional()
	@Length(1, 120)
	@Field(() => String, { nullable: true })
	bookAuthor?: string;

	@IsOptional()
	@Length(3, 40)
	@Field(() => String, { nullable: true })
	bookIsbn?: string;

	@IsOptional()
	@Length(0, 80)
	@Field(() => String, { nullable: true })
	bookCallNumber?: string;

	@IsOptional()
	@IsArray()
	@Field(() => [String], { nullable: true })
	bookImages?: string[];

	@IsOptional()
	@Field(() => BookType, { nullable: true })
	bookType?: BookType;

	@IsOptional()
	@Field(() => BookCategory, { nullable: true })
	bookCategory?: BookCategory;

	@IsOptional()
	@Field(() => BookAudience, { nullable: true })
	bookAudience?: BookAudience;

	@IsOptional()
	@Field(() => BookFormat, { nullable: true })
	bookFormat?: BookFormat;

	@IsOptional()
	@Field(() => BookLanguage, { nullable: true })
	bookLanguage?: BookLanguage;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	bookPublishedYear?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	bookPages?: number;

	@IsOptional()
	@Length(0, 1000)
	@Field(() => String, { nullable: true })
	bookDescription?: string;

	@IsOptional()
	@Field(() => BookPriceUpdateInput, { nullable: true })
	bookPrice?: BookPriceUpdateInput;

	@IsOptional()
	@Field(() => BookDimensionsUpdateInput, { nullable: true })
	bookDimensions?: BookDimensionsUpdateInput;

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
	@Field(() => BookRatingUpdateInput, { nullable: true })
	bookRating?: BookRatingUpdateInput;

	@IsOptional()
	@Field(() => BookStatus, { nullable: true })
	bookStatus?: BookStatus;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	deletedAt?: Date;
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
