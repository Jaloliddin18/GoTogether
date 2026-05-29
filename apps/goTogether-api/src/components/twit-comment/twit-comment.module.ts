import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { TwitCommentResolver } from './twit-comment.resolver';
import { TwitCommentService } from './twit-comment.service';
import TwitCommentSchema from '../../schemas/TwitComment.model';
import TwitSchema from '../../schemas/Twit.model';
import { LikeModule } from '../like/like.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'TwitComment', schema: TwitCommentSchema },
		]),
		MongooseModule.forFeature([{ name: 'Twit', schema: TwitSchema }]),
		AuthModule,
		LikeModule,
	],
	providers: [TwitCommentResolver, TwitCommentService],
	exports: [TwitCommentService],
})
export class TwitCommentModule {}
