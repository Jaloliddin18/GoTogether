import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';

@InputType()
class FISearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	followingId?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	followerId?: string;
}

@InputType()
export class FollowInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsNotEmpty()
	@Field(() => FISearch)
	search: FISearch;
}
