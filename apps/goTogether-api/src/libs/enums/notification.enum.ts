import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
	LIKE = 'LIKE',
	COMMENT = 'COMMENT',
}
registerEnumType(NotificationType, {
	name: 'NotificationType',
});

export enum NotificationStatus {
	WAIT = 'WAIT',
	READ = 'READ',
}
registerEnumType(NotificationStatus, {
	name: 'NotificationStatus',
});

export enum NotificationGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	BOOK = 'BOOK',
}
registerEnumType(NotificationGroup, {
	name: 'NotificationGroup',
});
