import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import RequestSchema from '../../schemas/Request.model';
import BookSchema from '../../schemas/Book.model';
import RobotSchema from '../../schemas/Robot.model';
import { RequestResolver } from './request.resolver';
import { RequestService } from './request.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Request', schema: RequestSchema }]),
		MongooseModule.forFeature([{ name: 'Book', schema: BookSchema }]),
		MongooseModule.forFeature([{ name: 'Robot', schema: RobotSchema }]),
		AuthModule,
	],
	providers: [RequestResolver, RequestService],
	exports: [RequestService],
})
export class RequestModule {}
