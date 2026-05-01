import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { BookResolver } from './book.resolver';
import { BookService } from './book.service';
import BookSchema from '../../schemas/Book.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Book', schema: BookSchema }]),
		AuthModule,
	],
	providers: [BookResolver, BookService],
	exports: [BookService],
})
export class BookModule {}
