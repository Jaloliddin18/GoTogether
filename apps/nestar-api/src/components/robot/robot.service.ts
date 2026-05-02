import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { T } from '../../libs/types/common';
import { Direction, Message } from '../../libs/enums/common.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Robot, Robots } from '../../libs/dto/robot/robot';
import { CreateRobotInput, RobotsInquiry } from '../../libs/dto/robot/robot.input';
import {
	UpdateRobotOnlineStateInput,
	UpdateRobotPoseInput,
	UpdateRobotStatusInput,
} from '../../libs/dto/robot/robot.update';
import { RobotStatus } from '../../libs/enums/robot.enum';

@Injectable()
export class RobotService {
	constructor(@InjectModel('Robot') private readonly robotModel: Model<Robot>) {}

	public async createRobot(input: CreateRobotInput): Promise<Robot> {
		try {
			const payload: T = { ...input };
			if (input.currentRequestId) {
				payload.currentRequestId = shapeIntoMongoObjectId(input.currentRequestId);
			}
			if (!payload.currentPose) {
				payload.currentPose = { floorId: 'floor_1', x: 0, y: 0, theta: 0 };
			}
			return await this.robotModel.create(payload);
		} catch (err) {
			// err can be unknown, ensure we safely access message
			const message = err instanceof Error ? err.message : String(err);
			console.log('Error, Service.model:', message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getRobotByRobotId(robotId: string): Promise<Robot> {
		const result: Robot = await this.robotModel.findOne({ robotId }).exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result;
	}

	public async getRobots(input: RobotsInquiry): Promise<Robots> {
		const match: T = {};
		const sort: T = {
			[input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
		};
		this.shapeMatchQuery(match, input);

		const result = await this.robotModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length)
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async updateRobotStatus(input: UpdateRobotStatusInput): Promise<Robot> {
		const update: T = {
			status: input.status,
			lastSeenAt: input.lastSeenAt ?? new Date(),
		};
		if (typeof input.battery === 'number') update.battery = input.battery;
		if (input.currentRequestId !== undefined) {
			update.currentRequestId = input.currentRequestId
				? shapeIntoMongoObjectId(input.currentRequestId)
				: null;
		}
		if (
			input.status !== RobotStatus.OFFLINE &&
			input.status !== RobotStatus.ERROR &&
			input.status !== RobotStatus.MAINTENANCE
		) {
			update.isOnline = true;
		}

		const result: Robot = await this.robotModel
			.findOneAndUpdate({ robotId: input.robotId }, update, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async updateRobotPose(input: UpdateRobotPoseInput): Promise<Robot> {
		const update: T = {
			lastSeenAt: input.lastSeenAt ?? new Date(),
		};
		if (typeof input.battery === 'number') update.battery = input.battery;
		if (input.currentPose?.floorId !== undefined) {
			update['currentPose.floorId'] = input.currentPose.floorId;
		}
		if (typeof input.currentPose?.x === 'number') {
			update['currentPose.x'] = input.currentPose.x;
		}
		if (typeof input.currentPose?.y === 'number') {
			update['currentPose.y'] = input.currentPose.y;
		}
		if (typeof input.currentPose?.theta === 'number') {
			update['currentPose.theta'] = input.currentPose.theta;
		}

		const result: Robot = await this.robotModel
			.findOneAndUpdate({ robotId: input.robotId }, update, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async updateRobotOnlineState(
		input: UpdateRobotOnlineStateInput,
	): Promise<Robot> {
		const update: T = {
			isOnline: input.isOnline,
			lastSeenAt: input.lastSeenAt ?? new Date(),
		};
		if (!input.isOnline) update.status = RobotStatus.OFFLINE;

		const result: Robot = await this.robotModel
			.findOneAndUpdate({ robotId: input.robotId }, update, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	private shapeMatchQuery(match: T, input: RobotsInquiry): void {
		if (!input.search || Object.keys(input.search).length === 0) return;

		const { robotId, name, status, isOnline, batteryMin, batteryMax } =
			input.search;

		if (robotId) match.robotId = { $regex: new RegExp(robotId, 'i') };
		if (name) match.name = { $regex: new RegExp(name, 'i') };
		if (status) match.status = status;
		if (typeof isOnline === 'boolean') match.isOnline = isOnline;

		if (typeof batteryMin === 'number' || typeof batteryMax === 'number') {
			match.battery = {};
			if (typeof batteryMin === 'number') match.battery.$gte = batteryMin;
			if (typeof batteryMax === 'number') match.battery.$lte = batteryMax;
		}
	}
}
