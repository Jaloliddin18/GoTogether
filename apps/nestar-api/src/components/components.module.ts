import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { BookModule } from './book/book.module';
import { RobotModule } from './robot/robot.module';
import { RequestModule } from './request/request.module';

@Module({
		imports: [
			MemberModule,
			AuthModule,
		CommentModule,
		LikeModule,
		ViewModule,
		FollowModule,
		BoardArticleModule,
		BookModule,
		RobotModule,
		RequestModule,
	],
})
export class ComponentsModule {}
