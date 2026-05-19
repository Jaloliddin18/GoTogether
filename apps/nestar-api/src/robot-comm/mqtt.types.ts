export interface MqttDeliveryCommandPayload {
	type: 'DELIVERY_TASK';
	requestId: string;
	book: {
		bookId: string;
		title: string;
		callNumber: string;
	};
	pickup: {
		floorId: string;
		x: number;
		y: number;
		theta: number;
		gripperOpenWidthCm: number;
		gripperCloseWidthCm: number;
		gripHoldSeconds: number;
		pickupDirection: string;
	};
	dropoff: {
		seatId: string;
		x: number;
		y: number;
		theta: number;
	};
}

export interface MqttReturnToDockCommandPayload {
	type: 'RETURN_TO_DOCK';
	requestId: string;
	dock: {
		floorId: string;
		x: number;
		y: number;
		theta: number;
	};
}

export type MqttCommandPayload =
	| MqttDeliveryCommandPayload
	| MqttReturnToDockCommandPayload;

export interface MqttCancelCommandPayload {
	type: 'CANCEL_TASK';
	requestId: string;
}

export interface MqttStatusPayload {
	robotId: string;
	requestId: string;
	state: string;
	message: string;
	battery: number;
	timestamp: string;
}

export interface MqttPosePayload {
	robotId: string;
	requestId: string;
	floorId: string;
	x: number;
	y: number;
	theta: number;
	timestamp: string;
}
