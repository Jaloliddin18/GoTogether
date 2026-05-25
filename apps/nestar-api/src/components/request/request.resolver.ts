import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RequestService } from './request.service';
import { Requests, RequestTask } from '../../libs/dto/request/request';
import {
	CreateDeliveryRequestInput,
	RequestsInquiry,
	SessionRequestsInquiry,
} from '../../libs/dto/request/request.input';
import {
	CancelRequestInput,
	ConfirmRequestPickupInput,
	UpdateRequestStatusInput,
} from '../../libs/dto/request/request.update';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';
import { Member } from '../../libs/dto/member/member';

@Resolver()
export class RequestResolver {
	constructor(private readonly requestService: RequestService) {}

	@UseGuards(WithoutGuard)
	@Mutation(() => RequestTask)
	public async createDeliveryRequest(
		@Args('input') input: CreateDeliveryRequestInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<RequestTask> {
		console.log('Mutation: createDeliveryRequest');
		return await this.requestService.createDeliveryRequest(input, memberId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Requests)
	public async getRequests(
		@Args('input') input: RequestsInquiry,
	): Promise<Requests> {
		console.log('Query: getRequests');
		return await this.requestService.getRequests(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => RequestTask)
	public async getRequest(@Args('requestId') input: string): Promise<RequestTask> {
		console.log('Query: getRequest');
		const requestId = shapeIntoMongoObjectId(input);
		return await this.requestService.getRequestById(requestId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Requests)
	public async getSessionRequests(
		@Args('input') input: SessionRequestsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Requests> {
		return await this.requestService.getSessionRequests(input, memberId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => RequestTask)
	public async updateRequestStatus(
		@Args('input') input: UpdateRequestStatusInput,
	): Promise<RequestTask> {
		console.log('Mutation: updateRequestStatus');
		const requestId = shapeIntoMongoObjectId(input.requestId);
		return await this.requestService.updateRequestStatus(requestId, input);
	}

	@UseGuards(WithoutGuard)
	@Mutation(() => RequestTask)
	public async cancelRequest(
		@Args('input') input: CancelRequestInput,
		@AuthMember() authMember: Member,
	): Promise<RequestTask> {
		console.log('Mutation: cancelRequest');
		const requestId = shapeIntoMongoObjectId(input.requestId);
		return await this.requestService.cancelRequest(requestId, input, authMember);
	}

	@UseGuards(WithoutGuard)
	@Mutation(() => RequestTask)
	public async confirmRequestPickup(
		@Args('input') input: ConfirmRequestPickupInput,
		@AuthMember() authMember: Member,
	): Promise<RequestTask> {
		console.log('Mutation: confirmRequestPickup');
		const requestId = shapeIntoMongoObjectId(input.requestId);
		return await this.requestService.confirmRequestPickup(
			requestId,
			input,
			authMember,
		);
	}
}
