import { Schema } from 'mongoose';
import { BookStatus } from '../libs/enums/book.enum';

const BookSchema = new Schema(
	{
		title: {
			type: String,
			required: true,
		},
		author: {
			type: String,
			required: true,
		},
		isbn: {
			type: String,
			required: true,
			index: { unique: true, sparse: true },
		},
		callNumber: {
			type: String,
			required: true,
		},
		category: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			default: '',
		},
		available: {
			type: Boolean,
			default: true,
		},
		bookStatus: {
			type: String,
			enum: BookStatus,
			default: BookStatus.AVAILABLE,
		},
		shelf: {
			section: { type: String, required: true },
			row: { type: String, required: true },
			level: { type: String, required: true },
		},
		location: {
			floorId: { type: String, required: true },
			x: { type: Number, required: true },
			y: { type: Number, required: true },
			theta: { type: Number, required: true },
		},
		pickup: {
			mastHeightCm: { type: Number, required: true },
			forkDepthCm: { type: Number, required: true },
		},
	},
	{ timestamps: true, collection: 'books' },
);

BookSchema.index({ title: 1, author: 1, callNumber: 1, category: 1 });

export default BookSchema;
