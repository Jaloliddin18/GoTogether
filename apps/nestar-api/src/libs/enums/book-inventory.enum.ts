import { registerEnumType } from '@nestjs/graphql';

export enum BookInventoryType {
	LIBRARY = 'LIBRARY',
	COMMERCIAL = 'COMMERCIAL',
}

registerEnumType(BookInventoryType, {
	name: 'BookInventoryType',
});

export enum BookStorageZone {
	LIBRARY_SHELF = 'LIBRARY_SHELF',
	COMMERCIAL_WAREHOUSE = 'COMMERCIAL_WAREHOUSE',
}

registerEnumType(BookStorageZone, {
	name: 'BookStorageZone',
});

export enum BookInventoryStatus {
	AVAILABLE = 'AVAILABLE',
	RESERVED = 'RESERVED',
	BORROWED = 'BORROWED',
	IN_DELIVERY = 'IN_DELIVERY',
	MISSING = 'MISSING',
}

registerEnumType(BookInventoryStatus, {
	name: 'BookInventoryStatus',
});
