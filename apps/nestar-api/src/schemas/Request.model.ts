import { Schema } from 'mongoose';
import { RequestErrorCode, RequestStatus } from '../libs/enums/request.enum';

const RequestSchema = new Schema(
	{
		bookId: {
			type: Schema.Types.ObjectId,
			required: true,
		},
		robotId: {
			type: Schema.Types.ObjectId,
		},
		memberId: {
			type: Schema.Types.ObjectId,
		},
		sessionId: {
			type: String,
		},
		destinationDeskId: {
			type: String,
			required: true,
		},
		destination: {
			floorId: { type: String, required: true },
			x: { type: Number, required: true },
			y: { type: Number, required: true },
			theta: { type: Number, required: true },
		},
		status: {
			type: String,
			enum: RequestStatus,
			default: RequestStatus.QUEUED,
		},
		timeline: [
			{
				status: {
					type: String,
					enum: RequestStatus,
					required: true,
				},
				message: { type: String, default: '' },
				timestamp: { type: Date, default: Date.now },
			},
		],
		error: {
			code: { type: String, enum: RequestErrorCode },
			message: { type: String },
			timestamp: { type: Date },
		},
	},
	{ timestamps: true, collection: 'requests' },
);

RequestSchema.index({ status: 1, createdAt: -1 });
RequestSchema.index({ memberId: 1, createdAt: -1 });
RequestSchema.index({ sessionId: 1, createdAt: -1 });
RequestSchema.index({ robotId: 1, createdAt: -1 });
RequestSchema.index({ bookId: 1, createdAt: -1 });

export default RequestSchema;
