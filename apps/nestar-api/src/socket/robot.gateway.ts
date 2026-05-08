import { Logger } from '@nestjs/common';
import {
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface JoinRequestPayload {
	requestId: string;
}

@WebSocketGateway({ transports: ['websocket'], secure: false })
export class RobotGateway implements OnGatewayInit {
	private readonly logger: Logger = new Logger('RobotGateway');

	@WebSocketServer()
	server: Server;

	public afterInit(server: Server): void {
		this.logger.verbose('Robot WebSocket Gateway Initialized');
		this.logger.verbose(`Robot WebSocket server ready: ${Boolean(server)}`);
	}

	public getServer(): Server | null {
		return this.server ?? null;
	}

	public handleConnection(client: Socket): void {
		this.logger.verbose(`Robot gateway connection: ${client.id}`);
	}

	public handleDisconnect(client: Socket): void {
		this.logger.verbose(`Robot gateway disconnection: ${client.id}`);
	}

	@SubscribeMessage('joinRequest')
	public handleJoinRequest(client: Socket, payload: JoinRequestPayload): void {
		const requestId: string = payload?.requestId?.trim?.() ?? '';
		if (!requestId) {
			this.logger.warn(`Invalid joinRequest payload from client ${client.id}`);
			client.emit('error', { event: 'error', message: 'requestId is required' });
			return;
		}

		const room: string = this.getRequestRoom(requestId);
		client.join(room);
		this.logger.log(`Client ${client.id} joined room ${room}`);
		client.emit('joined', { requestId });
	}

	public emitRobotPosition(requestId: string, payload: object): void {
		if (!this.server) {
			this.logger.warn('WebSocket server not ready, skipping emit');
			return;
		}
		this.server.to(this.getRequestRoom(requestId)).emit('robotPosition', payload);
	}

	public emitRobotStatus(requestId: string, payload: object): void {
		if (!this.server) {
			this.logger.warn('WebSocket server not ready, skipping emit');
			return;
		}
		this.server.to(this.getRequestRoom(requestId)).emit('robotStatus', payload);
	}

	public emitRequestUpdated(requestId: string, payload: object): void {
		if (!this.server) {
			this.logger.warn('WebSocket server not ready, skipping emit');
			return;
		}
		this.server.to(this.getRequestRoom(requestId)).emit('requestUpdated', payload);
	}

	public emitRobotOffline(requestId: string, payload: object): void {
		if (!this.server) {
			this.logger.warn('WebSocket server not ready, skipping emit');
			return;
		}
		this.server.to(this.getRequestRoom(requestId)).emit('robotOffline', payload);
	}

	public emitBookNotFound(requestId: string, payload: object): void {
		if (!this.server) {
			this.logger.warn('WebSocket server not ready, skipping emit');
			return;
		}
		this.server.to(this.getRequestRoom(requestId)).emit('bookNotFound', payload);
	}

	public emitDeliveryReady(requestId: string, payload: object): void {
		if (!this.server) {
			this.logger.warn('WebSocket server not ready, skipping emit');
			return;
		}
		this.server.to(this.getRequestRoom(requestId)).emit('deliveryReady', payload);
	}

	private getRequestRoom(requestId: string): string {
		return `request:${requestId}`;
	}
}
