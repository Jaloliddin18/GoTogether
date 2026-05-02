import { registerEnumType } from '@nestjs/graphql';

export enum RequestType {
	BORROW = 'BORROW',
	PURCHASE = 'PURCHASE',
}

registerEnumType(RequestType, { name: 'RequestType' });

export enum DeliveryDestinationType {
	STUDENT_DESK = 'STUDENT_DESK',
	RECEPTION = 'RECEPTION',
}

registerEnumType(DeliveryDestinationType, {
	name: 'DeliveryDestinationType',
});

export enum PaymentStatus {
	NOT_REQUIRED = 'NOT_REQUIRED',
	PAY_AT_RECEPTION = 'PAY_AT_RECEPTION',
	PAID = 'PAID',
	CANCELLED = 'CANCELLED',
	REFUNDED = 'REFUNDED',
}

registerEnumType(PaymentStatus, { name: 'PaymentStatus' });

export enum RequestStatus {
	QUEUED = 'QUEUED',
	ASSIGNED = 'ASSIGNED',
	DISPATCHED = 'DISPATCHED',
	NAVIGATING_TO_SHELF = 'NAVIGATING_TO_SHELF',
	ARRIVED_AT_SHELF = 'ARRIVED_AT_SHELF',
	VERIFYING_BOOK = 'VERIFYING_BOOK',
	BOOK_FOUND = 'BOOK_FOUND',
	BOOK_NOT_FOUND = 'BOOK_NOT_FOUND',
	PICKING_UP = 'PICKING_UP',
	DELIVERING = 'DELIVERING',
	ARRIVED_AT_STUDENT = 'ARRIVED_AT_STUDENT',
	READY = 'READY',
	COMPLETED = 'COMPLETED',
	FAILED = 'FAILED',
	CANCELLED = 'CANCELLED',
}

registerEnumType(RequestStatus, { name: 'RequestStatus' });

export enum RequestErrorCode {
	BOOK_UNAVAILABLE = 'BOOK_UNAVAILABLE',
	NO_ROBOT_AVAILABLE = 'NO_ROBOT_AVAILABLE',
	INVALID_DESTINATION = 'INVALID_DESTINATION',
	ROBOT_OFFLINE = 'ROBOT_OFFLINE',
	NAVIGATION_FAILED = 'NAVIGATION_FAILED',
	PICKUP_FAILED = 'PICKUP_FAILED',
	BOOK_NOT_FOUND = 'BOOK_NOT_FOUND',
	USER_CANCELLED = 'USER_CANCELLED',
	INTERNAL_ERROR = 'INTERNAL_ERROR',
}

registerEnumType(RequestErrorCode, { name: 'RequestErrorCode' });
