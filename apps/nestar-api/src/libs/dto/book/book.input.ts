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
export class BookPriceInput {
	@IsNotEmpty()
	@Min(0)
	@Field(() => Number)
	amount: number;

	@IsOptional()
	@IsString()
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
	weightGrams?: number;
}

@InputType()
export class CreateBookInput {
	@IsNotEmpty()
	@Length(1, 200)
	@Field(() => String)
	bookTitle: string;

	@IsNotEmpty()
	@Length(1, 120)
	@Field(() => String)
	bookAuthor: string;

	@IsNotEmpty()
	@Length(3, 40)
	@Field(() => String)
	bookIsbn: string;

	@IsOptional()
	@Length(0, 80)
	@Field(() => String, { nullable: true })
	bookCallNumber?: string;

	@IsNotEmpty()
	@IsArray()
	@Field(() => [String])
	bookImages: string[];

	@IsNotEmpty()
	@Field(() => BookType)
	bookType: BookType;

	@IsNotEmpty()
	@Field(() => BookCategory)
	bookCategory: BookCategory;

	@IsNotEmpty()
	@Field(() => BookAudience)
	bookAudience: BookAudience;

	@IsNotEmpty()
	@Field(() => BookFormat)
	bookFormat: BookFormat;

	@IsNotEmpty()
	@Field(() => BookLanguage)
	bookLanguage: BookLanguage;

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

	@IsNotEmpty()
	@Field(() => BookPriceInput)
	bookPrice: BookPriceInput;

	@IsOptional()
	@Field(() => BookDimensionsInput, { nullable: true })
	bookDimensions?: BookDimensionsInput;

	@IsOptional()
	@IsBoolean()
	@Field(() => Boolean, { nullable: true })
	isBorrowable?: boolean;

	@IsOptional()
	@IsBoolean()
	@Field(() => Boolean, { nullable: true })
	isPurchasable?: boolean;

	@IsOptional()
	@Field(() => BookStatus, { nullable: true })
	bookStatus?: BookStatus;
}

@InputType()
export class BookSearchInput {
	@IsOptional()
	@Field(() => String, { nullable: true })
	keyword?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	bookTitle?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	bookAuthor?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	bookIsbn?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	bookCallNumber?: string;

	@IsOptional()
	@Field(() => BookCategory, { nullable: true })
	bookCategory?: BookCategory;

	@IsOptional()
	@Field(() => BookType, { nullable: true })
	bookType?: BookType;

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

@InputType()
class ABISearch {
	@IsOptional()
	@Field(() => BookStatus, { nullable: true })
	bookStatus?: BookStatus;

	@IsOptional()
	@Field(() => [BookCategory], { nullable: true })
	bookCategoryList?: BookCategory[];
}

@InputType()
export class AllBooksInquiry {
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
	@Field(() => ABISearch, { nullable: true })
	search?: ABISearch;
}

@InputType()
export class OrdinaryInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;
}
