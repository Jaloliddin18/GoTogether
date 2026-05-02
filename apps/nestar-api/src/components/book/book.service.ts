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
import {
	AllBooksInquiry,
	BooksInquiry,
	CreateBookInput,
} from '../../libs/dto/book/book.input';
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
		const result: Book = await this.bookModel
			.findOne({ _id: bookId, deletedAt: null })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result;
	}

	public async getBooks(input: BooksInquiry): Promise<Books> {
		const match: T = { deletedAt: null };
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

	public async getAllBooksByAdmin(input: AllBooksInquiry): Promise<Books> {
		const { bookStatus, bookCategoryList } = input.search ?? {};
		const match: T = {};
		const sort: T = {
			[input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
		};

		if (bookStatus) match.bookStatus = bookStatus;
		if (bookCategoryList?.length) match.bookCategory = { $in: bookCategoryList };

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

		const {
			keyword,
			bookTitle,
			bookAuthor,
			bookIsbn,
			bookCallNumber,
			bookCategory,
			bookType,
			bookAudience,
			bookFormat,
			bookLanguage,
			bookStatus,
			isBorrowable,
			isPurchasable,
			minPrice,
			maxPrice,
			minRating,
		} = input.search;

		if (keyword) {
			const regex = new RegExp(keyword, 'i');
			match.$or = [
				{ bookTitle: { $regex: regex } },
				{ bookAuthor: { $regex: regex } },
				{ bookIsbn: { $regex: regex } },
				{ bookCallNumber: { $regex: regex } },
			];
		}

		if (bookTitle) match.bookTitle = { $regex: new RegExp(bookTitle, 'i') };
		if (bookAuthor) match.bookAuthor = { $regex: new RegExp(bookAuthor, 'i') };
		if (bookIsbn) match.bookIsbn = { $regex: new RegExp(bookIsbn, 'i') };
		if (bookCallNumber)
			match.bookCallNumber = { $regex: new RegExp(bookCallNumber, 'i') };
		if (bookCategory) match.bookCategory = bookCategory;
		if (bookType) match.bookType = bookType;
		if (bookAudience) match.bookAudience = bookAudience;
		if (bookFormat) match.bookFormat = bookFormat;
		if (bookLanguage) match.bookLanguage = bookLanguage;
		if (bookStatus) match.bookStatus = bookStatus;
		if (typeof isBorrowable === 'boolean') match.isBorrowable = isBorrowable;
		if (typeof isPurchasable === 'boolean') match.isPurchasable = isPurchasable;

		if (typeof minPrice === 'number' || typeof maxPrice === 'number') {
			match['bookPrice.amount'] = {};
			if (typeof minPrice === 'number') match['bookPrice.amount'].$gte = minPrice;
			if (typeof maxPrice === 'number') match['bookPrice.amount'].$lte = maxPrice;
		}

		if (typeof minRating === 'number') {
			match['bookRating.average'] = { $gte: minRating };
		}
	}
}
