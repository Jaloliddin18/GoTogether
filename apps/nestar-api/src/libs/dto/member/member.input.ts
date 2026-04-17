import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import {
	MemberAuthType,
	MemberStatus,
	MemberType,
} from '../../enums/member.enum';
import { availableAgentSorts, availableMemberSort } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class MemberInput {
	@IsNotEmpty() // should be not empty
	@Length(3, 12) // member nick length min 3, max 12 characters
	@Field(() => String) // return string value
	memberNick: string;

	@IsNotEmpty()
	@Length(5, 12)
	@Field(() => String)
	memberPassword: string;

	@IsNotEmpty()
	@Field(() => String)
	memberPhone: string;

	@IsOptional()
	@Field(() => MemberType, { nullable: true }) // bosh bolishi mumkin
	memberType?: MemberType;

	@IsOptional()
	@Field(() => MemberAuthType, { nullable: true }) // bosh bolishi mumkin
	memberAuthType?: MemberAuthType;
}

@InputType()
export class LoginInput {
	@IsNotEmpty() // should be not empty
	@Length(3, 12) // member nick length min 3, max 12 characters
	@Field(() => String) // return string value
	memberNick: string;

	@IsNotEmpty()
	@Length(5, 12)
	@Field(() => String)
	memberPassword: string;
}

@InputType()
class AISearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class AgentsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableAgentSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AISearch)
	search: AISearch;
}

@InputType()
class MISearch {
	@IsOptional()
	@Field(() => MemberStatus, { nullable: true })
	memberStatus?: MemberStatus;

	@IsOptional()
	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;

	@IsNotEmpty()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class MembersInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableMemberSort)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty() // search is specific with typing
	@Field(() => MISearch)
	search: MISearch;
}
