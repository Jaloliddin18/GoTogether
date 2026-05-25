import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { connect, MqttClient } from 'mqtt';
import { Model, ObjectId } from 'mongoose';
import {
	CreateLostItemFromPatrolEventInput,
	LostItemService,
	LostItemLocationInput,
} from '../components/lost-item/lost-item.service';
import { shapeIntoMongoObjectId } from '../libs/config';
import { BookInventory } from '../libs/dto/book-inventory/book-inventory';
import { RequestTask } from '../libs/dto/request/request';
import { Robot } from '../libs/dto/robot/robot';
import { BookInventoryStatus } from '../libs/enums/book-inventory.enum';
import {
	LostItemEventType,
	LostItemObjectType,
	LostItemPriority,
	LostItemStatus,
} from '../libs/enums/lost-item.enum';
import { RequestErrorCode, RequestStatus } from '../libs/enums/request.enum';
import { RobotStatus } from '../libs/enums/robot.enum';
import { RobotGateway } from '../socket/robot.gateway';
import {
	MqttCancelCommandPayload,
	MqttCommandPayload,
	MqttPosePayload,
	MqttStatusPayload,
} from './mqtt.types';

@Injectable()
export class MqttRobotService implements OnModuleInit, OnModuleDestroy {
	private readonly logger: Logger = new Logger(MqttRobotService.name);
	private client: MqttClient | null = null;
	private readonly lostItemTopic = 'robot/+/lost-item';
	private readonly subscribedRobotIds: Set<string> = new Set<string>();
	private readonly offlineTimeouts: Map<string, ReturnType<typeof setTimeout>> =
		new Map<string, ReturnType<typeof setTimeout>>();
	private readonly terminalRequestStatuses: RequestStatus[] = [
		RequestStatus.COMPLETED,
		RequestStatus.FAILED,
		RequestStatus.CANCELLED,
	];
	private readonly postCompletionTelemetryWindowMs = 15 * 60 * 1000;

