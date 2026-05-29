import { Field, InputType } from '@nestjs/graphql';
import {
	ArrayMaxSize,
	IsArray,
	IsNotEmpty,
	IsOptional,
	Length,
} from 'class-validator';
import type { ObjectId } from 'mongoose';

@InputType()
export class TwitUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Length(1, 280)
	@Field(() => String, { nullable: true })
	text?: string;

	@IsArray()
	@ArrayMaxSize(3)
	@IsOptional()
	@Field(() => [String], { nullable: true })
	images?: string[];
}
