import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LostItemModule } from '../components/lost-item/lost-item.module';
import BookInventorySchema from '../schemas/BookInventory.model';
import RequestSchema from '../schemas/Request.model';
import RobotSchema from '../schemas/Robot.model';
import { SocketModule } from '../socket/socket.module';
import { MqttRobotService } from './mqtt.service';

@Global()
@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Robot', schema: RobotSchema }]),
		MongooseModule.forFeature([{ name: 'Request', schema: RequestSchema }]),
		MongooseModule.forFeature([
			{ name: 'BookInventory', schema: BookInventorySchema },
		]),
		SocketModule,
		LostItemModule,
	],
	providers: [MqttRobotService],
	exports: [MqttRobotService],
})
export class MqttRobotModule {}
