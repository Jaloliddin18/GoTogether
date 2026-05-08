import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connect, MqttClient } from 'mqtt';
import { MqttCommandPayload, MqttPosePayload, MqttStatusPayload } from './mqtt.types';

@Injectable()
export class MqttRobotService implements OnModuleInit, OnModuleDestroy {
	private readonly logger: Logger = new Logger(MqttRobotService.name);
	private client: MqttClient | null = null;
	private readonly subscribedRobotIds: Set<string> = new Set<string>();

	onModuleInit(): void {
		const brokerUrl: string | undefined = process.env.MQTT_BROKER_URL;
		if (!brokerUrl) {
			this.logger.warn('MQTT_BROKER_URL not set — robot communication disabled');
			return;
		}

		const maskedBrokerUrl: string = this.maskBrokerUrl(brokerUrl);

		try {
			this.client = connect(brokerUrl, {
				reconnectPeriod: 5000,
				connectTimeout: 10000,
			});
		} catch (error: unknown) {
			const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
			this.logger.error(`Failed to initialize MQTT client (${maskedBrokerUrl}): ${errorMessage}`);
			return;
		}

		this.client.on('connect', () => {
			this.logger.log(`MQTT connected successfully (${maskedBrokerUrl})`);
			this.resubscribeKnownRobotTopics();
		});

		this.client.on('error', (error: Error) => {
			this.logger.error(`MQTT connection error (${maskedBrokerUrl}): ${error.message}`);
		});

		this.client.on('close', () => {
			this.logger.warn(`MQTT connection closed (${maskedBrokerUrl})`);
		});

		this.client.on('offline', () => {
			this.logger.warn(`MQTT client went offline (${maskedBrokerUrl})`);
		});

		this.client.on('message', (topic: string, message: Buffer) => {
			this.handleIncomingMessage(topic, message.toString());
		});
	}

	onModuleDestroy(): void {
		if (!this.client) return;

		this.client.end(false, {}, () => {
			this.logger.log('MQTT client disconnected gracefully');
		});
		this.client = null;
	}

	publishCommand(robotId: string, payload: MqttCommandPayload): void {
		if (!this.client || !this.client.connected) {
			this.logger.warn(`MQTT client unavailable, skipping command publish for robotId=${robotId}`);
			return;
		}

		const topic: string = `robot/${robotId}/command`;
		const encodedPayload: string = JSON.stringify(payload);

		this.client.publish(topic, encodedPayload, (error?: Error) => {
			if (error) {
				this.logger.error(`Failed to publish MQTT command topic=${topic} robotId=${robotId}: ${error.message}`);
				return;
			}
			this.logger.log(`Published MQTT command topic=${topic} robotId=${robotId}`);
		});
	}

	subscribeToRobotTopics(robotId: string): void {
		if (!robotId?.trim()) {
			this.logger.warn('subscribeToRobotTopics called with empty robotId');
			return;
		}

		if (this.subscribedRobotIds.has(robotId)) {
			this.logger.log(`MQTT topics already subscribed for robotId=${robotId}`);
			return;
		}

		this.subscribedRobotIds.add(robotId);

		if (!this.client || !this.client.connected) {
			this.logger.warn(`MQTT client unavailable, deferred subscription for robotId=${robotId}`);
			return;
		}

		this.subscribeRobotTopicsNow(robotId);
	}

	private subscribeRobotTopicsNow(robotId: string): void {
		if (!this.client || !this.client.connected) return;

		const statusTopic: string = `robot/${robotId}/status`;
		const poseTopic: string = `robot/${robotId}/pose`;

		this.client.subscribe([statusTopic, poseTopic], (error?: Error) => {
			if (error) {
				this.logger.error(`Failed MQTT subscribe for robotId=${robotId}: ${error.message}`);
				return;
			}
			this.logger.log(`Subscribed MQTT topics for robotId=${robotId}: ${statusTopic}, ${poseTopic}`);
		});
	}

	private resubscribeKnownRobotTopics(): void {
		for (const robotId of this.subscribedRobotIds) {
			this.subscribeRobotTopicsNow(robotId);
		}
	}

	private handleIncomingMessage(topic: string, rawMessage: string): void {
		const topicMatch: RegExpMatchArray | null = topic.match(/^robot\/([^/]+)\/(status|pose)$/);
		if (!topicMatch) {
			this.logger.warn(`MQTT message received on unsupported topic=${topic}`);
			return;
		}

		const robotId: string = topicMatch[1];
		const topicType: string = topicMatch[2];
		let parsedPayload: unknown;

		try {
			parsedPayload = JSON.parse(rawMessage);
		} catch {
			this.logger.warn(`Invalid JSON payload on topic=${topic}`);
			return;
		}

		this.logger.log(`MQTT message received topic=${topic} payload=${JSON.stringify(parsedPayload)}`);

		if (topicType === 'status') {
			this.onStatusMessage(robotId, parsedPayload as MqttStatusPayload);
			return;
		}

		this.onPoseMessage(robotId, parsedPayload as MqttPosePayload);
	}

	private onStatusMessage(robotId: string, payload: MqttStatusPayload): void {
		this.logger.log(`STATUS from ${robotId}: ${payload.state} battery:${payload.battery}`);
		// TODO: Phase 6 — update Robot and Request in MongoDB
	}

	private onPoseMessage(robotId: string, payload: MqttPosePayload): void {
		this.logger.log(`POSE from ${robotId}: x:${payload.x} y:${payload.y} theta:${payload.theta}`);
		// TODO: Phase 6 — update Robot.currentPose in MongoDB
		// TODO: Phase 5 — emit robotPosition via WebSocket gateway
	}

	private maskBrokerUrl(brokerUrl: string): string {
		try {
			const parsedUrl: URL = new URL(brokerUrl);
			if (parsedUrl.username || parsedUrl.password) {
				parsedUrl.username = '***';
				parsedUrl.password = '***';
			}
			return parsedUrl.toString();
		} catch {
			return brokerUrl.replace(/\/\/[^@/]+@/, '//***:***@');
		}
	}
}
