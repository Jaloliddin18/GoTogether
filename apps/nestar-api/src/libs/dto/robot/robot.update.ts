import { Field, InputType, Int } from '@nestjs/graphql';
import {
	IsBoolean,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Length,
	Max,
	Min,
} from 'class-validator';
import type { ObjectId } from 'mongoose';
import { RobotStatus } from '../../enums/robot.enum';

@InputType()
class RobotPoseUpdateInput {
	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	floorId?: string;

	@IsOptional()
	@IsNumber()
	@Field(() => Number, { nullable: true })
	x?: number;

	@IsOptional()
	@IsNumber()
	@Field(() => Number, { nullable: true })
	y?: number;

	@IsOptional()
	@IsNumber()
	@Field(() => Number, { nullable: true })
	theta?: number;
}

@InputType()
export class UpdateRobotInput {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Length(2, 120)
	@Field(() => String, { nullable: true })
	name?: string;

	@IsOptional()
	@Field(() => RobotStatus, { nullable: true })
	status?: RobotStatus;

	@IsOptional()
	@Min(0)
	@Max(100)
	@Field(() => Int, { nullable: true })
	battery?: number;

	@IsOptional()
	@IsBoolean()
	@Field(() => Boolean, { nullable: true })
	isOnline?: boolean;

	@IsOptional()
	@Field(() => String, { nullable: true })
	currentRequestId?: string;

	@IsOptional()
	@Field(() => RobotPoseUpdateInput, { nullable: true })
	currentPose?: RobotPoseUpdateInput;
}

@InputType()
export class UpdateRobotStatusInput {
	@IsNotEmpty()
	@Field(() => String)
	robotId: string;

	@IsNotEmpty()
	@Field(() => RobotStatus)
	status: RobotStatus;

	@IsOptional()
	@Min(0)
	@Max(100)
	@Field(() => Int, { nullable: true })
	battery?: number;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	lastSeenAt?: Date;

	@IsOptional()
	@Field(() => String, { nullable: true })
	currentRequestId?: string;
}

@InputType()
export class UpdateRobotPoseInput {
	@IsNotEmpty()
	@Field(() => String)
	robotId: string;

	@IsNotEmpty()
	@Field(() => RobotPoseUpdateInput)
	currentPose: RobotPoseUpdateInput;

	@IsOptional()
	@Min(0)
	@Max(100)
	@Field(() => Int, { nullable: true })
	battery?: number;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	lastSeenAt?: Date;
}

@InputType()
export class UpdateRobotOnlineStateInput {
	@IsNotEmpty()
	@Field(() => String)
	robotId: string;

	@IsNotEmpty()
	@IsBoolean()
	@Field(() => Boolean)
	isOnline: boolean;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	lastSeenAt?: Date;
}
