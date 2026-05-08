import { Schema, Types } from 'mongoose';
import {
	BookInventoryStatus,
	BookInventoryType,
	BookStorageZone,
} from '../libs/enums/book-inventory.enum';

const BookInventorySchema = new Schema(
	{
		bookId: {
			type: Types.ObjectId,
			required: true,
			ref: 'Book',
			index: true,
		},

		bookInventoryType: {
			type: String,
			enum: BookInventoryType,
			required: true,
			index: true,
		},

		bookStorageZone: {
			type: String,
			enum: BookStorageZone,
			required: true,
			index: true,
		},

		bookInventoryStatus: {
			type: String,
			enum: BookInventoryStatus,
			default: BookInventoryStatus.AVAILABLE,
			index: true,
		},

		bookTotalQuantity: {
			type: Number,
			default: 1,
		},

		bookSoldQuantity: {
			type: Number,
			default: 0,
		},

		bookReservedQuantity: {
			type: Number,
			default: 0,
		},

		bookBorrowedQuantity: {
			type: Number,
			default: 0,
		},

		bookShelf: {
			section: {
				type: String,
				required: true,
			},
			row: {
				type: String,
				required: true,
			},
			level: {
				type: String,
				required: true,
			},
			slot: {
				type: String,
				default: '',
			},
		},

		bookLocation: {
			floorId: {
				type: String,
				required: true,
			},
			x: {
				type: Number,
				required: true,
			},
			y: {
				type: Number,
				required: true,
			},
			theta: {
				type: Number,
				required: true,
			},
		},

		bookPickup: {
			gripperOpenWidthCm: {
				type: Number,
				required: true,
			},
			gripperCloseWidthCm: {
				type: Number,
				required: true,
			},
			gripHoldSeconds: {
				type: Number,
				default: 1,
			},
			pickupDirection: {
				type: String,
				default: 'FRONT',
			},
		},

		deletedAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
		collection: 'bookInventories',
	},
);

BookInventorySchema.index({
	bookId: 1,
	bookInventoryType: 1,
	bookStorageZone: 1,
	bookInventoryStatus: 1,
});

BookInventorySchema.index({
	'bookLocation.floorId': 1,
	'bookLocation.x': 1,
	'bookLocation.y': 1,
});

export default BookInventorySchema;
