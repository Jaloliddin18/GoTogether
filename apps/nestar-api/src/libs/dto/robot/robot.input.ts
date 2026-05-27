import { Field, Float, InputType, Int } from '@nestjs/graphql';
import {
	IsBoolean,
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Length,
	Max,
	Min,
} from 'class-validator';
import { availableRobotSorts } from '../../config';
import { Direction } from '../../enums/common.enum';
import { RobotStatus } from '../../enums/robot.enum';

@InputType()
export class RobotPoseInput {
	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	floorId: string;

	@IsNotEmpty()
	@IsNumber()
	@Field(() => Number)
	x: number;

	@IsNotEmpty()
	@IsNumber()
	@Field(() => Number)
	y: number;

	@IsNotEmpty()
	@IsNumber()
	@Field(() => Number)
	theta: number;
}

@InputType()
export class CreateRobotInput {
	@IsNotEmpty()
	@Length(2, 40)
	@Field(() => String)
	robotId: string;

	@IsNotEmpty()
	@Length(2, 120)
	@Field(() => String)
	name: string;

	@IsOptional()
	@Field(() => RobotStatus, { nullable: true })
	status?: RobotStatus;

	@IsOptional()
	@Min(0)
	@Max(100)
	@Field(() => Float, { nullable: true })
	battery?: number;

	@IsOptional()
	@IsBoolean()
	@Field(() => Boolean, { nullable: true })
	isOnline?: boolean;

	@IsOptional()
	@Field(() => String, { nullable: true })
	currentRequestId?: string;

	@IsOptional()
	@Field(() => RobotPoseInput, { nullable: true })
	currentPose?: RobotPoseInput;
}

@InputType()
export class RobotSearchInput {
	@IsOptional()
	@Field(() => String, { nullable: true })
	robotId?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	name?: string;

	@IsOptional()
	@Field(() => RobotStatus, { nullable: true })
	status?: RobotStatus;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	isOnline?: boolean;

	@IsOptional()
	@Min(0)
	@Max(100)
	@Field(() => Float, { nullable: true })
	batteryMin?: number;

	@IsOptional()
	@Min(0)
	@Max(100)
	@Field(() => Float, { nullable: true })
	batteryMax?: number;
}

@InputType()
export class RobotsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableRobotSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => RobotSearchInput, { nullable: true })
	search?: RobotSearchInput;
}
