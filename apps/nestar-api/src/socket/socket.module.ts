import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../components/auth/auth.module';
import { RobotGateway } from './robot.gateway';

@Module({
	imports: [AuthModule],
	providers: [SocketGateway, RobotGateway],
	exports: [RobotGateway],
})
export class SocketModule {}
