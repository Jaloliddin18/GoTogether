# Backend Progress Context

## 1. Project direction
- This project is now a Smart Library/bookstore robot delivery backend (not real-estate/Nestar Property).
- Students can BORROW library books to desk delivery.
- Students can PURCHASE commercial books to reception pickup.

## 2. Current backend domain model
- Book = catalog/product data.
- BookInventory = physical stock + pickup location/mechanism.
- Robot = robot identity/state/pose.
- Request = borrow/purchase delivery task.

## 3. Completed implementation

### 3.1 BookInventory pickup refactor (fixed gripper)
- Removed old pickup fields:
  - `mastHeightCm`
  - `forkDepthCm`
  - `gripWidthCm`
  - `requiresContainer`
  - `containerId`
- Added fixed-gripper fields:
  - `gripperOpenWidthCm`
  - `gripperCloseWidthCm`
  - `gripHoldSeconds`
  - `pickupDirection`
- Robot pickup model is fixed gripper only:
  - no fork lift
  - no moving arm
  - gripper open/close only
  - robot base drives to pickup coordinate and aligns by `pickupDirection`
- Demo uses one floor, but `floorId` remains in `bookLocation` for multi-floor compatibility.

### 3.2 Request hardening fixes
- `cancelRequest` now blocks terminal requests:
  - `COMPLETED`
  - `FAILED`
  - `CANCELLED`
- `updateRequestStatus` guards terminal requests from duplicate updates.
- `createDeliveryRequest` validates `book.bookCallNumber` before inventory reservation because MQTT command payload requires `callNumber`.

### 3.3 Phase 4 complete — MQTT robot communication module
- Added:
  - `apps/nestar-api/src/robot-comm/mqtt.types.ts`
  - `apps/nestar-api/src/robot-comm/mqtt.service.ts`
  - `apps/nestar-api/src/robot-comm/mqtt.module.ts`
- Registered `MqttRobotModule` in `AppModule`.
- Added `mqtt` dependency.
- `MQTT_BROKER_URL` controls broker connection.
- Missing `MQTT_BROKER_URL` logs warning and disables robot comm safely (no app crash).
- MQTT publish topic:
  - `robot/{robotId}/command`
- MQTT subscribe topics:
  - `robot/{robotId}/status`
  - `robot/{robotId}/pose`

### 3.4 Phase 5 complete — dedicated robot gateway
- Added gateway file:
  - `apps/nestar-api/src/socket/robot.gateway.ts`
- Registered `RobotGateway` in `SocketModule`.
- Kept robot gateway separate from existing general/chat `SocketGateway`.
- This backend uses plain `ws` adapter (not Socket.IO).
- Robot gateway uses manual request-scoped room mapping:
  - `request:{requestId}`
- Client event:
  - `joinRequest`
- Server events:
  - `robotPosition`
  - `robotStatus`
  - `requestUpdated`
  - `robotOffline`
  - `bookNotFound`
  - `deliveryReady`

### 3.5 Phase 6 complete — MQTT telemetry to MongoDB + WebSocket
- Scope:
  - `apps/nestar-api/src/robot-comm/mqtt.service.ts`
  - `apps/nestar-api/src/robot-comm/mqtt.module.ts`
- Pose telemetry updates:
  - `Robot.currentPose`
  - `Robot.lastSeenAt`
  - `Robot.isOnline`
- Status telemetry updates:
  - `Robot.status` when state maps to `RobotStatus`
  - `Robot.battery`
  - `Robot.lastSeenAt`
  - `Robot.isOnline`
  - active `Request.status` when state maps to `RequestStatus`
  - `Request.timeline`
- WebSocket emissions are request-scoped (`request:{requestId}`).
- `BOOK_NOT_FOUND` handling:
  - request marked `FAILED`
  - request error set
  - robot released to `IDLE`
  - inventory reservation released
  - `bookNotFound` + `requestUpdated` emitted
- `READY` handling:
  - `deliveryReady` emitted
- Offline timeout handling:
  - 30s timeout after last valid telemetry
  - robot marked offline
  - request marked `FAILED`
  - inventory reservation released
  - `robotOffline` + `requestUpdated` emitted

### 3.6 Runtime fix complete
- Fixed runtime error:
  - `server.to is not a function`
- Root cause:
  - Socket.IO room API was used while project runs with plain `ws` adapter.
- Fix:
  - `RobotGateway` now manually tracks request clients using `Map<string, Set<WebSocket>>`.
  - Existing general/chat `SocketGateway` was not changed.

## 4. Build status
- `npm run build` passes after Phase 4/5/6 implementation and runtime fix.

## 5. Runtime testing status
- Confirmed so far:
  - MQTT broker connection works when local broker is running.
  - MQTT subscription confirmed for `robot_01`:
    - `robot/robot_01/status`
    - `robot/robot_01/pose`
  - MQTT status message was received and parsed.
  - WebSocket adapter mismatch was identified and fixed.
- Not overclaimed: full telemetry-to-request lifecycle runtime validation is still in progress.

## 6. Next runtime tests (Phase 4–6 validation)
- Resend MQTT status and confirm no `server.to` error.
- Verify `Request` timeline/status updates.
- Verify `Robot` pose/status updates.
- Verify `BOOK_NOT_FOUND` flow end-to-end.
- Verify offline timeout flow.
- Verify WebSocket client `joinRequest` behavior.

## 7. Next project steps
- Finish Phase 4–6 runtime verification listed above.
- Then move to Phase 7: staff/admin dashboard operations.
- Later product/demo steps:
  - richer demo data
  - frontend book list/detail
  - borrow/purchase buttons
  - request status/history
  - robot tracking UI
  - community Twit feed/profile/comments

## 8. Current important IDs from test data
- Book ID: `69f662844d9e6330d4a5faa9`
- LIBRARY inventory ID: `69f664874d9e6330d4a5faae`
- COMMERCIAL inventory ID: `69f664b04d9e6330d4a5fab2`
- Robot ID: `69f6670e997c6e5d143bd0d5`
- robotId string: `robot_01`

## 9. Commit message rule
- Only use `feat:` or `fix:`.
- Do not use `docs:`, `refactor:`, `chore:`, `test:`, or other prefixes.
