import { registerEnumType } from '@nestjs/graphql';

export enum LikeGroup {
	MEMBER = 'MEMBER',
	BOOK = 'BOOK',
	ARTICLE = 'ARTICLE',
	TWIT = 'TWIT',
}
registerEnumType(LikeGroup, {
	name: 'LikeGroup',
});
