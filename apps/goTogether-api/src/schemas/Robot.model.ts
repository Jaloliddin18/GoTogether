import { Schema } from 'mongoose';
import { RobotStatus } from '../libs/enums/robot.enum';

const RobotSchema = new Schema(
	{
		robotId: {
			type: String,
			required: true,
			index: { unique: true, sparse: true },
		},
		name: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			enum: RobotStatus,
			default: RobotStatus.OFFLINE,
		},
		battery: {
			type: Number,
			default: 0,
		},
		isOnline: {
			type: Boolean,
			default: false,
		},
		lastSeenAt: {
			type: Date,
		},
		currentRequestId: {
			type: Schema.Types.ObjectId,
		},
		currentPose: {
			floorId: { type: String, required: true, default: 'floor_1' },
			x: { type: Number, required: true, default: 0 },
			y: { type: Number, required: true, default: 0 },
			theta: { type: Number, required: true, default: 0 },
		},
	},
	{ timestamps: true, collection: 'robots' },
);

RobotSchema.index({ status: 1, isOnline: 1 });

export default RobotSchema;
