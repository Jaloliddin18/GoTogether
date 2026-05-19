import 'dotenv/config';
import { connect, MqttClient } from 'mqtt';

type Mode = 'borrow-desk-a' | 'borrow-desk-b' | 'purchase-reception';
type SimulationKind = 'delivery' | 'return';

type SvgPoint = {
	x: number;
	y: number;
};

type PosePoint = {
	x: number;
	y: number;
	theta: number;
};

type CliArgs = {
	requestId: string | null;
	robotId: string;
	mode: Mode;
	speedMs: number;
	broker: string;
	returnToDock: boolean;
	listen: boolean;
};

type DeliveryCommandPayload = {
	type: 'DELIVERY_TASK';
	requestId: string;
	requestType?: string;
	destinationType?: string;
	destinationDeskId?: string;
	book?: {
		callNumber?: string;
	};
	dropoff?: {
		seatId?: string;
	};
};

type ReturnToDockCommandPayload = {
	type: 'RETURN_TO_DOCK';
	requestId: string;
	dock?: {
		floorId?: string;
		x?: number;
		y?: number;
		theta?: number;
	};
};

type CommandPayload = DeliveryCommandPayload | ReturnToDockCommandPayload;

const DEFAULTS = {
	robotId: 'robot_01',
	mode: 'borrow-desk-a' as Mode,
	speedMs: 500,
	broker: 'mqtt://localhost:1883',
	floorId: 'floor_1',
	batteryStart: 86,
	batteryEnd: 80,
};

const SVG_SCALE = 3.4;
const FLOOR_Y_MAX = 100;

const NODE_SVG: Record<string, SvgPoint> = {
	CHARGING_DOCK: { x: 182, y: 307 },
	CHARGING_DOCK_EXIT: { x: 53.5 * SVG_SCALE, y: (100 - 40) * SVG_SCALE },
	AISLE_LEFT: { x: 34 * SVG_SCALE, y: (100 - 55) * SVG_SCALE },
	AISLE_MIDDLE: { x: 84 * SVG_SCALE, y: (100 - 55) * SVG_SCALE },
	AISLE_RIGHT: { x: 140 * SVG_SCALE, y: (100 - 55) * SVG_SCALE },
	LIB_1_APPROACH: { x: 16.5 * SVG_SCALE, y: (100 - 55) * SVG_SCALE },
	LIB_2_APPROACH: { x: 34 * SVG_SCALE, y: (100 - 55) * SVG_SCALE },
	COM_4_APPROACH: { x: 86 * SVG_SCALE, y: (100 - 55) * SVG_SCALE },
	LIB_1_SHELF: { x: 56, y: 24 },
	LIB_2_SHELF: { x: 116, y: 24 },
	COM_4_SHELF: { x: 292, y: 24 },
	DESK_A_CORRIDOR_TURN: { x: 150 * SVG_SCALE, y: (100 - 55) * SVG_SCALE },
	DESK_B_CORRIDOR_TURN: { x: 150 * SVG_SCALE, y: (100 - 55) * SVG_SCALE },
	DESK_A_ENDPOINT: { x: 496, y: 68 },
	DESK_B_ENDPOINT: { x: 496, y: 262 },
	SERVICE_CORRIDOR_TURN: { x: 28 * SVG_SCALE, y: (100 - 40) * SVG_SCALE },
	SERVICE_POINT_ENDPOINT: { x: 96, y: 282 },
};

const MODE_NODE_ROUTES: Record<Mode, { toShelf: string[]; toDestination: string[] }> = {
	'borrow-desk-a': {
		toShelf: [
			'CHARGING_DOCK',
			'CHARGING_DOCK_EXIT',
			'AISLE_LEFT',
			'LIB_1_APPROACH',
			'LIB_1_SHELF',
		],
		toDestination: [
			'LIB_1_SHELF',
			'LIB_1_APPROACH',
			'AISLE_LEFT',
			'AISLE_MIDDLE',
			'AISLE_RIGHT',
			'DESK_A_CORRIDOR_TURN',
			'DESK_A_ENDPOINT',
		],
	},
	'borrow-desk-b': {
		toShelf: [
			'CHARGING_DOCK',
			'CHARGING_DOCK_EXIT',
			'AISLE_LEFT',
			'LIB_2_APPROACH',
			'LIB_2_SHELF',
		],
		toDestination: [
			'LIB_2_SHELF',
			'LIB_2_APPROACH',
			'AISLE_LEFT',
			'AISLE_MIDDLE',
			'AISLE_RIGHT',
			'DESK_B_CORRIDOR_TURN',
			'DESK_B_ENDPOINT',
		],
	},
	'purchase-reception': {
		toShelf: [
			'CHARGING_DOCK',
			'CHARGING_DOCK_EXIT',
			'AISLE_MIDDLE',
			'COM_4_APPROACH',
			'COM_4_SHELF',
		],
		toDestination: [
			'COM_4_SHELF',
			'COM_4_APPROACH',
			'AISLE_MIDDLE',
			'AISLE_LEFT',
			'SERVICE_CORRIDOR_TURN',
			'SERVICE_POINT_ENDPOINT',
		],
	},
};

