import 'dotenv/config';
import mongoose from 'mongoose';
import { MemberType } from '../libs/enums/member.enum';

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

async function main(): Promise<void> {
	const dbUri =
		process.env.NODE_ENV === 'production'
			? process.env.MONGO_PROD
			: process.env.MONGO_DEV;

	if (!dbUri) {
		throw new Error('Mongo URI is missing. Check MONGO_DEV / MONGO_PROD.');
	}

	await mongoose.connect(dbUri);
	const members = mongoose.connection.collection('members');

	const updateSet = Object.fromEntries(
		counterFields.map((field) => [
			field,
			{
				$cond: [
					{ $in: [{ $type: `$${field}` }, numericMongoTypes] },
					`$${field}`,
					0,
				],
			},
		]),
	);

	const result = await members.updateMany({}, [{ $set: updateSet }]);
	console.log(
		`member counter backfill done (general counters): matched=${result.matchedCount}, modified=${result.modifiedCount}`,
	);

	const adminMemberBooksResult = await members.updateMany(
		{ memberType: MemberType.ADMIN },
		[
			{
				$set: {
					memberBooks: {
						$cond: [
							{ $in: [{ $type: '$memberBooks' }, numericMongoTypes] },
							'$memberBooks',
							0,
						],
					},
				},
			},
		],
	);
	console.log(
		`memberBooks admin-only normalize done: matched=${adminMemberBooksResult.matchedCount}, modified=${adminMemberBooksResult.modifiedCount}`,
	);

	const unsetNonAdminMemberBooksResult = await members.updateMany(
		{ memberType: { $ne: MemberType.ADMIN } },
		{ $unset: { memberBooks: '' } },
	);
	console.log(
		`memberBooks removed for non-admins: matched=${unsetNonAdminMemberBooksResult.matchedCount}, modified=${unsetNonAdminMemberBooksResult.modifiedCount}`,
	);

	await mongoose.disconnect();
}

main().catch(async (err) => {
	console.error('member counter backfill failed:', err);
	await mongoose.disconnect();
	process.exit(1);
});
