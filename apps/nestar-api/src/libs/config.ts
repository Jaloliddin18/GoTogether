import { ObjectId } from 'bson';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { T } from './types/common';
import { pipeline } from 'stream';

export const availableMemberSort = [
	'createdAt',
	'updatedAt',
	'memberLikes',
	'memberViews',
];

export const availableBookSorts = [
	'createdAt',
	'updatedAt',
	'bookTitle',
	'bookRank',
	'bookViews',
	'bookLikes',
	'bookPrice.amount',
	'bookRating.average',
	'bookPublishedYear',
	'bookAuthor',
	'bookIsbn',
	'bookCallNumber',
	'bookCategory',
	'bookStatus',
];

export const availableBookInventorySorts = [
	'createdAt',
	'updatedAt',
	'bookInventoryStatus',
	'bookInventoryType',
	'bookStorageZone',
	'bookTotalQuantity',
	'bookSoldQuantity',
];

export const availableRobotSorts = [
	'createdAt',
	'updatedAt',
	'robotId',
	'name',
	'status',
	'battery',
	'isOnline',
	'lastSeenAt',
];

export const availableRequestSorts = [
	'createdAt',
	'updatedAt',
	'status',
	'destinationDeskId',
	'requestType',
	'destinationType',
	'paymentStatus',
];

export const availableLostItemSorts = [
	'detectedAt',
	'createdAt',
	'updatedAt',
	'robotId',
	'objectType',
	'priority',
	'status',
	'confidence',
];

export const REQUEST_RECEPTION_DESTINATION = {
	floorId: 'demo_floor',
	x: 0.5,
	y: 0.2,
	theta: 3.14,
};

export const availableCommentSorts = ['createdAt', 'updatedAt'];
export const availableTwitSorts = [
	'createdAt',
	'updatedAt',
	'likeCount',
];
export const availableTwitCommentSorts = [
	'createdAt',
	'updatedAt',
	'likeCount',
	'depth',
];

// IMAGE CONFIGURATION

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];
export const getSerialForImage = (filename: string) => {
	const ext = path.parse(filename).ext;
	return uuidv4() + ext;
};

export const shapeIntoMongoObjectId = (target: any) => {
	return typeof target === 'string' ? new ObjectId(target) : target;
};

export const lookupAuthMemberLiked = (
	memberId: T,
	targetRefId: string = '$_id',
) => {
	return {
		$lookup: {
			from: 'likes',
			let: {
				localLikeRefId: targetRefId,
				localMemberId: memberId,
				localMyFavorite: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{ $eq: ['$likeRefId', '$$localLikeRefId'] },
								{ $eq: ['$memberId', '$$localMemberId'] },
							],
						},
					},
				},
				{
					$project: {
						_id: 0,
						memberId: 1,
						likeRefId: 1,
						myFavorite: '$$localMyFavorite',
					},
				},
			],
			as: 'meLiked',
		},
	};
};

interface LookupAuthMemberFollowed {
	followerId: T;
	followingId: string;
}
export const lookupAuthMemberFollowed = (input: LookupAuthMemberFollowed) => {
	const { followerId, followingId } = input;
	return {
		$lookup: {
			from: 'follows',
			let: {
				localFollowerId: followerId,
				localFollowingId: followingId,
				localMyFavorite: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{ $eq: ['$followerId', '$$localFollowerId'] },
								{ $eq: ['$followingId', '$$localFollowingId'] },
							],
						},
					},
				},
				{
					$project: {
						_id: 0,
						followerId: 1,
						followingId: 1,
						myFollowing: '$$localMyFavorite',
					},
				},
			],
			as: 'meFollowed',
		},
	};
};

export const lookupMember = {
	$lookup: {
		from: 'members',
		let: { localMemberId: '$memberId' },
		pipeline: [
			{
				$match: {
					$expr: { $eq: ['$_id', '$$localMemberId'] },
				},
			},
			{
				$addFields: {
					memberBooks: { $ifNull: ['$memberBooks', 0] },
				},
			},
		],
		as: 'memberData',
	},
};

export const lookupFollowingData = {
	$lookup: {
		from: 'members',
		let: { localFollowingId: '$followingId' },
		pipeline: [
			{
				$match: {
					$expr: { $eq: ['$_id', '$$localFollowingId'] },
				},
			},
			{
				$addFields: {
					memberBooks: { $ifNull: ['$memberBooks', 0] },
				},
			},
		],
		as: 'followingData',
	},
};

export const lookupFollowerData = {
	$lookup: {
		from: 'members',
		let: { localFollowerId: '$followerId' },
		pipeline: [
			{
				$match: {
					$expr: { $eq: ['$_id', '$$localFollowerId'] },
				},
			},
			{
				$addFields: {
					memberBooks: { $ifNull: ['$memberBooks', 0] },
				},
			},
		],
		as: 'followerData',
	},
};
