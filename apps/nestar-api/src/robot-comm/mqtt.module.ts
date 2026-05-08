import { Global, Module } from '@nestjs/common';
import { MqttRobotService } from './mqtt.service';

@Global()
@Module({
	providers: [MqttRobotService],
	exports: [MqttRobotService],
})
export class MqttRobotModule {}
