import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { TwitResolver } from './twit.resolver';
import { TwitService } from './twit.service';
import TwitSchema from '../../schemas/Twit.model';
import FollowSchema from '../../schemas/Follow.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Twit', schema: TwitSchema }]),
		MongooseModule.forFeature([{ name: 'Follow', schema: FollowSchema }]),
		AuthModule,
	],
	providers: [TwitResolver, TwitService],
	exports: [TwitService],
})
export class TwitModule {}
