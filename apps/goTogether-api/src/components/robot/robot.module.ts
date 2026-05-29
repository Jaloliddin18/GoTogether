import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { RobotResolver } from './robot.resolver';
import { RobotService } from './robot.service';
import RobotSchema from '../../schemas/Robot.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Robot', schema: RobotSchema }]),
		AuthModule,
	],
	providers: [RobotResolver, RobotService],
	exports: [RobotService],
})
export class RobotModule {}
