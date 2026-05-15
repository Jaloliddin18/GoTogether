import { registerEnumType } from '@nestjs/graphql';

export enum ViewGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	BOOK = 'BOOK',
	TWIT = 'TWIT',
}
registerEnumType(ViewGroup, {
	name: 'ViewGroup',
});
