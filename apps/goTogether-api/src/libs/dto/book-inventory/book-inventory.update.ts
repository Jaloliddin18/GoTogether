import { Field, InputType, Int } from '@nestjs/graphql';
import {
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from 'class-validator';
import type { ObjectId } from 'mongoose';
import { BookInventoryStatus } from '../../enums/book-inventory.enum';

@InputType()
class BookShelfUpdateInput {
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
	@IsNumber()
	@Field(() => Number, { nullable: true })
	gripperOpenWidthCm?: number;

	@IsOptional()
	@IsNumber()
	@Field(() => Number, { nullable: true })
	gripperCloseWidthCm?: number;

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
export class UpdateBookInventoryInput {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

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

	@IsOptional()
	@Field(() => BookShelfUpdateInput, { nullable: true })
	bookShelf?: BookShelfUpdateInput;

	@IsOptional()
	@Field(() => BookLocationUpdateInput, { nullable: true })
	bookLocation?: BookLocationUpdateInput;

	@IsOptional()
	@Field(() => BookPickupUpdateInput, { nullable: true })
	bookPickup?: BookPickupUpdateInput;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	deletedAt?: Date;
}

@InputType()
export class UpdateBookInventoryStatusInput {
	@IsNotEmpty()
	@Field(() => String)
	bookInventoryId: ObjectId;

	@IsNotEmpty()
	@Field(() => BookInventoryStatus)
	bookInventoryStatus: BookInventoryStatus;
}
