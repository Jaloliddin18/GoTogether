import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { shapeIntoMongoObjectId } from '../../libs/config';
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
import { Book } from '../../libs/dto/book/book';
import { BookStatus } from '../../libs/enums/book.enum';

@Injectable()
export class BookInventoryService {
	constructor(
		@InjectModel('BookInventory')
		private readonly bookInventoryModel: Model<BookInventory>,
		@InjectModel('Book') private readonly bookModel: Model<Book>,
	) {}

	public async createBookInventory(
		input: CreateBookInventoryInput,
	): Promise<BookInventory> {
		try {
			const payload: T = { ...input };
			payload.bookId = shapeIntoMongoObjectId(input.bookId);
			await this.assertBookExists(payload.bookId);
			return await this.bookInventoryModel.create(payload);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			console.log('Error, Service.model:', msg);
			if (
				err instanceof BadRequestException ||
				err instanceof InternalServerErrorException
			) {
				throw err;
			}
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getBookInventory(bookInventoryId: ObjectId): Promise<BookInventory> {
		const result: BookInventory = await this.bookInventoryModel
			.findOne({
				_id: bookInventoryId,
				deletedAt: null,
			})
			.lean()
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result;
	}

	public async getBookInventories(
		input: BookInventoriesInquiry,
	): Promise<BookInventories> {
		const match: T = {
			deletedAt: null,
		};
		const sort: T = {
			[input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
		};
		this.shapeMatchQuery(match, input);

		const result = await this.bookInventoryModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length)
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async getAllBookInventoriesByAdmin(
		input: BookInventoriesInquiry,
	): Promise<BookInventories> {
		return await this.getBookInventories(input);
	}

	public async updateBookInventory(
		input: UpdateBookInventoryInput,
	): Promise<BookInventory> {
		const payload: T = { ...input };
		delete payload._id;

		const target = await this.bookInventoryModel
			.findOne({
				_id: input._id,
				deletedAt: null,
			})
			.lean()
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		await this.assertBookExists(target.bookId);

		const result: BookInventory = await this.bookInventoryModel
			.findOneAndUpdate(
				{
					_id: input._id,
					deletedAt: null,
				},
				payload,
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async updateBookInventoryStatus(
		input: UpdateBookInventoryStatusInput,
	): Promise<BookInventory> {
		const result: BookInventory = await this.bookInventoryModel
			.findOneAndUpdate(
				{
					_id: input.bookInventoryId,
					deletedAt: null,
				},
				{ bookInventoryStatus: input.bookInventoryStatus },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async removeBookInventoryByAdmin(
		bookInventoryId: ObjectId,
	): Promise<BookInventory> {
		const result: BookInventory = await this.bookInventoryModel
			.findOneAndUpdate(
				{
					_id: bookInventoryId,
					deletedAt: null,
				},
				{ deletedAt: new Date() },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}

	private async assertBookExists(bookId: ObjectId): Promise<void> {
		const target = await this.bookModel
			.findOne({
				_id: bookId,
				deletedAt: null,
				bookStatus: { $ne: BookStatus.DELETED },
			})
			.lean()
			.exec();
		if (!target) throw new BadRequestException(Message.NO_DATA_FOUND);
	}

	private shapeMatchQuery(match: T, input: BookInventoriesInquiry): void {
		if (!input.search || Object.keys(input.search).length === 0) return;

		const {
			bookId,
			bookInventoryType,
			bookStorageZone,
			bookInventoryStatus,
			floorId,
			section,
			row,
			level,
			slot,
			minTotalQuantity,
			maxTotalQuantity,
			minSoldQuantity,
			maxSoldQuantity,
		} = input.search;

		if (bookId) match.bookId = shapeIntoMongoObjectId(bookId);
		if (bookInventoryType) match.bookInventoryType = bookInventoryType;
		if (bookStorageZone) match.bookStorageZone = bookStorageZone;
		if (bookInventoryStatus) match.bookInventoryStatus = bookInventoryStatus;
		if (floorId) match['bookLocation.floorId'] = floorId;
		if (section) match['bookShelf.section'] = section;
		if (row) match['bookShelf.row'] = row;
		if (level) match['bookShelf.level'] = level;
		if (slot) match['bookShelf.slot'] = slot;

		if (
			typeof minTotalQuantity === 'number' ||
			typeof maxTotalQuantity === 'number'
		) {
			match.bookTotalQuantity = {};
			if (typeof minTotalQuantity === 'number') {
				match.bookTotalQuantity.$gte = minTotalQuantity;
			}
			if (typeof maxTotalQuantity === 'number') {
				match.bookTotalQuantity.$lte = maxTotalQuantity;
			}
		}

		if (
			typeof minSoldQuantity === 'number' ||
			typeof maxSoldQuantity === 'number'
		) {
			match.bookSoldQuantity = {};
			if (typeof minSoldQuantity === 'number') {
				match.bookSoldQuantity.$gte = minSoldQuantity;
			}
			if (typeof maxSoldQuantity === 'number') {
				match.bookSoldQuantity.$lte = maxSoldQuantity;
			}
		}
	}
}
