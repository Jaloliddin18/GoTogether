import { registerEnumType } from '@nestjs/graphql';

export enum RobotStatus {
	OFFLINE = 'OFFLINE',
	IDLE = 'IDLE',
	ASSIGNED = 'ASSIGNED',
	NAVIGATING = 'NAVIGATING',
	VERIFYING_BOOK = 'VERIFYING_BOOK',
	PICKING_UP = 'PICKING_UP',
	DELIVERING = 'DELIVERING',
	RETURNING = 'RETURNING',
	DOCKING = 'DOCKING',
	ERROR = 'ERROR',
	MAINTENANCE = 'MAINTENANCE',
}

registerEnumType(RobotStatus, { name: 'RobotStatus' });
