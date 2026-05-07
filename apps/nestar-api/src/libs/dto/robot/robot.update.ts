import { Field, InputType, Int } from '@nestjs/graphql';
import {
	IsBoolean,
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
	@IsOptional()
	@Field(() => String, { nullable: true })
	_id?: ObjectId;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	robotId?: string;

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
