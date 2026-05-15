import { Schema } from 'mongoose';

const TwitSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
			index: true,
		},

		text: {
			type: String,
			required: true,
			maxlength: 280,
		},

		images: {
			type: [String],
			default: [],
		},

		likeCount: {
			type: Number,
			default: 0,
		},

		viewCount: {
			type: Number,
			default: 0,
		},

		deletedAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true, collection: 'twits' },
);

TwitSchema.index({ memberId: 1, createdAt: -1 });
TwitSchema.index({ createdAt: -1 });
TwitSchema.index({ deletedAt: 1 });

export default TwitSchema;
