import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, Length } from 'class-validator';
import type { ObjectId } from 'mongoose';

@InputType()
export class UpdateTwitCommentInput {
	@IsNotEmpty()
	@Field(() => String)
	commentId: ObjectId;

	@IsNotEmpty()
	@Length(1, 1000)
	@Field(() => String)
	text: string;
}
