import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { T } from '../../libs/types/common';
import { Direction, Message } from '../../libs/enums/common.enum';
import { Book, Books } from '../../libs/dto/book/book';
import { BooksInquiry, CreateBookInput } from '../../libs/dto/book/book.input';
import {
	UpdateBookAvailabilityInput,
	UpdateBookInput,
} from '../../libs/dto/book/book.update';

@Injectable()
export class BookService {
	constructor(@InjectModel('Book') private readonly bookModel: Model<Book>) {}

	public async createBook(input: CreateBookInput): Promise<Book> {
		try {
			return await this.bookModel.create(input);
		} catch (err) {
			console.log('Error, Service.model:', err instanceof Error ? err.message : String(err));
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getBookById(bookId: ObjectId): Promise<Book> {
		const result: Book = await this.bookModel.findOne({ _id: bookId }).exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result;
	}

	public async getBooks(input: BooksInquiry): Promise<Books> {
		const match: T = {};
		const sort: T = {
			[input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
		};
		this.shapeMatchQuery(match, input);

		const result = await this.bookModel
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

	public async updateBook(input: UpdateBookInput): Promise<Book> {
		const result: Book = await this.bookModel
			.findOneAndUpdate({ _id: input._id }, input, {
				new: true,
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async updateBookAvailability(
		bookId: ObjectId,
		input: UpdateBookAvailabilityInput,
	): Promise<Book> {
		const update: T = { available: input.available };
		if (input.bookStatus) update.bookStatus = input.bookStatus;

		const result: Book = await this.bookModel
			.findOneAndUpdate({ _id: bookId }, update, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	private shapeMatchQuery(match: T, input: BooksInquiry): void {
		if (!input.search || Object.keys(input.search).length === 0) return;

		const { title, author, isbn, callNumber, category, available, bookStatus } =
			input.search;

		if (title) match.title = { $regex: new RegExp(title, 'i') };
		if (author) match.author = { $regex: new RegExp(author, 'i') };
		if (isbn) match.isbn = { $regex: new RegExp(isbn, 'i') };
		if (callNumber) match.callNumber = { $regex: new RegExp(callNumber, 'i') };
		if (category) match.category = { $regex: new RegExp(category, 'i') };
		if (typeof available === 'boolean') match.available = available;
		if (bookStatus) match.bookStatus = bookStatus;
	}
}
