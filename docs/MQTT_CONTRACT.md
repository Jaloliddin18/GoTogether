# MQTT Contract

## Purpose
Defines backend-robot communication contract for Smart Library delivery.

## Topics
- `robot/{robotId}/command`
- `robot/{robotId}/cancel`
- `robot/{robotId}/status`
- `robot/{robotId}/pose`
- `robot/{robotId}/event`

## Command Payload Example
```json
{
  "type": "DELIVERY_TASK",
  "requestId": "request_id_here",
  "book": {
    "bookId": "book_id_here",
    "title": "Introduction to Algorithms",
    "callNumber": "QA76.6 .I58 2022"
  },
  "pickup": {
    "floorId": "floor_1",
    "x": 4.25,
    "y": 2.8,
    "theta": 1.57,
    "mastHeightCm": 72,
    "forkDepthCm": 12
  },
  "dropoff": {
    "seatId": "A12",
    "x": 8.4,
    "y": 3.2,
    "theta": 0
  }
}
```

## Status Payload Example
```json
{
  "robotId": "robot_01",
  "requestId": "request_id_here",
  "state": "NAVIGATING_TO_SHELF",
  "message": "Moving to shelf B3",
  "battery": 84,
  "timestamp": "2026-05-01T00:00:00.000Z"
}
```

## Pose Payload Example
```json
{
  "robotId": "robot_01",
  "requestId": "request_id_here",
  "floorId": "floor_1",
  "x": 3.7,
  "y": 2.4,
  "theta": 1.2,
  "timestamp": "2026-05-01T00:00:00.000Z"
}
```

## Rules
- Validate incoming MQTT payloads.
- Do not trust robot payload blindly.
- Update MongoDB after valid telemetry.
- Emit WebSocket events after MongoDB update.
- Use fake robot simulator before connecting real ROS 2.

