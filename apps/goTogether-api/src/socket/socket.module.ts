import { Module } from '@nestjs/common';
import { RobotGateway } from './robot.gateway';

@Module({
	providers: [RobotGateway],
	exports: [RobotGateway],
})
export class SocketModule {}
