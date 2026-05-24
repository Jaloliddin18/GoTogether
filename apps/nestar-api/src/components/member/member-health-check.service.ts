import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { MemberType } from '../../libs/enums/member.enum';

const counterFields = [
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

			const memberBooksPolicyCountRows = await this.memberModel
				.aggregate([
					{
						$project: {
							memberNick: 1,
							memberType: 1,
							memberBooksType: { $type: '$memberBooks' },
						},
					},
					{
						$match: {
							$or: [
								{
									$and: [
										{ memberType: MemberType.ADMIN },
										{ memberBooksType: { $nin: numericMongoTypes } },
									],
								},
								{
									$and: [
										{ memberType: { $ne: MemberType.ADMIN } },
										{ memberBooksType: { $ne: 'missing' } },
									],
								},
							],
						},
					},
					{ $count: 'total' },
				])
				.exec();
			const memberBooksPolicyCount = memberBooksPolicyCountRows[0]?.total ?? 0;

			if (!malformedCount && !memberBooksPolicyCount) {
				this.logger.log(
					`Member counter startup health check passed. fields=${counterFields.join(', ')}, memberBooksPolicy=admin-only`,
				);
				return;
			}

			if (malformedCount) {
				const malformedSamples = await this.memberModel
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
					`Malformed member samples: ${JSON.stringify(malformedSamples)}`,
				);
			}

			if (memberBooksPolicyCount) {
				const memberBooksPolicySamples = await this.memberModel
					.aggregate([
						{
							$project: {
								_id: 1,
								memberNick: 1,
								memberType: 1,
								memberBooks: 1,
								memberBooksType: { $type: '$memberBooks' },
							},
						},
						{
							$match: {
								$or: [
									{
										$and: [
											{ memberType: MemberType.ADMIN },
											{ memberBooksType: { $nin: numericMongoTypes } },
										],
									},
									{
										$and: [
											{ memberType: { $ne: MemberType.ADMIN } },
											{ memberBooksType: { $ne: 'missing' } },
										],
									},
								],
							},
						},
						{ $limit: 10 },
					])
					.exec();
				this.logger.warn(
					`MemberBooks policy check failed: count=${memberBooksPolicyCount}, policy=admin-only, sampleLimit=10`,
				);
				this.logger.warn(
					`MemberBooks policy violation samples: ${JSON.stringify(memberBooksPolicySamples)}`,
				);
			}
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			this.logger.error(`Member counter startup health check failed: ${msg}`);
		}
	}
}
