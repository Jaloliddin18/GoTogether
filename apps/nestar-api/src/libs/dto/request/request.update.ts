import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
	PaymentStatus,
	RequestErrorCode,
	RequestStatus,
} from '../../enums/request.enum';

@InputType()
export class UpdateRequestStatusInput {
	@IsNotEmpty()
	@Field(() => String)
	requestId: string;

	@IsNotEmpty()
	@Field(() => RequestStatus)
	status: RequestStatus;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	message?: string;

	@IsOptional()
	@Field(() => RequestErrorCode, { nullable: true })
	errorCode?: RequestErrorCode;

	@IsOptional()
	@Field(() => PaymentStatus, { nullable: true })
	paymentStatus?: PaymentStatus;
}

@InputType()
export class CancelRequestInput {
	@IsNotEmpty()
	@Field(() => String)
	requestId: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	sessionId?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	reason?: string;
}
