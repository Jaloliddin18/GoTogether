# 같이Go Backend — Session Memory

## Last Updated
2026-05-08

## Current Branch
develop

## Implementation Snapshot

### BookInventory pickup model (fixed gripper)
- Removed old fork/container fields:
  - `mastHeightCm`
  - `forkDepthCm`
  - `gripWidthCm`
  - `requiresContainer`
  - `containerId`
- Current `bookPickup` fields:
  - `gripperOpenWidthCm`
  - `gripperCloseWidthCm`
  - `gripHoldSeconds`
  - `pickupDirection`
- Mechanism model:
  - no fork lift
  - no moving arm
  - fixed gripper open/close only
  - robot body drives to pickup coordinate
  - `pickupDirection` = alignment direction
  - one-floor demo currently, with `floorId` still preserved in schema

### Request hardening (completed)
- `cancelRequest` blocks terminal statuses: `COMPLETED`, `FAILED`, `CANCELLED`
- `updateRequestStatus` prevents terminal-state re-entry
- `createDeliveryRequest` validates `bookCallNumber` before inventory reservation (MQTT command requires `callNumber`)

### Phase 4 complete
- MQTT module implemented:
  - `apps/nestar-api/src/robot-comm/mqtt.types.ts`
  - `apps/nestar-api/src/robot-comm/mqtt.service.ts`
  - `apps/nestar-api/src/robot-comm/mqtt.module.ts`
- `MqttRobotModule` registered in `AppModule`
- `mqtt` dependency added
- `MQTT_BROKER_URL` missing case logs warning and disables MQTT flow safely
- publish: `robot/{robotId}/command`
- subscribe: `robot/{robotId}/status`, `robot/{robotId}/pose`

### Phase 5 complete
- Dedicated `RobotGateway` added and registered in `SocketModule`
- Separated from existing chat/general `SocketGateway`
- Project uses plain `ws` adapter
- Runtime fix completed:
  - removed Socket.IO assumptions (`server.to`, `client.join`)
  - manual request room mapping via `Map<string, Set<WebSocket>>`
- Room format: `request:{requestId}`
- Client event: `joinRequest`
- Server events: `robotPosition`, `robotStatus`, `requestUpdated`, `robotOffline`, `bookNotFound`, `deliveryReady`

### Phase 6 complete
- MQTT telemetry wired into MongoDB updates + RobotGateway emissions
- Pose telemetry updates:
  - `Robot.currentPose`
  - `Robot.lastSeenAt`
  - `Robot.isOnline`
- Status telemetry updates:
  - mapped `Robot.status`
  - `Robot.battery`
  - `Robot.lastSeenAt`
  - `Robot.isOnline`
  - mapped active `Request.status`
  - `Request.timeline`
- 30-second offline timeout implemented for in-progress requests
- `BOOK_NOT_FOUND` flow implemented:
  - request `FAILED`
  - request error set
  - robot released
  - inventory reservation released
  - `bookNotFound` + `requestUpdated` emitted
- READY handling finalized:
  - request remains `READY`
  - offline timeout cleared
  - robot released to `IDLE`
  - `currentRequestId` cleared
  - `isOnline` remains `true`
  - no inventory release on `READY`
  - no forced conversion to `COMPLETED`
- Duplicate telemetry handling:
  - duplicate same-status telemetry does not append duplicate timeline items
  - stale statuses after `READY` ignored
  - late `BOOK_NOT_FOUND` after `READY` ignored

## Build State
- `npm run build` passes after Phase 4/5/6 implementation and telemetry/runtime fixes.

## Runtime Verification

### Confirmed runtime tests
- Local MQTT broker connection works.
- Backend subscribed to:
  - `robot/robot_01/status`
  - `robot/robot_01/pose`
- MQTT status messages received and parsed.
- BORROW telemetry sequence validated:
  - `ASSIGNED`
  - `NAVIGATING_TO_SHELF`
  - `ARRIVED_AT_SHELF`
  - `VERIFYING_BOOK`
  - `BOOK_FOUND`
  - `PICKING_UP`
  - `DELIVERING`
  - `ARRIVED_AT_STUDENT`
  - `READY`
- Request reached `READY`.
- Timeline did not duplicate `READY` after duplicate-fix changes.
- `READY` stayed `READY` after waiting >35 seconds.
- Robot release on READY verified:
  - `status = IDLE`
  - `currentRequestId = null`
  - `isOnline = true`
- Pose telemetry path verified (`Robot.currentPose` updates).
- `server.to is not a function` adapter mismatch fixed.

### Remaining runtime tests
- Final `BOOK_NOT_FOUND` verification:
  - request `FAILED`
  - request error set
  - robot released
  - inventory reservation released
- Final offline-timeout verification after latest fixes:
  - in-progress request fails only when robot stops before `READY`
  - `READY` request does not fail
- WebSocket client verification:
  - client joins with `joinRequest`
  - receives `robotPosition`, `robotStatus`, `requestUpdated`, `deliveryReady`

## Next Steps
1. Finish remaining runtime tests above.
2. Move to Phase 7 staff/admin dashboard operations.
3. Continue later product/demo work:
- richer demo data
- frontend book list/detail
- borrow/purchase buttons
- request status/history
- robot tracking UI
- community Twit feed/profile/comments

## Current IDs
- Book ID: `69f662844d9e6330d4a5faa9`
- LIBRARY inventory ID: `69f664874d9e6330d4a5faae`
- COMMERCIAL inventory ID: `69f664b04d9e6330d4a5fab2`
- Robot ID: `69f6670e997c6e5d143bd0d5`
- robotId string: `robot_01`
