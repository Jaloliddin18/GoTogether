import { registerEnumType } from '@nestjs/graphql';

export enum BookStatus {
	AVAILABLE = 'AVAILABLE',
	RESERVED = 'RESERVED',
	IN_DELIVERY = 'IN_DELIVERY',
	BORROWED = 'BORROWED',
	MISSING = 'MISSING',
}

registerEnumType(BookStatus, { name: 'BookStatus' });
