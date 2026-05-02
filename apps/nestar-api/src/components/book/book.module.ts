import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { BookResolver } from './book.resolver';
import { BookService } from './book.service';
import BookSchema from '../../schemas/Book.model';
import { ViewModule } from '../view/view.module';
import { LikeModule } from '../like/like.module';
import { MemberModule } from '../member/member.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Book', schema: BookSchema }]),
		AuthModule,
		ViewModule,
		LikeModule,
		MemberModule,
	],
	providers: [BookResolver, BookService],
	exports: [BookService],
})
export class BookModule {}
