import { Schema } from 'mongoose';
import {
	LostItemEventType,
	LostItemObjectType,
	LostItemPriority,
	LostItemStatus,
} from '../libs/enums/lost-item.enum';

const LostItemSchema = new Schema(
	{
		robotId: {
			type: String,
			required: true,
		},
		eventType: {
			type: String,
			enum: LostItemEventType,
			default: LostItemEventType.LOST_ITEM_DETECTED,
			required: true,
		},
		objectType: {
			type: String,
			enum: LostItemObjectType,
			required: true,
		},
		confidence: {
			type: Number,
			required: true,
		},
		priority: {
			type: String,
			enum: LostItemPriority,
			required: true,
		},
		detectedAt: {
			type: Date,
			required: true,
		},
		snapshotPath: {
			type: String,
		},
		snapshotUrl: {
			type: String,
		},
		location: {
			source: { type: String },
			floorId: { type: String },
			x: { type: Number },
			y: { type: Number },
			patrolCheckpoint: { type: String },
		},
		status: {
			type: String,
			enum: LostItemStatus,
			default: LostItemStatus.PENDING_REVIEW,
		},
		notes: {
			type: String,
		},
	},
	{ timestamps: true, collection: 'lostItems' },
);

LostItemSchema.index({ detectedAt: -1 });
LostItemSchema.index({ status: 1, detectedAt: -1 });
LostItemSchema.index({ robotId: 1, detectedAt: -1 });
LostItemSchema.index({ objectType: 1, priority: 1, detectedAt: -1 });

export default LostItemSchema;
