import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { BookModule } from './book/book.module';
import { BookInventoryModule } from './book-inventory/book-inventory.module';
import { RobotModule } from './robot/robot.module';
import { RequestModule } from './request/request.module';
import { TwitModule } from './twit/twit.module';
import { TwitCommentModule } from './twit-comment/twit-comment.module';
import { ChatModule } from './chat/chat.module';

@Module({
	imports: [
		MemberModule,
		AuthModule,
		CommentModule,
		LikeModule,
		ViewModule,
		FollowModule,
		BookModule,
		BookInventoryModule,
		RobotModule,
		RequestModule,
		TwitModule,
		TwitCommentModule,
		ChatModule,
	],
})
export class ComponentsModule {}
