import { registerEnumType } from '@nestjs/graphql';

export enum TwitFeedType {
	FOR_YOU = 'FOR_YOU',
	FOLLOWING = 'FOLLOWING',
}

registerEnumType(TwitFeedType, {
	name: 'TwitFeedType',
});
