import 'dotenv/config';
import mongoose from 'mongoose';

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
		`member counter backfill done: matched=${result.matchedCount}, modified=${result.modifiedCount}`,
	);

	await mongoose.disconnect();
}

main().catch(async (err) => {
	console.error('member counter backfill failed:', err);
	await mongoose.disconnect();
	process.exit(1);
});
