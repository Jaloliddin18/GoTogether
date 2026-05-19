import { Logger } from '@nestjs/common';
import {
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'ws';
import * as WebSocket from 'ws';

interface JoinRequestPayload {
	requestId: string;
}

@WebSocketGateway(3009, { transports: ['websocket'], cors: { origin: '*' }, secure: false })
export class RobotGateway implements OnGatewayInit {
	private readonly logger: Logger = new Logger('RobotGateway');
	private readonly requestClients: Map<string, Set<WebSocket>> = new Map<
		string,
		Set<WebSocket>
	>();
	private readonly clientIds: WeakMap<WebSocket, string> = new WeakMap<
		WebSocket,
		string
	>();
	private clientSeq: number = 0;

	@WebSocketServer()
	server: Server;

	public afterInit(server: Server): void {
		this.logger.verbose('Robot WebSocket Gateway Initialized');
		this.logger.verbose(`Robot WebSocket server ready: ${Boolean(server)}`);
	}

	public getServer(): any | null {
		if (!this.server) return null;
		return {
			to: (room: string) => ({
				emit: (event: string, payload: object) => {
					this.emitToRoom(room, event, payload);
				},
			}),
		};
	}

	public handleConnection(client: WebSocket): void {
		this.logger.verbose(`Robot gateway connection: ${this.getClientId(client)}`);
	}

	public handleDisconnect(client: WebSocket): void {
		const clientId = this.getClientId(client);
		this.removeClientFromRooms(client);
		this.logger.verbose(`Robot gateway disconnection: ${clientId}`);
	}

	@SubscribeMessage('joinRequest')
	public handleJoinRequest(client: WebSocket, payload: JoinRequestPayload): void {
		const requestId: string = this.extractRequestId(payload);
		if (!requestId) {
			const clientId = this.getClientId(client);
			this.logger.warn(`Invalid joinRequest payload from client ${clientId}`);
			this.sendToClient(client, 'error', { message: 'requestId is required' });
			return;
		}

		const room: string = this.getRequestRoom(requestId);
		this.addClientToRoom(client, room);
		this.logger.log(`Client ${this.getClientId(client)} joined room ${room}`);
		this.sendToClient(client, 'joined', { requestId });
	}

	public emitRobotPosition(requestId: string, payload: object): void {
		this.emitToRequestRoom(requestId, 'robotPosition', payload);
	}

	public emitRobotStatus(requestId: string, payload: object): void {
		this.emitToRequestRoom(requestId, 'robotStatus', payload);
	}

	public emitRequestUpdated(requestId: string, payload: object): void {
		this.emitToRequestRoom(requestId, 'requestUpdated', payload);
	}

	public emitRobotOffline(requestId: string, payload: object): void {
		this.emitToRequestRoom(requestId, 'robotOffline', payload);
	}

	public emitBookNotFound(requestId: string, payload: object): void {
		this.emitToRequestRoom(requestId, 'bookNotFound', payload);
	}

	public emitDeliveryReady(requestId: string, payload: object): void {
		this.emitToRequestRoom(requestId, 'deliveryReady', payload);
	}

	private extractRequestId(payload: JoinRequestPayload | string): string {
		if (typeof payload === 'string') {
			try {
				const parsed = JSON.parse(payload) as JoinRequestPayload;
				return parsed?.requestId?.trim?.() ?? '';
			} catch {
				return '';
			}
		}
		return payload?.requestId?.trim?.() ?? '';
	}

	private getRequestRoom(requestId: string): string {
		return `request:${requestId}`;
	}

	private addClientToRoom(client: WebSocket, room: string): void {
		const clients = this.requestClients.get(room) ?? new Set<WebSocket>();
		clients.add(client);
		this.requestClients.set(room, clients);
	}

	private removeClientFromRooms(client: WebSocket): void {
		for (const [room, clients] of this.requestClients.entries()) {
			if (clients.has(client)) {
				clients.delete(client);
				if (!clients.size) this.requestClients.delete(room);
			}
		}
	}

	private emitToRequestRoom(
		requestId: string,
		event: string,
		payload: object,
	): void {
		const room = this.getRequestRoom(requestId);
		this.emitToRoom(room, event, payload);
	}

	private emitToRoom(room: string, event: string, payload: object): void {
		const clients = this.requestClients.get(room);
		if (!clients || !clients.size) return;

		for (const client of clients) {
			this.sendToClient(client, event, payload);
		}
	}

	private sendToClient(client: WebSocket, event: string, payload: object): void {
		if (client.readyState !== WebSocket.OPEN) return;

		client.send(
			JSON.stringify({
				event,
				data: payload,
			}),
		);
	}

	private getClientId(client: WebSocket): string {
		const existingId = this.clientIds.get(client);
		if (existingId) return existingId;

		this.clientSeq += 1;
		const generatedId = `ws-${this.clientSeq}`;
		this.clientIds.set(client, generatedId);
		return generatedId;
	}
}
