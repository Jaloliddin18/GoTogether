import { Schema } from 'mongoose';

const TwitCommentSchema = new Schema(
	{
		twitId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Twit',
			index: true,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
			index: true,
		},

		text: {
			type: String,
			required: true,
		},

		parentCommentId: {
			type: Schema.Types.ObjectId,
			ref: 'TwitComment',
			default: null,
		},

		depth: {
			type: Number,
			default: 0,
		},

		likes: {
			type: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
			default: [],
		},

		likeCount: {
			type: Number,
			default: 0,
		},

		deletedAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true, collection: 'twitComments' },
);

TwitCommentSchema.index({ twitId: 1, createdAt: 1 });
TwitCommentSchema.index({ parentCommentId: 1, createdAt: 1 });
TwitCommentSchema.index({ memberId: 1, createdAt: -1 });
TwitCommentSchema.index({ deletedAt: 1 });

export default TwitCommentSchema;
