import { registerEnumType } from '@nestjs/graphql';

export enum LikeGroup {
	MEMBER = 'MEMBER',
	BOOK = 'BOOK',
	ARTICLE = 'ARTICLE',
	TWIT = 'TWIT',
	TWIT_COMMENT = 'TWIT_COMMENT',
}
registerEnumType(LikeGroup, {
	name: 'LikeGroup',
});
