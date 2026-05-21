import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import BookSchema from '../../schemas/Book.model';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
	imports: [
		HttpModule,
		MongooseModule.forFeature([{ name: 'Book', schema: BookSchema }]),
	],
	controllers: [ChatController],
	providers: [ChatService],
})
export class ChatModule {}
