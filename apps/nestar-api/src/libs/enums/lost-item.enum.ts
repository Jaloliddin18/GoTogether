import { registerEnumType } from '@nestjs/graphql';

export enum LostItemEventType {
	LOST_ITEM_DETECTED = 'LOST_ITEM_DETECTED',
}

registerEnumType(LostItemEventType, { name: 'LostItemEventType' });

export enum LostItemObjectType {
	ID_CARD = 'ID_CARD',
	BOTTLE = 'BOTTLE',
	WALLET = 'WALLET',
	PHONE = 'PHONE',
	BOOK = 'BOOK',
	UNKNOWN = 'UNKNOWN',
}

registerEnumType(LostItemObjectType, { name: 'LostItemObjectType' });

export enum LostItemPriority {
	HIGH = 'HIGH',
	MEDIUM = 'MEDIUM',
	LOW = 'LOW',
}

registerEnumType(LostItemPriority, { name: 'LostItemPriority' });

export enum LostItemStatus {
	PENDING_REVIEW = 'PENDING_REVIEW',
	COLLECTED = 'COLLECTED',
	DISMISSED = 'DISMISSED',
}

registerEnumType(LostItemStatus, { name: 'LostItemStatus' });
