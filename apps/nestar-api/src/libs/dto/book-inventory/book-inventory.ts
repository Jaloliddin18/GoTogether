import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import {
	BookInventoryStatus,
	BookInventoryType,
	BookStorageZone,
} from '../../enums/book-inventory.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class BookShelf {
	@Field(() => String)
	section: string;

	@Field(() => String)
	row: string;

	@Field(() => String)
	level: string;

	@Field(() => String, { nullable: true })
	slot?: string;
}

@ObjectType()
export class BookInventoryLocation {
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
export class BookInventoryPickup {
	@Field(() => Number)
	mastHeightCm: number;

	@Field(() => Number)
	forkDepthCm: number;

	@Field(() => Number)
	gripWidthCm: number;

	@Field(() => Boolean)
	requiresContainer: boolean;

	@Field(() => String, { nullable: true })
	containerId?: string;
}

@ObjectType()
export class BookInventory {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	bookId: ObjectId;

	@Field(() => BookInventoryType)
	bookInventoryType: BookInventoryType;

	@Field(() => BookStorageZone)
	bookStorageZone: BookStorageZone;

	@Field(() => BookInventoryStatus)
	bookInventoryStatus: BookInventoryStatus;

	@Field(() => Int)
	bookTotalQuantity: number;

	@Field(() => Int)
	bookSoldQuantity: number;

	@Field(() => Int)
	bookReservedQuantity: number;

	@Field(() => Int)
	bookBorrowedQuantity: number;

	@Field(() => BookShelf)
	bookShelf: BookShelf;

	@Field(() => BookInventoryLocation)
	bookLocation: BookInventoryLocation;

	@Field(() => BookInventoryPickup)
	bookPickup: BookInventoryPickup;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class BookInventories {
	@Field(() => [BookInventory])
	list: BookInventory[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
