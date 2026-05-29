import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BookService } from './book.service';
import { Book, Books } from '../../libs/dto/book/book';
import {
	AllBooksInquiry,
	BooksInquiry,
	CreateBookInput,
	OrdinaryInquiry,
} from '../../libs/dto/book/book.input';
import { UpdateBookInput } from '../../libs/dto/book/book.update';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';
import { AuthGuard } from '../auth/guards/auth.guard';

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
	public async getBooks(
		@Args('input') input: BooksInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Books> {
		console.log('Query: getBooks');
		return await this.bookService.getBooks(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Book)
	public async getBook(
		@Args('bookId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Book> {
		console.log('Query: getBook');
		const bookId = shapeIntoMongoObjectId(input);
		return await this.bookService.getBook(memberId, bookId);
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

	@UseGuards(AuthGuard)
	@Query(() => Books)
	public async getFavoriteBooks(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Books> {
		console.log('Query: getFavoriteBooks');
		return await this.bookService.getFavoriteBooks(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Books)
	public async getVisitedBooks(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Books> {
		console.log('Query: getVisitedBooks');
		return await this.bookService.getVisitedBooks(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Book)
	public async likeTargetBook(
		@Args('bookId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Book> {
		console.log('Mutation: likeTargetBook');
		const likeRefId = shapeIntoMongoObjectId(input);
		return await this.bookService.likeTargetBook(memberId, likeRefId);
	}

	// ADMIN //

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Books)
	public async getAllBooksByAdmin(
		@Args('input') input: AllBooksInquiry,
	): Promise<Books> {
		console.log('Query: getAllBooksByAdmin');
		return await this.bookService.getAllBooksByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Book)
	public async removeBookByAdmin(@Args('bookId') input: string): Promise<Book> {
		console.log('Mutation: removeBookByAdmin');
		const bookId = shapeIntoMongoObjectId(input);
		return await this.bookService.removeBookByAdmin(bookId);
	}
}