const MODE_RETURN_NODE_ROUTES: Record<Mode, string[]> = {
	'borrow-desk-a': [
		'DESK_A_ENDPOINT',
		'DESK_A_CORRIDOR_TURN',
		'AISLE_RIGHT',
		'AISLE_MIDDLE',
		'AISLE_LEFT',
		'CHARGING_DOCK_EXIT',
		'CHARGING_DOCK',
	],
	'borrow-desk-b': [
		'DESK_B_ENDPOINT',
		'DESK_B_CORRIDOR_TURN',
		'AISLE_RIGHT',
		'AISLE_MIDDLE',
		'AISLE_LEFT',
		'CHARGING_DOCK_EXIT',
		'CHARGING_DOCK',
	],
	'purchase-reception': [
		'SERVICE_POINT_ENDPOINT',
		'SERVICE_CORRIDOR_TURN',
		'AISLE_LEFT',
		'CHARGING_DOCK_EXIT',
		'CHARGING_DOCK',
	],
};

const RequestStates = {
	NAVIGATING_TO_SHELF: 'NAVIGATING_TO_SHELF',
	ARRIVED_AT_SHELF: 'ARRIVED_AT_SHELF',
	PICKING_UP: 'PICKING_UP',
	DELIVERING: 'DELIVERING',
	READY: 'READY',
	RETURNING: 'RETURNING',
	DOCKING: 'DOCKING',
	IDLE: 'IDLE',
} as const;

function printUsage(): void {
	console.log('Usage:');
	console.log('Manual:   npx ts-node -r tsconfig-paths/register scripts/simulateRobotDelivery.ts --requestId=<REQUEST_ID> [--robotId=robot_01] [--mode=borrow-desk-a] [--speedMs=500] [--broker=mqtt://localhost:1883] [--returnToDock=true]');
	console.log('Listener: npx ts-node -r tsconfig-paths/register scripts/simulateRobotDelivery.ts --listen=true --robotId=robot_01 [--speedMs=500] [--broker=mqtt://localhost:1883]');
}

function normalizeValue(raw: string): string {
	return raw.trim().replace(/,+$/, '');
}

function parseBoolean(raw: string): boolean {
	return ['true', '1', 'yes', 'y'].includes(normalizeValue(raw).toLowerCase());
}

