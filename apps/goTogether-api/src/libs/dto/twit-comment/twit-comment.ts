import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class TwitComment {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	twitId: ObjectId;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => String)
	text: string;

	@Field(() => String, { nullable: true })
	parentCommentId?: ObjectId;

	@Field(() => Int)
	depth: number;

	@Field(() => Int)
	likeCount: number;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => Boolean, { nullable: true })
	meLiked?: boolean;
}

@ObjectType()
export class TwitComments {
	@Field(() => [TwitComment])
	list: TwitComment[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
