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

@ObjectType()
export class Shelf {
	@Field(() => String, { nullable: true })
	section?: string;

	@Field(() => String, { nullable: true })
	row?: string;

	@Field(() => String, { nullable: true })
	level?: string;
}

@ObjectType()
export class BookLocation {
	@Field(() => String, { nullable: true })
	floorId?: string;

	@Field(() => Number, { nullable: true })
	x?: number;

	@Field(() => Number, { nullable: true })
	y?: number;

	@Field(() => Number, { nullable: true })
	theta?: number;
}

@ObjectType()
export class BookPickup {
	@Field(() => Int, { nullable: true })
	mastHeightCm?: number;

	@Field(() => Int, { nullable: true })
	forkDepthCm?: number;
}

@ObjectType()
export class BookPrice {
	@Field(() => Number)
	amount: number;

	@Field(() => String)
	currency: string;

	@Field(() => Number)
	discountAmount: number;

	@Field(() => Number)
	discountPercent: number;

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
	thicknessCm: number;

	@Field(() => Number)
	weightGrams: number;
}

@ObjectType()
export class BookRanks {
	@Field(() => Number)
	daily: number;

	@Field(() => Number)
	weekly: number;

	@Field(() => Number)
	monthly: number;

	@Field(() => Number)
	allTime: number;
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
	title: string;

	@Field(() => String, { nullable: true })
	subtitle?: string;

	@Field(() => String)
	author: string;

	@Field(() => [String], { nullable: true })
	authors?: string[];

	@Field(() => String)
	isbn: string;

	@Field(() => String, { nullable: true })
	callNumber?: string;

	@Field(() => [String], { nullable: true })
	bookImages?: string[];

	@Field(() => BookType)
	bookType: BookType;

	@Field(() => BookCategory)
	category: BookCategory;

	@Field(() => [String], { nullable: true })
	subCategories?: string[];

	@Field(() => BookAudience, { nullable: true })
	audience?: BookAudience;

	@Field(() => BookFormat, { nullable: true })
	format?: BookFormat;

	@Field(() => BookLanguage, { nullable: true })
	language?: BookLanguage;

	@Field(() => String, { nullable: true })
	publisher?: string;

	@Field(() => Int, { nullable: true })
	publishedYear?: number;

	@Field(() => String, { nullable: true })
	edition?: string;

	@Field(() => Int, { nullable: true })
	pages?: number;

	@Field(() => String, { nullable: true })
	shortDescription?: string;

	@Field(() => String, { nullable: true })
	description?: string;

	@Field(() => BookPrice, { nullable: true })
	price?: BookPrice;

	@Field(() => BookDimensions, { nullable: true })
	dimensions?: BookDimensions;

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

	@Field(() => BookRanks)
	bookRanks: BookRanks;

	@Field(() => BookRating)
	rating: BookRating;

	@Field(() => [String], { nullable: true })
	tags?: string[];

	@Field(() => String, { nullable: true })
	slug?: string;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Boolean)
	available: boolean;

	@Field(() => BookStatus)
	bookStatus: BookStatus;

	@Field(() => Shelf, { nullable: true })
	shelf?: Shelf;

	@Field(() => BookLocation, { nullable: true })
	location?: BookLocation;

	@Field(() => BookPickup, { nullable: true })
	pickup?: BookPickup;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Books {
	@Field(() => [Book])
	list: Book[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
