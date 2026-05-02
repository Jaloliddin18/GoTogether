import { Field, InputType, Int } from '@nestjs/graphql';
import {
	IsEnum,
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from 'class-validator';
import { availableRequestSorts } from '../../config';
import { Direction } from '../../enums/common.enum';
import {
	DeliveryDestinationType,
	PaymentStatus,
	RequestStatus,
	RequestType,
} from '../../enums/request.enum';

@InputType()
export class DestinationInput {
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
export class CreateDeliveryRequestInput {
	@IsNotEmpty()
	@Field(() => String)
	bookId: string;

	@IsNotEmpty()
	@IsEnum(RequestType)
	@Field(() => RequestType)
	requestType: RequestType;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	sessionId?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	sourceInventoryId?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	destinationDeskId?: string;

	@IsOptional()
	@Field(() => DestinationInput, { nullable: true })
	destination?: DestinationInput;
}

@InputType()
export class RequestsSearchInput {
	@IsOptional()
	@Field(() => RequestStatus, { nullable: true })
	status?: RequestStatus;

	@IsOptional()
	@Field(() => RequestType, { nullable: true })
	requestType?: RequestType;

	@IsOptional()
	@Field(() => DeliveryDestinationType, { nullable: true })
	destinationType?: DeliveryDestinationType;

	@IsOptional()
	@Field(() => PaymentStatus, { nullable: true })
	paymentStatus?: PaymentStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	bookId?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	sourceInventoryId?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	robotId?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	sessionId?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	destinationDeskId?: string;
}

@InputType()
export class RequestsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableRequestSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => RequestsSearchInput, { nullable: true })
	search?: RequestsSearchInput;
}

@InputType()
export class SessionRequestsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@Field(() => String, { nullable: true })
	sessionId?: string;

	@IsOptional()
	@IsIn(availableRequestSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;
}
