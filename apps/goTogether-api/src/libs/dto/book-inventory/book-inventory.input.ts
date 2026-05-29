import { Field, InputType, Int } from '@nestjs/graphql';
import {
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from 'class-validator';
import { availableBookInventorySorts } from '../../config';
import { Direction } from '../../enums/common.enum';
import {
	BookInventoryStatus,
	BookInventoryType,
	BookStorageZone,
} from '../../enums/book-inventory.enum';

@InputType()
export class BookShelfInput {
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

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	slot?: string;
}

@InputType()
export class BookInventoryLocationInput {
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
export class BookInventoryPickupInput {
	@IsNotEmpty()
	@IsNumber()
	@Field(() => Number)
	gripperOpenWidthCm: number;

	@IsNotEmpty()
	@IsNumber()
	@Field(() => Number)
	gripperCloseWidthCm: number;

	@IsOptional()
	@IsNumber()
	@Field(() => Number, { nullable: true })
	gripHoldSeconds?: number;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	pickupDirection?: string;
}

@InputType()
export class CreateBookInventoryInput {
	@IsNotEmpty()
	@Field(() => String)
	bookId: string;

	@IsNotEmpty()
	@Field(() => BookInventoryType)
	bookInventoryType: BookInventoryType;

	@IsNotEmpty()
	@Field(() => BookStorageZone)
	bookStorageZone: BookStorageZone;

	@IsOptional()
	@Field(() => BookInventoryStatus, { nullable: true })
	bookInventoryStatus?: BookInventoryStatus;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	bookTotalQuantity?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	bookSoldQuantity?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	bookReservedQuantity?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	bookBorrowedQuantity?: number;

	@IsNotEmpty()
	@Field(() => BookShelfInput)
	bookShelf: BookShelfInput;

	@IsNotEmpty()
	@Field(() => BookInventoryLocationInput)
	bookLocation: BookInventoryLocationInput;

	@IsNotEmpty()
	@Field(() => BookInventoryPickupInput)
	bookPickup: BookInventoryPickupInput;
}

@InputType()
export class BookInventorySearchInput {
	@IsOptional()
	@Field(() => String, { nullable: true })
	bookId?: string;

	@IsOptional()
	@Field(() => BookInventoryType, { nullable: true })
	bookInventoryType?: BookInventoryType;

	@IsOptional()
	@Field(() => BookStorageZone, { nullable: true })
	bookStorageZone?: BookStorageZone;

	@IsOptional()
	@Field(() => BookInventoryStatus, { nullable: true })
	bookInventoryStatus?: BookInventoryStatus;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	floorId?: string;

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

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	slot?: string;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	minTotalQuantity?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	maxTotalQuantity?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	minSoldQuantity?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	maxSoldQuantity?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	minReservedQuantity?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	maxReservedQuantity?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	minBorrowedQuantity?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	maxBorrowedQuantity?: number;
}

@InputType()
export class BookInventoriesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableBookInventorySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => BookInventorySearchInput, { nullable: true })
	search?: BookInventorySearchInput;
}
