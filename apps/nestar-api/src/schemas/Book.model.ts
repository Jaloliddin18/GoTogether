import { Schema } from 'mongoose';
import {
	BookAudience,
	BookCategory,
	BookFormat,
	BookLanguage,
	BookStatus,
	BookType,
} from '../libs/enums/book.enum';

const BookSchema = new Schema(
	{
		bookTitle: {
			type: String,
			required: true,
		},

		bookAuthor: {
			type: String,
			required: true,
		},

		bookIsbn: {
			type: String,
			required: true,
			index: { unique: true, sparse: true },
		},
		bookCallNumber: {
			type: String, // where is book on shelf
		},

		bookImages: {
			type: [String],
			required: true,
		},

		bookType: {
			type: String,
			enum: BookType,
			required: true,
		},
		bookCategory: {
			type: String,
			enum: BookCategory,
			required: true,
		},

		bookAudience: {
			type: String,
			enum: BookAudience,
			required: true,
		},

		bookFormat: {
			type: String,
			enum: BookFormat,
			required: true,
		},

		bookLanguage: {
			type: String,
			enum: BookLanguage,
			required: true,
		},

		bookPublishedYear: {
			type: Number,
		},

		bookPages: {
			type: Number,
		},

		bookDescription: {
			type: String,
		},

		bookPrice: {
			type: {
				amount: { type: Number },
				currency: { type: String, default: 'KRW' },
				discountPercent: { type: Number },
				isDiscounted: { type: Boolean, default: false },
			},
			required: true,
		},

		bookDimensions: {
			widthCm: { type: Number, default: 0 },
			heightCm: { type: Number, default: 0 },
			weightGrams: { type: Number, default: 0 },
		},

		isBorrowable: {
			type: Boolean,
			default: true,
		},

		isPurchasable: {
			type: Boolean,
			default: true,
		},

		bookLikes: {
			type: Number,
			default: 0,
		},

		bookViews: {
			type: Number,
			default: 0,
		},

		bookComments: {
			type: Number,
			default: 0,
		},

		bookRank: {
			type: Number,
			default: 0,
		},

		bookRating: {
			average: { type: Number, default: 0 },
			count: { type: Number, default: 0 },
		},

		bookStatus: {
			type: String,
			enum: BookStatus,
			default: BookStatus.ACTIVE,
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'books' },
);

BookSchema.index({ bookTitle: 1, bookAuthor: 1, bookIsbn: 1, bookCategory: 1 });

export default BookSchema;
