import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../../libs/dto/member/member';

const counterFields = [
	'memberBooks',
	'memberTwits',
	'memberFollowers',
	'memberFollowings',
	'memberPoints',
	'memberLikes',
	'memberViews',
	'memberComments',
	'memberRank',
	'memberWarnings',
	'memberBlocks',
] as const;

const numericMongoTypes = ['int', 'long', 'double', 'decimal'];

@Injectable()
export class MemberHealthCheckService implements OnModuleInit {
	private readonly logger = new Logger(MemberHealthCheckService.name);

	constructor(@InjectModel('Member') private readonly memberModel: Model<Member>) {}

	async onModuleInit(): Promise<void> {
		try {
			const invalidFieldUnionExpr = counterFields.map((field) => ({
				$cond: [
					{ $in: [{ $type: `$${field}` }, numericMongoTypes] },
					[],
					[field],
				],
			}));

			const pipeline = [
				{
					$project: {
						memberNick: 1,
						invalidFields: { $setUnion: invalidFieldUnionExpr },
					},
				},
				{
					$match: {
						$expr: { $gt: [{ $size: '$invalidFields' }, 0] },
					},
				},
			];

			const malformedCountRows = await this.memberModel
				.aggregate([...pipeline, { $count: 'total' }])
				.exec();
			const malformedCount = malformedCountRows[0]?.total ?? 0;

			if (!malformedCount) {
				this.logger.log(
					`Member counter startup health check passed. fields=${counterFields.join(', ')}`,
				);
				return;
			}

			const samples = await this.memberModel
				.aggregate([
					...pipeline,
					{ $project: { _id: 1, memberNick: 1, invalidFields: 1 } },
					{ $limit: 10 },
				])
				.exec();

			this.logger.warn(
				`Member counter startup health check found malformed docs: count=${malformedCount}, sampleLimit=10`,
			);
			this.logger.warn(
				`Malformed member samples: ${JSON.stringify(samples)}`,
			);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			this.logger.error(`Member counter startup health check failed: ${msg}`);
		}
	}
}