function normalizeToken(value: string | null | undefined): string {
	return (value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function parseArgs(argv: string[]): CliArgs {
	const parsed: Partial<CliArgs> = {};

	for (const arg of argv) {
		if (!arg.startsWith('--')) continue;
		const [key, value] = arg.slice(2).split('=');
		if (!value) continue;
		const cleanValue = normalizeValue(value);
		if (key === 'requestId') parsed.requestId = cleanValue;
		if (key === 'robotId') parsed.robotId = cleanValue;
		if (key === 'mode') parsed.mode = cleanValue as Mode;
		if (key === 'speedMs') parsed.speedMs = Number(cleanValue);
		if (key === 'broker') parsed.broker = cleanValue;
		if (key === 'returnToDock') parsed.returnToDock = parseBoolean(cleanValue);
		if (key === 'listen') parsed.listen = parseBoolean(cleanValue);
	}

	const mode = parsed.mode ?? DEFAULTS.mode;
	if (!MODE_NODE_ROUTES[mode]) {
		console.error(`Invalid mode: ${mode}`);
		printUsage();
		process.exit(1);
	}

	const listen = parsed.listen ?? false;
	if (!listen && !parsed.requestId) {
		printUsage();
		process.exit(1);
	}

	return {
		requestId: parsed.requestId ?? null,
		robotId: parsed.robotId ?? DEFAULTS.robotId,
		mode,
		speedMs:
			Number.isFinite(parsed.speedMs) && (parsed.speedMs as number) > 0
				? (parsed.speedMs as number)
				: DEFAULTS.speedMs,
		broker: parsed.broker ?? DEFAULTS.broker,
		returnToDock: parsed.returnToDock ?? false,
		listen,
	};
}

function svgPointToRobotPose(point: SvgPoint): { x: number; y: number } {
	return {
		x: point.x / SVG_SCALE,
		y: FLOOR_Y_MAX - point.y / SVG_SCALE,
	};
}

function interpolateSvgSegment(start: SvgPoint, end: SvgPoint): SvgPoint[] {
	const dx = end.x - start.x;
	const dy = end.y - start.y;
	const distance = Math.hypot(dx, dy);
	const intermediates = Math.max(8, Math.min(15, Math.round(distance / 26)));
	const steps = intermediates + 1;
	const points: SvgPoint[] = [];

	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		points.push({
			x: start.x + dx * t,
			y: start.y + dy * t,
		});
	}

	return points;
}

function buildSvgPath(nodeIds: string[]): SvgPoint[] {
	const nodes = nodeIds.map((nodeId) => {
		const point = NODE_SVG[nodeId];
		if (!point) throw new Error(`Unknown route node: ${nodeId}`);
		return point;
	});

	if (nodes.length < 2) return nodes;

	const path: SvgPoint[] = [];
	for (let i = 0; i < nodes.length - 1; i++) {
		const segment = interpolateSvgSegment(nodes[i], nodes[i + 1]);
		if (i === 0) path.push(...segment);
		else path.push(...segment.slice(1));
	}
	return path;
}

function buildPosePathFromNodeRoute(nodeIds: string[]): PosePoint[] {
	const svgPath = buildSvgPath(nodeIds);
	if (!svgPath.length) return [];

	const posePath = svgPath.map((svgPoint) => {
		const pose = svgPointToRobotPose(svgPoint);
		return { x: pose.x, y: pose.y, theta: 0 };
	});

	for (let i = 0; i < posePath.length; i++) {
		if (i < posePath.length - 1) {
			const next = posePath[i + 1];
			posePath[i].theta = Math.atan2(
				next.y - posePath[i].y,
				next.x - posePath[i].x,
			);
		} else if (i > 0) {
			posePath[i].theta = posePath[i - 1].theta;
		}
	}

	return posePath;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function publish(
	client: MqttClient,
	topic: string,
	payload: Record<string, unknown>,
): Promise<void> {
	return new Promise((resolve, reject) => {
		client.publish(topic, JSON.stringify(payload), (error?: Error) => {
			if (error) return reject(error);
			resolve();
		});
	});
}

function connectMqttClient(broker: string): Promise<MqttClient> {
	return new Promise((resolve, reject) => {
		const client = connect(broker);
		client.once('connect', () => {
			console.log(`MQTT connected (${broker})`);
			resolve(client);
		});
		client.once('error', (error) => {
			reject(error);
		});
	});
}

function isDeliveryCommandPayload(payload: unknown): payload is DeliveryCommandPayload {
	return (
		typeof payload === 'object' &&
		payload !== null &&
		(payload as Record<string, unknown>).type === 'DELIVERY_TASK' &&
		typeof (payload as Record<string, unknown>).requestId === 'string'
	);
}

function isReturnToDockCommandPayload(payload: unknown): payload is ReturnToDockCommandPayload {
	return (
		typeof payload === 'object' &&
		payload !== null &&
		(payload as Record<string, unknown>).type === 'RETURN_TO_DOCK' &&
		typeof (payload as Record<string, unknown>).requestId === 'string'
	);
}

function resolveModeFromDeliveryCommand(payload: DeliveryCommandPayload): Mode {
	const seatToken = normalizeToken(
		payload.dropoff?.seatId ?? payload.destinationDeskId,
	);
	const requestTypeToken = normalizeToken(payload.requestType);
	const destinationTypeToken = normalizeToken(payload.destinationType);
	const callNumberToken = normalizeToken(payload.book?.callNumber);

	if (
		requestTypeToken === 'PURCHASE' ||
		destinationTypeToken === 'RECEPTION' ||
		seatToken.includes('RECEPTION') ||
		seatToken.includes('SERVICE')
	) {
		return 'purchase-reception';
	}

	if (seatToken.includes('DESKB') || seatToken.startsWith('B')) {
		return 'borrow-desk-b';
	}
	if (seatToken.includes('DESKA') || seatToken.startsWith('A')) {
		return 'borrow-desk-a';
	}

	if (callNumberToken.startsWith('COM')) {
		return 'purchase-reception';
	}
	if (
		callNumberToken.startsWith('LIB') ||
		callNumberToken.startsWith('CSA') ||
		callNumberToken.startsWith('CSA0')
	) {
		return 'borrow-desk-a';
	}

	console.warn(
		`[warn] Could not infer delivery mode from command payload requestId=${payload.requestId}; fallback=borrow-desk-a`,
	);
	return 'borrow-desk-a';
}

async function executeSimulation(
	client: MqttClient,
	input: {
		robotId: string;
		requestId: string;
		mode: Mode;
		speedMs: number;
		kind: SimulationKind;
	},
): Promise<void> {
	const statusTopic = `robot/${input.robotId}/status`;
	const poseTopic = `robot/${input.robotId}/pose`;
	const route = MODE_NODE_ROUTES[input.mode];
	const toShelfPath = buildPosePathFromNodeRoute(route.toShelf);
	const toDestinationPath = buildPosePathFromNodeRoute(route.toDestination);
	const returnToDockPath = buildPosePathFromNodeRoute(
		MODE_RETURN_NODE_ROUTES[input.mode],
	);

	const totalPoints =
		input.kind === 'return'
			? Math.max(returnToDockPath.length, 1)
			: toShelfPath.length + toDestinationPath.length + 2;
	let sentPoints = 0;

	const publishStatus = async (state: string, message: string, battery: number) => {
		const payload = {
			robotId: input.robotId,
			requestId: input.requestId,
			state,
			message,
			battery,
			timestamp: new Date().toISOString(),
		};
		await publish(client, statusTopic, payload);
		console.log(`[status] requestId=${input.requestId} state=${state} battery=${battery}`);
	};

	const publishPose = async (point: PosePoint) => {
		sentPoints += 1;
		const ratio = sentPoints / totalPoints;
		const battery = Math.max(
			DEFAULTS.batteryEnd,
			Math.round(
				DEFAULTS.batteryStart -
					(DEFAULTS.batteryStart - DEFAULTS.batteryEnd) * ratio,
			),
		);
		const payload = {
			robotId: input.robotId,
			requestId: input.requestId,
			floorId: DEFAULTS.floorId,
			x: Number(point.x.toFixed(6)),
			y: Number(point.y.toFixed(6)),
			theta: Number(point.theta.toFixed(6)),
			timestamp: new Date().toISOString(),
		};
		await publish(client, poseTopic, payload);
		console.log(
			`[pose] requestId=${input.requestId} x=${payload.x} y=${payload.y} theta=${payload.theta}`,
		);
		return battery;
	};

	let battery = DEFAULTS.batteryStart;
	if (input.kind === 'return') {
		await publishStatus(RequestStates.RETURNING, 'Returning to charging dock.', battery);
		for (const point of returnToDockPath) {
			battery = await publishPose(point);
			await delay(input.speedMs);
		}
		await publishStatus(RequestStates.DOCKING, 'Docking at charging station.', battery);
		await delay(input.speedMs);
		if (returnToDockPath.length > 0) {
			battery = await publishPose(returnToDockPath[returnToDockPath.length - 1]);
		}
		await publishStatus(RequestStates.IDLE, 'Robot parked at charging dock.', battery);
		return;
	}

	await publishStatus(RequestStates.NAVIGATING_TO_SHELF, 'Heading to shelf.', battery);
	for (const point of toShelfPath) {
		battery = await publishPose(point);
		await delay(input.speedMs);
	}

	await publishStatus(RequestStates.ARRIVED_AT_SHELF, 'Arrived at shelf.', battery);
	await delay(input.speedMs);

	await publishStatus(RequestStates.PICKING_UP, 'Picking up book.', battery);
	await delay(input.speedMs * 2);

	await publishStatus(RequestStates.DELIVERING, 'Delivering to destination.', battery);
	for (const point of toDestinationPath) {
		battery = await publishPose(point);
		await delay(input.speedMs);
	}

	await publishStatus(RequestStates.READY, 'Book is ready for pickup.', battery);
}

async function runOneShot(args: CliArgs): Promise<void> {
	if (!args.requestId) {
		throw new Error('requestId is required in one-shot mode.');
	}

	const client = await connectMqttClient(args.broker);
	let shuttingDown = false;

	const disconnect = (exitCode = 0) => {
		if (shuttingDown) return;
		shuttingDown = true;
		client.end(false, {}, () => {
			console.log('MQTT disconnected');
			process.exit(exitCode);
		});
	};

	process.on('SIGINT', () => {
		console.log('\nInterrupted. Stopping simulator...');
		disconnect(0);
	});

	try {
		const kind: SimulationKind = args.returnToDock ? 'return' : 'delivery';
		await executeSimulation(client, {
			robotId: args.robotId,
			requestId: args.requestId,
			mode: args.mode,
			speedMs: args.speedMs,
			kind,
		});
		console.log('Simulation complete');
		disconnect(0);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Simulation failed: ${message}`);
		disconnect(1);
	}
}

async function runListener(args: CliArgs): Promise<void> {
	const client = await connectMqttClient(args.broker);
	const commandTopic = `robot/${args.robotId}/command`;
	console.log(`[listener] subscribing to ${commandTopic}`);

	await new Promise<void>((resolve, reject) => {
		client.subscribe(commandTopic, (error?: Error) => {
			if (error) return reject(error);
			resolve();
		});
	});
	console.log(`[listener] ready for commands on ${commandTopic}`);

	let shuttingDown = false;
	let busy = false;
	let activeRequestId: string | null = null;
	let lastMode: Mode = args.mode;
	const modeByRequest = new Map<string, Mode>();
	let commandQueue: Promise<void> = Promise.resolve();

	const disconnect = (exitCode = 0) => {
		if (shuttingDown) return;
		shuttingDown = true;
		client.end(false, {}, () => {
			console.log('MQTT disconnected');
			process.exit(exitCode);
		});
	};

	process.on('SIGINT', () => {
		console.log('\nInterrupted. Stopping listener...');
		disconnect(0);
	});

	client.on('message', (topic: string, message: Buffer) => {
		if (topic !== commandTopic) return;
		commandQueue = commandQueue
			.then(async () => {
				let payload: unknown;
				try {
					payload = JSON.parse(message.toString());
				} catch {
					console.warn('[listener] ignored non-JSON command payload');
					return;
				}

				console.log(`[listener] command received: ${JSON.stringify(payload)}`);

				if (isDeliveryCommandPayload(payload)) {
					if (busy) {
						if (payload.requestId === activeRequestId) {
							console.log(`[listener] duplicate DELIVERY_TASK ignored for requestId=${payload.requestId}`);
						} else {
							console.log(`[listener] robot busy; DELIVERY_TASK ignored for requestId=${payload.requestId}`);
						}
						return;
					}

					busy = true;
					activeRequestId = payload.requestId;
					try {
						const mode = resolveModeFromDeliveryCommand(payload);
						lastMode = mode;
						modeByRequest.set(payload.requestId, mode);
						await executeSimulation(client, {
							robotId: args.robotId,
							requestId: payload.requestId,
							mode,
							speedMs: args.speedMs,
							kind: 'delivery',
						});
						console.log(`[listener] delivery simulation complete requestId=${payload.requestId}`);
					} catch (error) {
						const message = error instanceof Error ? error.message : String(error);
						console.error(`[listener] delivery simulation failed requestId=${payload.requestId}: ${message}`);
					} finally {
						busy = false;
						activeRequestId = null;
					}
					return;
				}

				if (isReturnToDockCommandPayload(payload)) {
					if (busy) {
						if (payload.requestId === activeRequestId) {
							console.log(`[listener] duplicate RETURN_TO_DOCK ignored for requestId=${payload.requestId}`);
						} else {
							console.log(`[listener] robot busy; RETURN_TO_DOCK ignored for requestId=${payload.requestId}`);
						}
						return;
					}

					busy = true;
					activeRequestId = payload.requestId;
					try {
						const mode = modeByRequest.get(payload.requestId) ?? lastMode;
						if (!modeByRequest.has(payload.requestId)) {
							console.warn(
								`[listener] RETURN_TO_DOCK mode unknown for requestId=${payload.requestId}; fallback=${mode}`,
							);
						}
						await executeSimulation(client, {
							robotId: args.robotId,
							requestId: payload.requestId,
							mode,
							speedMs: args.speedMs,
							kind: 'return',
						});
						console.log(`[listener] return-to-dock simulation complete requestId=${payload.requestId}`);
					} catch (error) {
						const message = error instanceof Error ? error.message : String(error);
						console.error(`[listener] return-to-dock simulation failed requestId=${payload.requestId}: ${message}`);
					} finally {
						busy = false;
						activeRequestId = null;
					}
					return;
				}

				console.warn('[listener] unsupported command type ignored');
			})
			.catch((error) => {
				const message = error instanceof Error ? error.message : String(error);
				console.error(`[listener] command handling error: ${message}`);
			});
	});
}

const args = parseArgs(process.argv.slice(2));
const runner = args.listen ? runListener(args) : runOneShot(args);

runner.catch((error) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`MQTT connection failure: ${message}`);
	process.exit(1);
});
