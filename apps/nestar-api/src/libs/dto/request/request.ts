import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import {
	DeliveryDestinationType,
	PaymentStatus,
	RequestErrorCode,
	RequestStatus,
	RequestType,
} from '../../enums/request.enum';
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
	@Field(() => RequestErrorCode)
	code: RequestErrorCode;

	@Field(() => String, { nullable: true })
	message?: string;

	@Field(() => Date)
	timestamp: Date;
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
	error?: RequestError;

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
