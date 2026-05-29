import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { StatisticModifier, T } from '../../libs/types/common';
import { Direction, Message } from '../../libs/enums/common.enum';
import { Book, Books } from '../../libs/dto/book/book';
import {
	AllBooksInquiry,
	BooksInquiry,
	CreateBookInput,
	OrdinaryInquiry,
} from '../../libs/dto/book/book.input';
import { UpdateBookInput } from '../../libs/dto/book/book.update';
import { BookStatus } from '../../libs/enums/book.enum';
import { ViewService } from '../view/view.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { lookupAuthMemberLiked } from '../../libs/config';

@Injectable()
export class BookService {
	constructor(
		@InjectModel('Book') private readonly bookModel: Model<Book>,
		private readonly viewService: ViewService,
		private readonly likeService: LikeService,
	) {}

	public async createBook(input: CreateBookInput): Promise<Book> {
		try {
			const result = await this.bookModel.create(input);
			return result;
		} catch (err: unknown) {
			// err may be unknown; safely log a string representation
			const msg = err instanceof Error ? err.message : String(err);
			console.log('Error, Service.model:', msg);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getBook(
		memberId: ObjectId | null,
		bookId: ObjectId,
	): Promise<Book> {
		const search: T = {
			_id: bookId,
			deletedAt: null,
			bookStatus: { $ne: BookStatus.DELETED },
		};
		const foundBooks: Book[] = await this.bookModel
			.aggregate([{ $match: search }, lookupAuthMemberLiked(memberId)])
			.exec();
		const targetBook: Book = foundBooks[0];
		if (!targetBook)
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = {
				memberId: memberId,
				viewRefId: bookId,
				viewGroup: ViewGroup.BOOK,
			};
			const newView = await this.viewService.recordView(viewInput);
			if (newView) {
				await this.bookStatsEditor({
					_id: bookId,
					targetKey: 'bookViews',
					modifier: 1,
				});
				targetBook.bookViews++;
			}
		}

		return targetBook;
	}

	public async updateBook(input: UpdateBookInput): Promise<Book> {
		let { bookStatus, deletedAt } = input;
		const search: T = {
			_id: input._id,
			deletedAt: null,
		};

		if (bookStatus === BookStatus.DELETED) deletedAt = new Date();

		const result: Book = await this.bookModel
			.findOneAndUpdate(search, input, {
				new: true,
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result;
	}

	public async getBooks(
		memberId: ObjectId | null,
		input: BooksInquiry,
	): Promise<Books> {
		const match: T = {
			deletedAt: null,
			bookStatus: { $ne: BookStatus.DELETED },
		};
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
							lookupAuthMemberLiked(memberId),
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

	public async getFavoriteBooks(
		memberId: ObjectId,
		input: OrdinaryInquiry,
	): Promise<Books> {
		return await this.likeService.getFavoriteBooks(memberId, input);
	}

	public async getVisitedBooks(
		memberId: ObjectId,
		input: OrdinaryInquiry,
	): Promise<Books> {
		return await this.viewService.getVisitedBooks(memberId, input);
	}

	public async likeTargetBook(
		memberId: ObjectId,
		likeRefId: ObjectId,
	): Promise<Book> {
		const target: Book = await this.bookModel
			.findOne({
				_id: likeRefId,
				deletedAt: null,
				bookStatus: { $ne: BookStatus.DELETED },
			})
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.BOOK,
		};
		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.bookStatsEditor({
			_id: likeRefId,
			targetKey: 'bookLikes',
			modifier: modifier,
		});
		if (!result)
			throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	public async getAllBooksByAdmin(input: AllBooksInquiry): Promise<Books> {
		const { bookStatus, bookCategoryList } = input.search ?? {};
		const match: T = {};
		const sort: T = {
			[input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
		};

		if (bookStatus) match.bookStatus = bookStatus;
		if (bookCategoryList?.length)
			match.bookCategory = { $in: bookCategoryList };

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

	public async removeBookByAdmin(bookId: ObjectId): Promise<Book> {
		const result: Book = await this.bookModel
			.findOneAndDelete({
				_id: bookId,
				bookStatus: BookStatus.DELETED,
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
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
			if (typeof minPrice === 'number')
				match['bookPrice.amount'].$gte = minPrice;
			if (typeof maxPrice === 'number')
				match['bookPrice.amount'].$lte = maxPrice;
		}

		if (typeof minRating === 'number') {
			match['bookRating.average'] = { $gte: minRating };
		}
	}

	public async bookStatsEditor(input: StatisticModifier): Promise<Book> {
		const { _id, targetKey, modifier } = input;
		return await this.bookModel
			.findOneAndUpdate(
				{ _id },
				{
					$inc: { [targetKey]: modifier },
				},
				{ new: true },
			)
			.exec();
	}
}
