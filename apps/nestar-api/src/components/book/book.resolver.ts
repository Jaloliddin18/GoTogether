import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BookService } from './book.service';
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
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class BookResolver {
	constructor(private readonly bookService: BookService) {}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Book)
	public async createBook(
		@Args('input') input: CreateBookInput,
	): Promise<Book> {
		console.log('Mutation: createBook');
		return await this.bookService.createBook(input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Books)
	public async getBooks(@Args('input') input: BooksInquiry): Promise<Books> {
		console.log('Query: getBooks');
		return await this.bookService.getBooks(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Books)
	public async getAllBooksByAdmin(
		@Args('input') input: AllBooksInquiry,
	): Promise<Books> {
		console.log('Query: getAllBooksByAdmin');
		return await this.bookService.getAllBooksByAdmin(input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Book)
	public async getBook(@Args('bookId') input: string): Promise<Book> {
		console.log('Query: getBook');
		const bookId = shapeIntoMongoObjectId(input);
		return await this.bookService.getBookById(bookId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Book)
	public async updateBook(
		@Args('input') input: UpdateBookInput,
	): Promise<Book> {
		console.log('Mutation: updateBook');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.bookService.updateBook(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Book)
	public async updateBookAvailability(
		@Args('input') input: UpdateBookAvailabilityInput,
	): Promise<Book> {
		console.log('Mutation: updateBookAvailability');
		const bookId = shapeIntoMongoObjectId(input.bookId);
		input.bookId = bookId;
		return await this.bookService.updateBookAvailability(bookId, input);
	}
}
