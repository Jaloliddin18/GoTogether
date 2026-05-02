import { registerEnumType } from '@nestjs/graphql';

export enum ViewGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	BOOK = 'BOOK',
}
registerEnumType(ViewGroup, {
	name: 'ViewGroup',
});
