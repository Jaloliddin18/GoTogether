import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentResolver } from './comment.resolver';
import CommentSchema from '../../schemas/Comment.model';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { PropertyModule } from '../property/property.module';
import { BoardArticleModule } from '../board-article/board-article.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Comment', schema: CommentSchema }]),
		AuthModule,
		MemberModule,
		BoardArticleModule,
		PropertyModule,
	],
	providers: [CommentService, CommentResolver],
	exports: [CommentService],
})
export class CommentModule {}
