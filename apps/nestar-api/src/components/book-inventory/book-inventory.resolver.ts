import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BookInventoryService } from './book-inventory.service';
import {
	BookInventory,
	BookInventories,
} from '../../libs/dto/book-inventory/book-inventory';
import {
	BookInventoriesInquiry,
	CreateBookInventoryInput,
} from '../../libs/dto/book-inventory/book-inventory.input';
import {
	UpdateBookInventoryInput,
	UpdateBookInventoryStatusInput,
} from '../../libs/dto/book-inventory/book-inventory.update';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class BookInventoryResolver {
	constructor(private readonly bookInventoryService: BookInventoryService) {}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => BookInventory)
	public async createBookInventory(
		@Args('input') input: CreateBookInventoryInput,
	): Promise<BookInventory> {
		console.log('Mutation: createBookInventory');
		return await this.bookInventoryService.createBookInventory(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => BookInventories)
	public async getBookInventories(
		@Args('input') input: BookInventoriesInquiry,
	): Promise<BookInventories> {
		console.log('Query: getBookInventories');
		return await this.bookInventoryService.getBookInventories(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => BookInventories)
	public async getAllBookInventoriesByAdmin(
		@Args('input') input: BookInventoriesInquiry,
	): Promise<BookInventories> {
		console.log('Query: getAllBookInventoriesByAdmin');
		return await this.bookInventoryService.getAllBookInventoriesByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => BookInventory)
	public async getBookInventory(
		@Args('bookInventoryId') input: string,
	): Promise<BookInventory> {
		console.log('Query: getBookInventory');
		const bookInventoryId = shapeIntoMongoObjectId(input);
		return await this.bookInventoryService.getBookInventory(bookInventoryId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => BookInventory)
	public async updateBookInventory(
		@Args('input') input: UpdateBookInventoryInput,
	): Promise<BookInventory> {
		console.log('Mutation: updateBookInventory');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.bookInventoryService.updateBookInventory(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => BookInventory)
	public async updateBookInventoryStatus(
		@Args('input') input: UpdateBookInventoryStatusInput,
	): Promise<BookInventory> {
		console.log('Mutation: updateBookInventoryStatus');
		input.bookInventoryId = shapeIntoMongoObjectId(input.bookInventoryId);
		return await this.bookInventoryService.updateBookInventoryStatus(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => BookInventory)
	public async removeBookInventoryByAdmin(
		@Args('bookInventoryId') input: string,
	): Promise<BookInventory> {
		console.log('Mutation: removeBookInventoryByAdmin');
		const bookInventoryId = shapeIntoMongoObjectId(input);
		return await this.bookInventoryService.removeBookInventoryByAdmin(
			bookInventoryId,
		);
	}
}
