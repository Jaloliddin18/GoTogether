import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
	createWriteStream,
	existsSync,
	mkdirSync,
	unlinkSync,
} from 'fs';
import { FileUpload } from 'graphql-upload';
import { Model } from 'mongoose';
import * as path from 'path';
import {
	LostItem,
	LostItemSnapshotUploadResult,
	LostItems,
} from '../../libs/dto/lost-item/lost-item';
import { LostItemsInquiry } from '../../libs/dto/lost-item/lost-item.input';
import { UpdateLostItemStatusInput } from '../../libs/dto/lost-item/lost-item.update';
import { getSerialForImage, validMimeTypes } from '../../libs/config';
import { Direction, Message } from '../../libs/enums/common.enum';
import {
	LostItemEventType,
	LostItemObjectType,
	LostItemPriority,
	LostItemStatus,
} from '../../libs/enums/lost-item.enum';
import { T } from '../../libs/types/common';

export interface LostItemLocationInput {
	source?: string;
	floorId?: string;
	x?: number | null;
	y?: number | null;
	patrolCheckpoint?: string;
}

export interface CreateLostItemFromPatrolEventInput {
	robotId: string;
	eventType: LostItemEventType;
	objectType: LostItemObjectType;
	confidence: number;
	priority: LostItemPriority;
	detectedAt: Date;
	snapshotPath?: string;
	snapshotUrl?: string;
	location?: LostItemLocationInput;
	status: LostItemStatus;
	notes?: string;
}

@Injectable()
export class LostItemService {
	private readonly lostItemSnapshotMaxFileSize = 1_500_000;
	private readonly lostItemSnapshotDir = path.join(
		process.cwd(),
		'uploads',
		'lost-items',
	);

	constructor(
		@InjectModel('LostItem')
		private readonly lostItemModel: Model<LostItem>,
	) {}

	public async uploadLostItemSnapshot(
		file: FileUpload,
	): Promise<LostItemSnapshotUploadResult> {
		const { createReadStream, filename, mimetype } = file;
		if (!filename)
			throw new InternalServerErrorException(Message.UPLOAD_FAILED);
		const validMime = validMimeTypes.includes(mimetype);
		if (!validMime)
			throw new InternalServerErrorException(Message.PROVIDE_ALLOWED_FORMAT);

		this.ensureLostItemSnapshotDir();

		const imageName = getSerialForImage(filename);
		const snapshotPath = `uploads/lost-items/${imageName}`;
		const snapshotAbsolutePath = path.join(process.cwd(), snapshotPath);

		await this.streamUploadToFile(createReadStream, snapshotAbsolutePath);

		return { snapshotPath, snapshotUrl: snapshotPath };
	}

	public async createLostItemFromPatrolEvent(
		input: CreateLostItemFromPatrolEventInput,
	): Promise<LostItem> {
		const result = await this.lostItemModel.create(input);
		if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
		return result;
	}

	public async getLostItems(input: LostItemsInquiry): Promise<LostItems> {
		const match: T = {};
		const sort: T = {
			[input?.sort ?? 'detectedAt']: input?.direction ?? Direction.DESC,
		};
		this.shapeMatchQuery(match, input);

		const result = await this.lostItemModel
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

	public async updateLostItemStatus(
		input: UpdateLostItemStatusInput,
	): Promise<LostItem> {
		const result = await this.lostItemModel
			.findOneAndUpdate(
				{ _id: input.lostItemId },
				{ status: input.status },
				{ new: true },
			)
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	private shapeMatchQuery(match: T, input: LostItemsInquiry): void {
		if (!input.search || Object.keys(input.search).length === 0) return;

		const {
			status,
			objectType,
			priority,
			robotId,
			detectedAtFrom,
			detectedAtTo,
		} = input.search;

		if (status) match.status = status;
		if (objectType) match.objectType = objectType;
		if (priority) match.priority = priority;
		if (robotId) match.robotId = { $regex: new RegExp(robotId, 'i') };

		if (detectedAtFrom || detectedAtTo) {
			match.detectedAt = {};
			if (detectedAtFrom) match.detectedAt.$gte = detectedAtFrom;
			if (detectedAtTo) match.detectedAt.$lte = detectedAtTo;
		}
	}

	private ensureLostItemSnapshotDir(): void {
		if (existsSync(this.lostItemSnapshotDir)) return;
		mkdirSync(this.lostItemSnapshotDir, { recursive: true });
	}

	private async streamUploadToFile(
		createReadStream: FileUpload['createReadStream'],
		filePath: string,
	): Promise<void> {
		const stream = createReadStream();
		const writeStream = createWriteStream(filePath);
		let uploadedBytes = 0;
		let completed = false;

		await new Promise<void>((resolve, reject) => {
			const failUpload = (message: Message): void => {
				if (completed) return;
				completed = true;
				stream.destroy();
				writeStream.destroy();
				this.removePartialUploadedFile(filePath);
				reject(new InternalServerErrorException(message));
			};

			stream.on('data', (chunk: Buffer | string) => {
				uploadedBytes +=
					typeof chunk === 'string' ? Buffer.byteLength(chunk) : chunk.length;
				if (uploadedBytes > this.lostItemSnapshotMaxFileSize)
					failUpload(Message.UPLOAD_FAILED);
			});

			stream.on('error', () => failUpload(Message.UPLOAD_FAILED));
			writeStream.on('error', () => failUpload(Message.UPLOAD_FAILED));
			writeStream.on('finish', () => {
				if (completed) return;
				completed = true;
				resolve();
			});

			stream.pipe(writeStream);
		});
	}

	private removePartialUploadedFile(filePath: string): void {
		try {
			if (existsSync(filePath)) unlinkSync(filePath);
		} catch {
			/** noop */
		}
	}
}
