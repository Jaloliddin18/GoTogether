import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { shapeIntoMongoObjectId } from '../../libs/config';
import {
	LostItem,
	LostItemSnapshotUploadResult,
	LostItems,
} from '../../libs/dto/lost-item/lost-item';
import { LostItemsInquiry } from '../../libs/dto/lost-item/lost-item.input';
import { UpdateLostItemStatusInput } from '../../libs/dto/lost-item/lost-item.update';
import { MemberType } from '../../libs/enums/member.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { LostItemService } from './lost-item.service';
import { FileUpload, GraphQLUpload } from 'graphql-upload';

@Resolver()
export class LostItemResolver {
	constructor(private readonly lostItemService: LostItemService) {}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => LostItems)
	public async getLostItems(
		@Args('input') input: LostItemsInquiry,
	): Promise<LostItems> {
		console.log('Query: getLostItems');
		return await this.lostItemService.getLostItems(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => LostItem)
	public async updateLostItemStatus(
		@Args('input') input: UpdateLostItemStatusInput,
	): Promise<LostItem> {
		console.log('Mutation: updateLostItemStatus');
		input.lostItemId = shapeIntoMongoObjectId(input.lostItemId);
		return await this.lostItemService.updateLostItemStatus(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => LostItemSnapshotUploadResult)
	public async uploadLostItemSnapshot(
		@Args({ name: 'file', type: () => GraphQLUpload })
		file: FileUpload,
	): Promise<LostItemSnapshotUploadResult> {
		console.log('Mutation: uploadLostItemSnapshot');
		return await this.lostItemService.uploadLostItemSnapshot(file);
	}
}
