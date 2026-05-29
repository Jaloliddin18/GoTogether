import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RobotService } from './robot.service';
import { Robot, Robots } from '../../libs/dto/robot/robot';
import {
	CreateRobotInput,
	RobotsInquiry,
} from '../../libs/dto/robot/robot.input';
import { UpdateRobotInput } from '../../libs/dto/robot/robot.update';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class RobotResolver {
	constructor(private readonly robotService: RobotService) {}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Robot)
	public async createRobot(
		@Args('input') input: CreateRobotInput,
	): Promise<Robot> {
		console.log('Mutation: createRobot');
		return await this.robotService.createRobot(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Robots)
	public async getRobots(@Args('input') input: RobotsInquiry): Promise<Robots> {
		console.log('Query: getRobots');
		return await this.robotService.getRobots(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Robot)
	public async getRobot(@Args('robotId') robotId: string): Promise<Robot> {
		console.log('Query: getRobot');
		return await this.robotService.getRobotByRobotId(robotId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Robot)
	public async updateRobot(
		@Args('input') input: UpdateRobotInput,
	): Promise<Robot> {
		console.log('Mutation: updateRobot');
		return await this.robotService.updateRobot(input);
	}
}
