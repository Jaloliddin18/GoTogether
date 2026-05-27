import { Field, Float, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { RobotStatus } from '../../enums/robot.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class RobotPose {
	@Field(() => String)
	floorId: string;

	@Field(() => Number)
	x: number;

	@Field(() => Number)
	y: number;

	@Field(() => Number)
	theta: number;
}

@ObjectType()
export class Robot {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	robotId: string;

	@Field(() => String)
	name: string;

	@Field(() => RobotStatus)
	status: RobotStatus;

	@Field(() => Float)
	battery: number;

	@Field(() => Boolean)
	isOnline: boolean;

	@Field(() => Date, { nullable: true })
	lastSeenAt?: Date;

	@Field(() => String, { nullable: true })
	currentRequestId?: ObjectId;

	@Field(() => RobotPose)
	currentPose: RobotPose;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Robots {
	@Field(() => [Robot])
	list: Robot[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
