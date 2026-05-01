import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { BookStatus } from '../../enums/book.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Shelf {
	@Field(() => String)
	section: string;

	@Field(() => String)
	row: string;

	@Field(() => String)
	level: string;
}

@ObjectType()
export class BookLocation {
	@Field(() => String)
	floorId: string;

	@Field(() => Number)
	x: number;

	@Field(() => Number)
	y: number;

	@Field(() => Number)
	theta: number;
}

@ObjectType()
export class BookPickup {
	@Field(() => Int)
	mastHeightCm: number;

	@Field(() => Int)
	forkDepthCm: number;
}

@ObjectType()
export class Book {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	title: string;

	@Field(() => String)
	author: string;

	@Field(() => String)
	isbn: string;

	@Field(() => String)
	callNumber: string;

	@Field(() => String)
	category: string;

	@Field(() => String, { nullable: true })
	description?: string;

	@Field(() => Boolean)
	available: boolean;

	@Field(() => BookStatus)
	bookStatus: BookStatus;

	@Field(() => Shelf)
	shelf: Shelf;

	@Field(() => BookLocation)
	location: BookLocation;

	@Field(() => BookPickup)
	pickup: BookPickup;

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
