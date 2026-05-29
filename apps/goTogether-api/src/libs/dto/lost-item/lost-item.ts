import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import {
	LostItemEventType,
	LostItemObjectType,
	LostItemPriority,
	LostItemStatus,
} from '../../enums/lost-item.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class LostItemLocation {
	@Field(() => String, { nullable: true })
	source?: string;

	@Field(() => String, { nullable: true })
	floorId?: string;

	@Field(() => Number, { nullable: true })
	x?: number;

	@Field(() => Number, { nullable: true })
	y?: number;

	@Field(() => String, { nullable: true })
	patrolCheckpoint?: string;
}

@ObjectType()
export class LostItem {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	robotId: string;

	@Field(() => LostItemEventType)
	eventType: LostItemEventType;

	@Field(() => LostItemObjectType)
	objectType: LostItemObjectType;

	@Field(() => Number)
	confidence: number;

	@Field(() => LostItemPriority)
	priority: LostItemPriority;

	@Field(() => Date)
	detectedAt: Date;

	@Field(() => String, { nullable: true })
	snapshotPath?: string;

	@Field(() => String, { nullable: true })
	snapshotUrl?: string;

	@Field(() => LostItemLocation, { nullable: true })
	location?: LostItemLocation;

	@Field(() => LostItemStatus)
	status: LostItemStatus;

	@Field(() => String, { nullable: true })
	notes?: string;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class LostItems {
	@Field(() => [LostItem])
	list: LostItem[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}

@ObjectType()
export class LostItemSnapshotUploadResult {
	@Field(() => String)
	snapshotPath: string;

	@Field(() => String)
	snapshotUrl: string;
}
