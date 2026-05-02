import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import {
	BookAudience,
	BookCategory,
	BookFormat,
	BookLanguage,
	BookStatus,
	BookType,
} from '../../enums/book.enum';
import { TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
export class BookPrice {
	@Field(() => Number)
	amount: number;

	@Field(() => String)
	currency: string;

	@Field(() => Number, { nullable: true })
	discountPercent?: number;

	@Field(() => Boolean)
	isDiscounted: boolean;
}

@ObjectType()
export class BookDimensions {
	@Field(() => Number)
	widthCm: number;

	@Field(() => Number)
	heightCm: number;

	@Field(() => Number)
	weightGrams: number;
}

@ObjectType()
export class BookRating {
	@Field(() => Number)
	average: number;

	@Field(() => Int)
	count: number;
}

@ObjectType()
export class Book {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	bookTitle: string;

	@Field(() => String)
	bookAuthor: string;

	@Field(() => String)
	bookIsbn: string;

	@Field(() => String, { nullable: true })
	bookCallNumber?: string;

	@Field(() => [String])
	bookImages: string[];

	@Field(() => BookType)
	bookType: BookType;

	@Field(() => BookCategory)
	bookCategory: BookCategory;

	@Field(() => BookAudience)
	bookAudience: BookAudience;

	@Field(() => BookFormat)
	bookFormat: BookFormat;

	@Field(() => BookLanguage)
	bookLanguage: BookLanguage;

	@Field(() => Int, { nullable: true })
	bookPublishedYear?: number;

	@Field(() => Int, { nullable: true })
	bookPages?: number;

	@Field(() => String, { nullable: true })
	bookDescription?: string;

	@Field(() => BookPrice)
	bookPrice: BookPrice;

	@Field(() => BookDimensions, { nullable: true })
	bookDimensions?: BookDimensions;

	@Field(() => Boolean)
	isBorrowable: boolean;

	@Field(() => Boolean)
	isPurchasable: boolean;

	@Field(() => Int)
	bookLikes: number;

	@Field(() => Int)
	bookViews: number;

	@Field(() => Int)
	bookComments: number;

	@Field(() => Number)
	bookRank: number;

	@Field(() => BookRating)
	bookRating: BookRating;

	@Field(() => BookStatus)
	bookStatus: BookStatus;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];
}

@ObjectType()
export class Books {
	@Field(() => [Book])
	list: Book[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
