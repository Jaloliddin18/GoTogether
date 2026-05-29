import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { BookCategory, BookStatus, BookType } from '../../enums/book.enum';
import {
	BookInventoryStatus,
	BookInventoryType,
} from '../../enums/book-inventory.enum';
import { MemberStatus, MemberType } from '../../enums/member.enum';
import {
	DeliveryDestinationType,
	PaymentStatus,
	RequestStatus,
	RequestType,
} from '../../enums/request.enum';
import { RobotStatus } from '../../enums/robot.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class RequestDestination {
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
export class RequestTimelineItem {
	@Field(() => RequestStatus)
	status: RequestStatus;

	@Field(() => String, { nullable: true })
	message?: string;

	@Field(() => Date)
	timestamp: Date;
}

@ObjectType()
export class RequestError {
	@Field(() => String, { nullable: true })
	code?: string;

	@Field(() => String, { nullable: true })
	message?: string;

	@Field(() => Date, { nullable: true })
	timestamp?: Date;
}

@ObjectType()
export class RequestBookData {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	bookTitle: string;

	@Field(() => String, { nullable: true })
	bookAuthor?: string;

	@Field(() => [String], { nullable: true })
	bookImages?: string[];

	@Field(() => String, { nullable: true })
	bookCallNumber?: string;

	@Field(() => BookStatus, { nullable: true })
	bookStatus?: BookStatus;

	@Field(() => BookType, { nullable: true })
	bookType?: BookType;

	@Field(() => BookCategory, { nullable: true })
	bookCategory?: BookCategory;
}

@ObjectType()
export class RequestRobotData {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	robotId: string;

	@Field(() => RobotStatus)
	status: RobotStatus;

	@Field(() => Boolean)
	isOnline: boolean;

	@Field(() => Number)
	battery: number;

	@Field(() => RequestDestination, { nullable: true })
	currentPose?: RequestDestination;

	@Field(() => Date, { nullable: true })
	lastSeenAt?: Date;
}

@ObjectType()
export class RequestInventoryShelfData {
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
export class RequestInventoryPickupData {
	@Field(() => Number)
	gripperOpenWidthCm: number;

	@Field(() => Number)
	gripperCloseWidthCm: number;

	@Field(() => Number)
	gripHoldSeconds: number;

	@Field(() => String)
	pickupDirection: string;
}

@ObjectType()
export class RequestInventoryData {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => BookInventoryType, { nullable: true })
	bookInventoryType?: BookInventoryType;

	@Field(() => BookInventoryStatus, { nullable: true })
	bookInventoryStatus?: BookInventoryStatus;

	@Field(() => RequestDestination, { nullable: true })
	bookLocation?: RequestDestination;

	@Field(() => RequestInventoryShelfData, { nullable: true })
	bookShelf?: RequestInventoryShelfData;

	@Field(() => RequestInventoryPickupData, { nullable: true })
	bookPickup?: RequestInventoryPickupData;

	@Field(() => Number, { nullable: true })
	bookTotalQuantity?: number;

	@Field(() => Number, { nullable: true })
	bookReservedQuantity?: number;

	@Field(() => Number, { nullable: true })
	bookBorrowedQuantity?: number;

	@Field(() => Number, { nullable: true })
	bookSoldQuantity?: number;
}

@ObjectType()
export class RequestMemberData {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	memberNick: string;

	@Field(() => String, { nullable: true })
	memberImage?: string;

	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;

	@Field(() => MemberStatus, { nullable: true })
	memberStatus?: MemberStatus;
}

@ObjectType('Request')
export class RequestTask {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	bookId: ObjectId;

	@Field(() => String)
	sourceInventoryId: ObjectId;

	@Field(() => RequestType)
	requestType: RequestType;

	@Field(() => String, { nullable: true })
	robotId?: ObjectId;

	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@Field(() => String, { nullable: true })
	sessionId?: string;

	@Field(() => String, { nullable: true })
	destinationDeskId?: string;

	@Field(() => DeliveryDestinationType)
	destinationType: DeliveryDestinationType;

	@Field(() => RequestDestination)
	destination: RequestDestination;

	@Field(() => RequestStatus)
	status: RequestStatus;

	@Field(() => PaymentStatus)
	paymentStatus: PaymentStatus;

	@Field(() => [RequestTimelineItem])
	timeline: RequestTimelineItem[];

	@Field(() => RequestError, { nullable: true })
	error?: RequestError | null;

	@Field(() => RequestBookData, { nullable: true })
	bookData?: RequestBookData;

	@Field(() => RequestRobotData, { nullable: true })
	robotData?: RequestRobotData;

	@Field(() => RequestInventoryData, { nullable: true })
	inventoryData?: RequestInventoryData;

	@Field(() => RequestMemberData, { nullable: true })
	memberData?: RequestMemberData;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Requests {
	@Field(() => [RequestTask])
	list: RequestTask[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
