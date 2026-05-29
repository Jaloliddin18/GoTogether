import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import LostItemSchema from '../../schemas/LostItem.model';
import { LostItemResolver } from './lost-item.resolver';
import { LostItemService } from './lost-item.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'LostItem', schema: LostItemSchema }]),
		AuthModule,
	],
	providers: [LostItemResolver, LostItemService],
	exports: [LostItemService],
})
export class LostItemModule {}
