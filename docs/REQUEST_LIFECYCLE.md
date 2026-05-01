# Request Lifecycle

## Purpose
Defines Smart Library request status flow and failure handling.

## Normal Flow
```text
QUEUED
→ ASSIGNED
→ DISPATCHED
→ NAVIGATING_TO_SHELF
→ ARRIVED_AT_SHELF
→ VERIFYING_BOOK
→ BOOK_FOUND
→ PICKING_UP
→ DELIVERING
→ ARRIVED_AT_STUDENT
→ READY
→ COMPLETED
```

## Failure Flows
- `BOOK_NOT_FOUND` → `FAILED`
- `ROBOT_OFFLINE` → `FAILED`
- `NAVIGATION_FAILED` → `FAILED`
- `PICKUP_FAILED` → `FAILED`
- `USER_CANCELLED` → `CANCELLED`

## Data and Event Rules
- Every status change should be appended to `timeline`.
- Current status should be stored directly on request (`status`).
- Request lifecycle should be updated from backend logic and MQTT telemetry.
- Frontend should receive `requestUpdated` events through WebSocket.

