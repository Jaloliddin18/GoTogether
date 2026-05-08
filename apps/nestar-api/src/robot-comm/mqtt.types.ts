export interface MqttCommandPayload {
	type: string;
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
