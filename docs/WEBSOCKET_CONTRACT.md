# WebSocket Contract

## Purpose
Live robot tracking should use a dedicated robot WebSocket gateway.

Do not mix robot tracking with the existing general socket gateway.

Expected gateway location:
apps/nestar-api/src/socket/robot.gateway.ts

## Room model

Clients tracking a request should join:

request:{requestId}

Only emit request-specific robot updates to that room.

## Client events

### joinRequest

Payload:

```json
{
  "requestId": "request_id_here"
}
```

Meaning:
The frontend joins the room for a specific delivery request.

## Server events

### robotPosition

Payload:

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

### robotStatus

Payload:

```json
{
  "robotId": "robot_01",
  "requestId": "request_id_here",
  "status": "NAVIGATING_TO_SHELF",
  "message": "Moving to shelf B3",
  "battery": 84,
  "timestamp": "2026-05-01T00:00:00.000Z"
}
```

### requestUpdated

Payload:

```json
{
  "requestId": "request_id_here",
  "status": "DELIVERING",
  "message": "Robot is delivering your book.",
  "timestamp": "2026-05-01T00:00:00.000Z"
}
```

### robotOffline

Payload:

```json
{
  "robotId": "robot_01",
  "requestId": "request_id_here",
  "message": "Robot connection lost.",
  "timestamp": "2026-05-01T00:00:00.000Z"
}
```

### bookNotFound

Payload:

```json
{
  "requestId": "request_id_here",
  "bookId": "book_id_here",
  "message": "Book could not be found on the shelf.",
  "timestamp": "2026-05-01T00:00:00.000Z"
}
```

### deliveryReady

Payload:

```json
{
  "requestId": "request_id_here",
  "message": "Your book is ready.",
  "timestamp": "2026-05-01T00:00:00.000Z"
}
```

## Rules

- WebSocket emits should happen after MongoDB updates when possible.
- Do not broadcast all robot updates to all users.
- Use request-specific rooms.
- Keep event names stable because frontend will depend on them.
- Do not implement frontend code in this backend repo.