	constructor(
		private readonly robotGateway: RobotGateway,
		private readonly lostItemService: LostItemService,
		@InjectModel('Robot') private readonly robotModel: Model<Robot>,
		@InjectModel('Request') private readonly requestModel: Model<RequestTask>,
		@InjectModel('BookInventory')
		private readonly bookInventoryModel: Model<BookInventory>,
	) {}

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
			this.logger.debug(`MQTT client created, connecting to ${maskedBrokerUrl}`);
		} catch (error: unknown) {
			const errorMessage: string =
				error instanceof Error ? error.message : 'Unknown error';
			this.logger.error(
				`Failed to initialize MQTT client (${maskedBrokerUrl}): ${errorMessage}`,
			);
			return;
		}

		this.client.on('connect', () => {
			this.logger.log(`MQTT connected successfully (${maskedBrokerUrl})`);
			this.subscribeLostItemTopic();
			this.resubscribeKnownRobotTopics();
		});

		this.client.on('error', (error: Error) => {
			this.logger.error(
				`MQTT connection error (${maskedBrokerUrl}): ${error.message}`,
				error.stack,
			);
		});

		this.client.on('close', () => {
			this.logger.warn(`MQTT connection closed (${maskedBrokerUrl})`);
		});

		this.client.on('offline', () => {
			this.logger.warn(`MQTT client went offline (${maskedBrokerUrl})`);
		});

		this.client.on('message', (topic: string, message: Buffer) => {
			void this.handleIncomingMessage(topic, message.toString());
		});
	}

	onModuleDestroy(): void {
		for (const timeout of this.offlineTimeouts.values()) {
			clearTimeout(timeout);
		}
		this.offlineTimeouts.clear();

		if (!this.client) return;

		this.client.end(false, {}, () => {
			this.logger.log('MQTT client disconnected gracefully');
		});
		this.client = null;
	}

	publishCommand(
		robotId: string,
		payload: MqttCommandPayload | MqttCancelCommandPayload,
	): void {
		if (!this.client || !this.client.connected) {
			this.logger.warn(
				`MQTT client unavailable, skipping command publish for robotId=${robotId}`,
			);
			return;
		}

		const topic: string = `robot/${robotId}/command`;
		const encodedPayload: string = JSON.stringify(payload);

		this.client.publish(topic, encodedPayload, (error?: Error) => {
			if (error) {
				this.logger.error(
					`Failed to publish MQTT command topic=${topic} robotId=${robotId}: ${error.message}`,
				);
				return;
			}
			this.logger.log(
				`Published MQTT command topic=${topic} robotId=${robotId}`,
			);
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
			this.logger.warn(
				`MQTT client unavailable, deferred subscription for robotId=${robotId}`,
			);
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
				this.logger.error(
					`Failed MQTT subscribe for robotId=${robotId}: ${error.message}`,
				);
				return;
			}
			this.logger.log(
				`Subscribed MQTT topics for robotId=${robotId}: ${statusTopic}, ${poseTopic}`,
			);
		});
	}

	private subscribeLostItemTopic(): void {
		if (!this.client || !this.client.connected) return;

		this.client.subscribe(this.lostItemTopic, (error?: Error) => {
			if (error) {
				this.logger.error(
					`Failed MQTT subscribe for topic=${this.lostItemTopic}: ${error.message}`,
				);
				return;
			}
			this.logger.log(`Subscribed MQTT topic: ${this.lostItemTopic}`);
		});
	}

	private resubscribeKnownRobotTopics(): void {
		for (const robotId of this.subscribedRobotIds) {
			this.subscribeRobotTopicsNow(robotId);
		}
	}

	private async handleIncomingMessage(
		topic: string,
		rawMessage: string,
	): Promise<void> {
		const topicMatch: RegExpMatchArray | null = topic.match(
			/^robot\/([^/]+)\/(status|pose|lost-item)$/,
		);
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

		if (
			!parsedPayload ||
			typeof parsedPayload !== 'object' ||
			Array.isArray(parsedPayload)
		) {
			this.logger.warn(`Invalid payload shape on topic=${topic}`);
			return;
		}

		if (topicType !== 'pose') {
			this.logger.log(
				`MQTT message received topic=${topic} payload=${JSON.stringify(parsedPayload)}`,
			);
		}

		if (topicType === 'status') {
			await this.onStatusMessage(robotId, parsedPayload as MqttStatusPayload);
			return;
		}

		if (topicType === 'pose') {
			await this.onPoseMessage(robotId, parsedPayload as MqttPosePayload);
			return;
		}

		await this.onLostItemMessage(
			robotId,
			parsedPayload as Record<string, unknown>,
		);
	}

	private async onStatusMessage(
		robotId: string,
		payload: MqttStatusPayload,
	): Promise<void> {
		this.logger.log(
			`STATUS from ${robotId}: ${payload.state} battery:${payload.battery}`,
		);

		try {
			const payloadRobotId: string = payload?.robotId?.trim() || robotId;
			if (payloadRobotId !== robotId) {
				this.logger.warn(
					`MQTT status robotId mismatch topic=${robotId} payload=${payloadRobotId}`,
				);
			}

			const robot = await this.robotModel
				.findOne({ robotId: payloadRobotId })
				.exec();
			if (!robot) {
				this.logger.warn(
					`Robot not found for MQTT status robotId=${payloadRobotId}`,
				);
				return;
			}

			const robotUpdate: Record<string, unknown> = {
				lastSeenAt: new Date(),
				isOnline: true,
			};
			const mappedRequestStatus = this.mapToRequestStatus(payload.state);

			if (typeof payload.battery === 'number') {
				robotUpdate.battery = payload.battery;
			}

			const mappedRobotStatus = this.mapToRobotStatus(payload.state);
			if (mappedRobotStatus) {
				robotUpdate.status = mappedRobotStatus;
			} else if (!mappedRequestStatus) {
				this.logger.warn(
					`Unknown telemetry state=${payload.state}; updating battery/online only for robotId=${payloadRobotId}`,
				);
			}

			await this.robotModel
				.findOneAndUpdate({ _id: robot._id }, { $set: robotUpdate }, { new: true })
				.exec();
			this.clearOfflineTimeout(payloadRobotId);

			const activeRequest = await this.resolveTelemetryRequest({
				robot,
				payloadRequestId: payload.requestId,
			});
			if (!activeRequest) {
				this.logger.log(
					`No active request for robotId=${payloadRobotId}; skipping robotStatus/request updates`,
				);
				return;
			}

			const requestId: string = String(activeRequest._id);
			if (this.isOfflineTimeoutEligibleStatus(activeRequest.status)) {
				this.startOfflineTimeout(payloadRobotId, requestId);
			} else {
				this.clearOfflineTimeout(payloadRobotId);
			}

			let currentRequest = activeRequest;
			let requestStatusChanged = false;
			const readyAlreadyReached = this.hasReachedReady(activeRequest);

			if (this.isTerminalRequestStatus(activeRequest.status)) {
				if (mappedRequestStatus && mappedRequestStatus !== activeRequest.status) {
					this.logger.log(
						`Ignoring request status transition ${activeRequest.status} -> ${mappedRequestStatus} for terminal requestId=${requestId}`,
					);
				}
			} else if (!mappedRequestStatus) {
				this.logger.warn(
					`Unknown RequestStatus mapping for state=${payload.state}; skipping request status update`,
				);
			} else if (
				readyAlreadyReached &&
				this.isStaleTelemetryStatusAfterReady(mappedRequestStatus)
			) {
				this.logger.warn(
					`Ignoring stale telemetry state=${payload.state} because requestId=${requestId} already reached READY`,
				);
			} else if (
				readyAlreadyReached &&
				mappedRequestStatus === RequestStatus.READY
			) {
				this.logger.warn(
					`Ignoring duplicate READY telemetry state=${payload.state} for requestId=${requestId}; READY already exists in timeline`,
				);
			} else if (activeRequest.status === mappedRequestStatus) {
				this.logger.log(
					`Duplicate telemetry state=${mappedRequestStatus} for requestId=${requestId}; skipping timeline append`,
				);
			} else {
				const updatedRequest = await this.applyTelemetryRequestStatusTransition({
					requestId: activeRequest._id,
					nextStatus: mappedRequestStatus,
					message: payload.message,
					timestamp: payload.timestamp,
				});

				if (updatedRequest) {
					currentRequest = updatedRequest;
					requestStatusChanged = true;
					this.emitToRequestRoom(requestId, 'requestUpdated', {
						requestId,
						status: mappedRequestStatus,
						message: payload.message,
						timestamp: payload.timestamp,
					});

					if (this.isTerminalRequestStatus(mappedRequestStatus)) {
						this.clearOfflineTimeout(payloadRobotId);
					}
				} else {
					const latestRequest = await this.requestModel
						.findOne({ _id: activeRequest._id })
						.exec();
					if (latestRequest) {
						currentRequest = latestRequest;
						this.logSkippedTelemetryStatusUpdate({
							request: latestRequest,
							requestId,
							mappedRequestStatus,
							telemetryState: payload.state,
						});
					}
				}
			}

			this.emitToRequestRoom(requestId, 'robotStatus', {
				robotId: payloadRobotId,
				requestId,
				status: mappedRobotStatus ?? payload.state,
				message: payload.message,
				battery: payload.battery,
				timestamp: payload.timestamp,
			});

			if (this.isTerminalRequestStatus(payload.state)) {
				this.clearOfflineTimeout(payloadRobotId);
			}

			if (payload.state === RequestStatus.BOOK_NOT_FOUND) {
				if (currentRequest.status === RequestStatus.READY) {
					this.logger.warn(
						`Ignoring BOOK_NOT_FOUND for requestId=${requestId} because request is already READY`,
					);
					return;
				}

				this.emitToRequestRoom(requestId, 'bookNotFound', {
					requestId,
					bookId: String(currentRequest.bookId),
					message: payload.message,
					timestamp: payload.timestamp,
				});

				const failedRequest = await this.failRequestAndRelease({
					requestId: currentRequest._id,
					sourceInventoryId: currentRequest.sourceInventoryId,
					robotObjectId: robot._id,
					errorCode: RequestErrorCode.BOOK_NOT_FOUND,
					message: payload.message || 'Book not found.',
					timestamp: payload.timestamp,
				});

				this.clearOfflineTimeout(payloadRobotId);

				if (failedRequest) {
					this.emitToRequestRoom(requestId, 'requestUpdated', {
						requestId,
						status: RequestStatus.FAILED,
						message: payload.message || 'Book not found.',
						timestamp: payload.timestamp,
					});
				}
				return;
			}

			if (payload.state === RequestStatus.READY) {
				this.emitToRequestRoom(requestId, 'deliveryReady', {
					requestId,
					message: payload.message ?? 'Your book is ready for pickup.',
					timestamp: payload.timestamp,
				});
				this.clearOfflineTimeout(payloadRobotId);
				await this.releaseRobotAfterReady(robot._id);
				if (!requestStatusChanged && !this.hasReachedReady(currentRequest)) {
					this.logger.warn(
						`READY telemetry received but request status was not updated for requestId=${requestId}`,
					);
				}
			}
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			this.logger.error(
				`Failed handling MQTT status message for robotId=${robotId}: ${errorMessage}`,
			);
		}
	}

	private async onPoseMessage(
		robotId: string,
		payload: MqttPosePayload,
	): Promise<void> {
		try {
			const payloadRobotId: string = payload?.robotId?.trim() || robotId;
			if (payloadRobotId !== robotId) {
				this.logger.warn(
					`MQTT pose robotId mismatch topic=${robotId} payload=${payloadRobotId}`,
				);
			}

			const robot = await this.robotModel
				.findOne({ robotId: payloadRobotId })
				.exec();
			if (!robot) {
				this.logger.warn(
					`Robot not found for MQTT pose robotId=${payloadRobotId}`,
				);
				return;
			}

			await this.robotModel
				.findOneAndUpdate(
					{ _id: robot._id },
					{
						$set: {
							'currentPose.floorId': payload.floorId,
							'currentPose.x': payload.x,
							'currentPose.y': payload.y,
							'currentPose.theta': payload.theta,
							lastSeenAt: new Date(),
							isOnline: true,
						},
					},
					{ new: true },
				)
				.exec();
			this.clearOfflineTimeout(payloadRobotId);

			const activeRequest = await this.resolveTelemetryRequest({
				robot,
				payloadRequestId: payload.requestId,
			});
			if (!activeRequest) {
				this.logger.debug(
					`No active request for robotId=${payloadRobotId}; skipping robotPosition emit`,
				);
				return;
			}

			const requestId: string = String(activeRequest._id);
			if (!this.isOfflineTimeoutEligibleStatus(activeRequest.status)) {
				this.clearOfflineTimeout(payloadRobotId);
			} else {
				this.startOfflineTimeout(payloadRobotId, requestId);
			}

			this.emitToRequestRoom(requestId, 'robotPosition', {
				robotId: payloadRobotId,
				requestId,
				floorId: payload.floorId,
				x: payload.x,
				y: payload.y,
				theta: payload.theta,
				timestamp: payload.timestamp,
			});
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			this.logger.error(
				`Failed handling MQTT pose message for robotId=${robotId}: ${errorMessage}`,
			);
		}
	}

	private async onLostItemMessage(
		topicRobotId: string,
		payload: Record<string, unknown>,
	): Promise<void> {
		const normalizedPayload = this.normalizeLostItemPayload(
			topicRobotId,
			payload,
		);
		if (!normalizedPayload) return;

		try {
			const saved = await this.lostItemService.createLostItemFromPatrolEvent(
				normalizedPayload,
			);
			this.logger.log(
				`Lost item saved robotId=${saved.robotId} objectType=${saved.objectType} lostItemId=${saved._id}`,
			);
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			this.logger.error(
				`Failed saving lost-item event robotId=${normalizedPayload.robotId}: ${errorMessage}`,
			);
		}
	}

	private normalizeLostItemPayload(
		topicRobotId: string,
		payload: Record<string, unknown>,
	): CreateLostItemFromPatrolEventInput | null {
		const eventTypeRaw = this.toUppercaseString(payload.eventType);
		if (eventTypeRaw !== LostItemEventType.LOST_ITEM_DETECTED) {
			this.logger.warn(
				`Dropping lost-item payload due to invalid eventType topicRobotId=${topicRobotId} eventType=${String(payload.eventType)}`,
			);
			return null;
		}

		const payloadRobotId = this.toOptionalString(payload.robotId);
		const resolvedRobotId = topicRobotId?.trim() || payloadRobotId;

		if (!resolvedRobotId) {
			this.logger.warn(
				'Dropping lost-item payload due to missing robotId in topic and payload',
			);
			return null;
		}

		if (payloadRobotId && payloadRobotId !== topicRobotId) {
			this.logger.warn(
				`Lost-item robotId mismatch topic=${topicRobotId} payload=${payloadRobotId}; using topic robotId`,
			);
		}

		const confidence = this.normalizeLostItemConfidence(payload.confidence);
		if (confidence === null) {
			this.logger.warn(
				`Dropping lost-item payload due to invalid confidence robotId=${resolvedRobotId} value=${String(payload.confidence)}`,
			);
			return null;
		}

		const objectType = this.normalizeLostItemObjectType(payload.objectType);
		const priority = this.normalizeLostItemPriority(payload.priority, objectType);
		const status = this.normalizeLostItemStatus(payload.status);
		const detectedAt = this.normalizeLostItemDetectedAt(
			payload.detectedAt,
			resolvedRobotId,
		);
		const location = this.normalizeLostItemLocation(payload.location);

		return {
			robotId: resolvedRobotId,
			eventType: LostItemEventType.LOST_ITEM_DETECTED,
			objectType,
			confidence,
			priority,
			detectedAt,
			snapshotPath: this.toOptionalString(payload.snapshotPath),
			snapshotUrl: this.toOptionalString(payload.snapshotUrl),
			location,
			status,
			notes: this.toOptionalString(payload.notes),
		};
	}

	private normalizeLostItemObjectType(rawObjectType: unknown): LostItemObjectType {
		const normalized = this.toUppercaseString(rawObjectType)?.replace(/-/g, '_');
		switch (normalized) {
			case LostItemObjectType.ID_CARD:
				return LostItemObjectType.ID_CARD;
			case LostItemObjectType.BOTTLE:
				return LostItemObjectType.BOTTLE;
			case LostItemObjectType.WALLET:
				return LostItemObjectType.WALLET;
			case LostItemObjectType.PHONE:
				return LostItemObjectType.PHONE;
			case LostItemObjectType.BOOK:
				return LostItemObjectType.BOOK;
			default:
				return LostItemObjectType.UNKNOWN;
		}
	}

	private normalizeLostItemPriority(
		rawPriority: unknown,
		objectType: LostItemObjectType,
	): LostItemPriority {
		const normalized = this.toUppercaseString(rawPriority);
		if (normalized === LostItemPriority.HIGH) return LostItemPriority.HIGH;
		if (normalized === LostItemPriority.MEDIUM) return LostItemPriority.MEDIUM;
		if (normalized === LostItemPriority.LOW) return LostItemPriority.LOW;

		if (
			objectType === LostItemObjectType.ID_CARD ||
			objectType === LostItemObjectType.WALLET ||
			objectType === LostItemObjectType.PHONE
		) {
			return LostItemPriority.HIGH;
		}

		if (objectType === LostItemObjectType.BOOK) {
			return LostItemPriority.MEDIUM;
		}

		return LostItemPriority.LOW;
	}

	private normalizeLostItemStatus(rawStatus: unknown): LostItemStatus {
		const normalized = this.toUppercaseString(rawStatus);
		if (normalized === LostItemStatus.PENDING_REVIEW) {
			return LostItemStatus.PENDING_REVIEW;
		}
		if (normalized === LostItemStatus.COLLECTED) {
			return LostItemStatus.COLLECTED;
		}
		if (normalized === LostItemStatus.DISMISSED) {
			return LostItemStatus.DISMISSED;
		}
		return LostItemStatus.PENDING_REVIEW;
	}

	private normalizeLostItemConfidence(rawConfidence: unknown): number | null {
		if (typeof rawConfidence !== 'number' || Number.isNaN(rawConfidence)) {
			return null;
		}

		if (rawConfidence < 0 || rawConfidence > 1) {
			return null;
		}

		return rawConfidence;
	}

	private normalizeLostItemDetectedAt(
		rawDetectedAt: unknown,
		robotId: string,
	): Date {
		if (rawDetectedAt instanceof Date && !Number.isNaN(rawDetectedAt.getTime())) {
			return rawDetectedAt;
		}

		if (typeof rawDetectedAt === 'string' && rawDetectedAt.trim()) {
			const parsedDate = new Date(rawDetectedAt);
			if (!Number.isNaN(parsedDate.getTime())) {
				return parsedDate;
			}
		}

		this.logger.warn(
			`Invalid or missing lost-item detectedAt; using current Date for robotId=${robotId}`,
		);
		return new Date();
	}

	private normalizeLostItemLocation(
		rawLocation: unknown,
	): LostItemLocationInput | undefined {
		if (!rawLocation || typeof rawLocation !== 'object' || Array.isArray(rawLocation)) {
			return undefined;
		}

		const locationRecord = rawLocation as Record<string, unknown>;
		const location: LostItemLocationInput = {};
		const source = this.toOptionalString(locationRecord.source);
		const floorId = this.toOptionalString(locationRecord.floorId);
		const patrolCheckpoint = this.toOptionalString(
			locationRecord.patrolCheckpoint,
		);
		const x = this.normalizeOptionalCoordinate(locationRecord.x);
		const y = this.normalizeOptionalCoordinate(locationRecord.y);

		if (source !== undefined) location.source = source;
		if (floorId !== undefined) location.floorId = floorId;
		if (patrolCheckpoint !== undefined) {
			location.patrolCheckpoint = patrolCheckpoint;
		}
		if (x !== undefined) location.x = x;
		if (y !== undefined) location.y = y;

		return Object.keys(location).length ? location : undefined;
	}

	private normalizeOptionalCoordinate(
		rawCoordinate: unknown,
	): number | null | undefined {
		if (rawCoordinate === null) return null;
		if (typeof rawCoordinate === 'number' && !Number.isNaN(rawCoordinate)) {
			return rawCoordinate;
		}
		return undefined;
	}

	private toOptionalString(value: unknown): string | undefined {
		if (typeof value !== 'string') return undefined;
		const trimmedValue = value.trim();
		return trimmedValue ? trimmedValue : undefined;
	}

	private toUppercaseString(value: unknown): string | undefined {
		const trimmedValue = this.toOptionalString(value);
		return trimmedValue?.toUpperCase();
	}

	private startOfflineTimeout(robotId: string, requestId: string): void {
		this.clearOfflineTimeout(robotId);
		const timeout = setTimeout(() => {
			void this.handleOfflineTimeout(robotId, requestId);
		}, 30000);
		this.offlineTimeouts.set(robotId, timeout);
	}

	private clearOfflineTimeout(robotId: string): void {
		const timeout = this.offlineTimeouts.get(robotId);
		if (!timeout) return;
		clearTimeout(timeout);
		this.offlineTimeouts.delete(robotId);
	}

	private async handleOfflineTimeout(
		robotId: string,
		requestId: string,
	): Promise<void> {
		this.offlineTimeouts.delete(robotId);

		try {
			const robot = await this.robotModel.findOne({ robotId }).exec();
			if (!robot) {
				this.logger.warn(
					`Offline timeout fired but robot not found for robotId=${robotId}`,
				);
				return;
			}

			const request = await this.requestModel
				.findOne({ _id: shapeIntoMongoObjectId(requestId) })
				.exec();
			if (!request) {
				this.logger.warn(
					`Offline timeout fired but request not found for requestId=${requestId}`,
				);
				return;
			}

			if (request.status === RequestStatus.READY) {
				this.clearOfflineTimeout(robotId);
				this.logger.log(
					`Offline timeout ignored for requestId=${requestId} because status is READY`,
				);
				return;
			}

			if (this.isTerminalRequestStatus(request.status)) {
				return;
			}

			await this.robotModel
				.findOneAndUpdate(
					{ _id: robot._id },
					{
						$set: {
							isOnline: false,
							status: RobotStatus.IDLE,
							currentRequestId: null,
							lastSeenAt: new Date(),
						},
					},
					{ new: true },
				)
				.exec();

			const errorTimestamp = new Date();
			await this.requestModel
				.findOneAndUpdate(
					{ _id: request._id },
					{
						$set: {
							status: RequestStatus.FAILED,
							error: {
								code: RequestErrorCode.ROBOT_OFFLINE,
								message: 'Robot connection lost.',
								timestamp: errorTimestamp,
							},
						},
						$push: {
							timeline: {
								status: RequestStatus.FAILED,
								message: 'Robot connection lost.',
								timestamp: errorTimestamp,
							},
						},
					},
					{ new: true },
				)
				.exec();

			await this.releaseInventoryReservation(request.sourceInventoryId);

			const nowIso = new Date().toISOString();
			this.emitToRequestRoom(requestId, 'robotOffline', {
				robotId,
				requestId,
				message: 'Robot connection lost.',
				timestamp: nowIso,
			});
			this.emitToRequestRoom(requestId, 'requestUpdated', {
				requestId,
				status: RequestStatus.FAILED,
				message: 'Robot connection lost.',
				timestamp: nowIso,
			});
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			this.logger.error(
				`Offline timeout handling failed for robotId=${robotId}, requestId=${requestId}: ${errorMessage}`,
			);
		}
	}

	private async failRequestAndRelease(input: {
		requestId: ObjectId;
		sourceInventoryId: ObjectId;
		robotObjectId: ObjectId;
		errorCode: RequestErrorCode;
		message: string;
		timestamp?: string;
	}): Promise<RequestTask | null> {
		const failedAt = this.toValidDate(input.timestamp);
		const failedRequest = await this.requestModel
			.findOneAndUpdate(
				{ _id: input.requestId },
				{
					$set: {
						status: RequestStatus.FAILED,
						error: {
							code: input.errorCode,
							message: input.message,
							timestamp: failedAt,
						},
					},
					$push: {
						timeline: {
							status: RequestStatus.FAILED,
							message: input.message,
							timestamp: failedAt,
						},
					},
				},
				{ new: true },
			)
			.exec();

		await this.releaseInventoryReservation(input.sourceInventoryId);
		await this.releaseRobot(input.robotObjectId);

		return failedRequest;
	}

	private async findActiveRequestByRobot(
		robotObjectId: ObjectId,
	): Promise<RequestTask | null> {
		return await this.requestModel
			.findOne({
				robotId: robotObjectId,
				status: { $nin: this.terminalRequestStatuses },
			})
			.sort({ updatedAt: -1 })
			.exec();
	}

	private async resolveTelemetryRequest(input: {
		robot: Robot;
		payloadRequestId?: string;
	}): Promise<RequestTask | null> {
		const activeStatusFilter = { $nin: this.terminalRequestStatuses };
		const payloadRequestId = input.payloadRequestId?.trim();

		if (payloadRequestId) {
			try {
				const requestFromPayload = await this.requestModel
					.findOne({
						_id: shapeIntoMongoObjectId(payloadRequestId),
						robotId: input.robot._id,
						status: activeStatusFilter,
					})
					.exec();
					if (requestFromPayload) {
						return requestFromPayload;
					}

				const completedRequestFromPayload = await this.requestModel
					.findOne({
						_id: shapeIntoMongoObjectId(payloadRequestId),
						robotId: input.robot._id,
						status: RequestStatus.COMPLETED,
					})
					.exec();
					if (
						completedRequestFromPayload &&
						this.isWithinPostCompletionTelemetryWindow(
							completedRequestFromPayload.updatedAt,
						)
					) {
						return completedRequestFromPayload;
					}
			} catch {
				this.logger.warn(
					`Invalid payload.requestId format: ${payloadRequestId}`,
				);
			}
		}

		if (input.robot.currentRequestId) {
			const requestFromRobot = await this.requestModel
				.findOne({
					_id: input.robot.currentRequestId,
					robotId: input.robot._id,
					status: activeStatusFilter,
				})
				.exec();
				if (requestFromRobot) {
					return requestFromRobot;
				}
			}

			const requestFromFallback = await this.findActiveRequestByRobot(input.robot._id);
			return requestFromFallback;
		}

	private isWithinPostCompletionTelemetryWindow(
		updatedAt?: Date,
	): boolean {
		if (!updatedAt) return false;
		return (
			Date.now() - updatedAt.getTime() <= this.postCompletionTelemetryWindowMs
		);
	}

	private isTerminalRequestStatus(status: RequestStatus | string): boolean {
		return this.terminalRequestStatuses.includes(status as RequestStatus);
	}

	private isStaleTelemetryStatusAfterReady(status: RequestStatus): boolean {
		return status !== RequestStatus.READY && !this.isTerminalRequestStatus(status);
	}

	private hasTimelineStatus(
		request: Pick<RequestTask, 'timeline'> | null | undefined,
		status: RequestStatus,
	): boolean {
		return Boolean(
			request?.timeline?.some((timelineItem) => timelineItem?.status === status),
		);
	}

	private hasReachedReady(
		request: Pick<RequestTask, 'status' | 'timeline'> | null | undefined,
	): boolean {
		return (
			request?.status === RequestStatus.READY ||
			this.hasTimelineStatus(request, RequestStatus.READY)
		);
	}

	private async applyTelemetryRequestStatusTransition(input: {
		requestId: ObjectId;
		nextStatus: RequestStatus;
		message?: string;
		timestamp?: string;
	}): Promise<RequestTask | null> {
		return await this.requestModel
			.findOneAndUpdate(
				{
					_id: input.requestId,
					status: {
						$nin: this.terminalRequestStatuses,
						$ne: input.nextStatus,
					},
					timeline: {
						$not: {
							$elemMatch: {
								status: RequestStatus.READY,
							},
						},
					},
				},
				{
					$set: {
						status: input.nextStatus,
					},
					$push: {
						timeline: this.buildTimelineItem(
							input.nextStatus,
							input.message,
							input.timestamp,
						),
					},
				},
				{ new: true },
			)
			.exec();
	}

	private logSkippedTelemetryStatusUpdate(input: {
		request: RequestTask;
		requestId: string;
		mappedRequestStatus: RequestStatus;
		telemetryState: string;
	}): void {
		if (this.hasReachedReady(input.request)) {
			if (input.mappedRequestStatus === RequestStatus.READY) {
				this.logger.warn(
					`Ignoring duplicate READY telemetry state=${input.telemetryState} for requestId=${input.requestId}; READY already exists in timeline`,
				);
				return;
			}

			this.logger.warn(
				`Ignoring stale telemetry state=${input.telemetryState} because requestId=${input.requestId} already reached READY`,
			);
			return;
		}

		if (this.isTerminalRequestStatus(input.request.status)) {
			this.logger.log(
				`Ignoring telemetry state=${input.telemetryState} because requestId=${input.requestId} is terminal (${input.request.status})`,
			);
			return;
		}

		if (input.request.status === input.mappedRequestStatus) {
			this.logger.log(
				`Duplicate telemetry state=${input.mappedRequestStatus} for requestId=${input.requestId}; skipping timeline append`,
			);
			return;
		}

		this.logger.warn(
			`Skipped telemetry transition to ${input.mappedRequestStatus} for requestId=${input.requestId}; current status is ${input.request.status}`,
		);
	}

	private isOfflineTimeoutEligibleStatus(
		status: RequestStatus | string,
	): boolean {
		return (
			status !== RequestStatus.READY && !this.isTerminalRequestStatus(status)
		);
	}

	private mapToRobotStatus(state: string): RobotStatus | null {
		const normalizedState = this.normalizeTelemetryState(state);
		const statusMap: RobotStatus[] = [
			RobotStatus.IDLE,
			RobotStatus.ASSIGNED,
			RobotStatus.NAVIGATING,
			RobotStatus.VERIFYING_BOOK,
			RobotStatus.PICKING_UP,
			RobotStatus.DELIVERING,
			RobotStatus.RETURNING,
			RobotStatus.DOCKING,
			RobotStatus.ERROR,
			RobotStatus.MAINTENANCE,
		];
		return statusMap.includes(normalizedState as RobotStatus)
			? (normalizedState as RobotStatus)
			: null;
	}

	private mapToRequestStatus(state: string): RequestStatus | null {
		const normalizedState = this.normalizeTelemetryState(state);
		switch (normalizedState) {
			case RequestStatus.NAVIGATING_TO_SHELF:
				return RequestStatus.NAVIGATING_TO_SHELF;
			case RobotStatus.NAVIGATING:
				return RequestStatus.NAVIGATING_TO_SHELF;
			case RequestStatus.ARRIVED_AT_SHELF:
				return RequestStatus.ARRIVED_AT_SHELF;
			case RequestStatus.VERIFYING_BOOK:
				return RequestStatus.VERIFYING_BOOK;
			case RequestStatus.BOOK_FOUND:
				return RequestStatus.BOOK_FOUND;
			case RequestStatus.BOOK_NOT_FOUND:
				return RequestStatus.BOOK_NOT_FOUND;
			case RequestStatus.PICKING_UP:
				return RequestStatus.PICKING_UP;
			case RequestStatus.DELIVERING:
				return RequestStatus.DELIVERING;
			case RequestStatus.ARRIVED_AT_STUDENT:
				return RequestStatus.ARRIVED_AT_STUDENT;
			case RequestStatus.READY:
				return RequestStatus.READY;
			case 'COMPLETED':
			case 'FINISHED':
			case 'DELIVERY_COMPLETED':
			case 'DELIVERY_COMPLETE':
			case 'TASK_COMPLETED':
			case 'TASK_COMPLETE':
			case 'MISSION_COMPLETED':
			case 'MISSION_COMPLETE':
				return RequestStatus.READY;
			default:
				return null;
		}
	}

	private normalizeTelemetryState(state: string): string {
		return state?.trim?.().toUpperCase().replace(/[\s-]+/g, '_') ?? '';
	}

	private buildTimelineItem(
		status: RequestStatus,
		message?: string,
		timestamp?: string,
	): { status: RequestStatus; message: string; timestamp: Date } {
		return {
			status,
			message: message ?? '',
			timestamp: this.toValidDate(timestamp),
		};
	}

	private toValidDate(timestamp?: string): Date {
		if (!timestamp) return new Date();
		const parsed = new Date(timestamp);
		if (Number.isNaN(parsed.getTime())) {
			return new Date();
		}
		return parsed;
	}

	private async releaseRobot(robotObjectId: ObjectId): Promise<void> {
		await this.robotModel
			.findOneAndUpdate(
				{ _id: robotObjectId },
				{
					$set: {
						status: RobotStatus.IDLE,
						currentRequestId: null,
					},
				},
				{ new: true },
			)
			.exec();
	}

	private async releaseRobotAfterReady(robotObjectId: ObjectId): Promise<void> {
		await this.robotModel
			.findOneAndUpdate(
				{ _id: robotObjectId },
				{
					$set: {
						status: RobotStatus.IDLE,
						currentRequestId: null,
						isOnline: true,
						lastSeenAt: new Date(),
					},
				},
				{ new: true },
			)
			.exec();
	}

	private async releaseInventoryReservation(
		sourceInventoryId: ObjectId,
	): Promise<void> {
		const updated = await this.bookInventoryModel
			.findOneAndUpdate(
				{
					_id: sourceInventoryId,
					deletedAt: null,
					bookReservedQuantity: { $gt: 0 },
				},
				{ $inc: { bookReservedQuantity: -1 } },
				{ new: true },
			)
			.exec();

		if (updated) {
			await this.syncInventoryStatusByAvailability(updated._id);
		}
	}

	private async syncInventoryStatusByAvailability(
		sourceInventoryId: ObjectId,
	): Promise<void> {
		const inventory = await this.bookInventoryModel
			.findOne({ _id: sourceInventoryId, deletedAt: null })
			.lean()
			.exec();
		if (!inventory) return;

		const availableStock = this.calculateAvailableStock(inventory);
		const nextStatus =
			availableStock > 0
				? BookInventoryStatus.AVAILABLE
				: BookInventoryStatus.RESERVED;

		if (inventory.bookInventoryStatus === nextStatus) return;

		await this.bookInventoryModel
			.findOneAndUpdate(
				{ _id: sourceInventoryId },
				{ $set: { bookInventoryStatus: nextStatus } },
				{ new: true },
			)
			.exec();
	}

	private calculateAvailableStock(inventory: Partial<BookInventory>): number {
		const total = inventory.bookTotalQuantity ?? 0;
		const sold = inventory.bookSoldQuantity ?? 0;
		const reserved = inventory.bookReservedQuantity ?? 0;
		const borrowed = inventory.bookBorrowedQuantity ?? 0;
		return total - sold - reserved - borrowed;
	}

	private emitToRequestRoom(
		requestId: string,
		event: string,
		payload: Record<string, unknown>,
	): void {
		const server: any = this.robotGateway.getServer();
		if (!server) {
			this.logger.warn('WebSocket server not ready');
			return;
		}

		server.to(`request:${requestId}`).emit(event, payload);
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
