import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class Twit {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => String)
	text: string;

	@Field(() => String, { nullable: true })
	image?: string;

	@Field(() => [String])
	likes: ObjectId[];

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
}

@ObjectType()
export class Twits {
	@Field(() => [Twit])
	list: Twit[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
