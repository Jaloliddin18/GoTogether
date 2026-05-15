# Backend Progress Context

## 1. Project direction
- This backend is now for 같이Go Smart Library/bookstore robot delivery.
- BORROW flow: library inventory to student desk.
- PURCHASE flow: commercial inventory to reception.

## 2. Current backend domain model
- Book = catalog/product metadata.
- BookInventory = physical stock source + pickup configuration.
- Robot = runtime robot state and pose.
- Request = borrow/purchase delivery lifecycle.

## 3. Completed implementation

### 3.1 BookInventory fixed gripper refactor
- Removed old pickup fields:
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
- Pickup mechanism model:
  - no fork lift
  - no moving arm
  - fixed gripper open/close only
  - robot body drives to pickup coordinate
  - `pickupDirection` describes robot alignment direction
  - demo uses one floor, but `floorId` remains in `bookLocation`

### 3.2 Request hardening fixes
- `cancelRequest` blocks terminal statuses:
  - `COMPLETED`
  - `FAILED`
  - `CANCELLED`
- `updateRequestStatus` prevents terminal-state re-entry.
- `createDeliveryRequest` validates `book.bookCallNumber` before inventory reservation because MQTT command payload requires `callNumber`.

### 3.3 Phase 4 complete (MQTT module)
- Added:
  - `apps/nestar-api/src/robot-comm/mqtt.types.ts`
  - `apps/nestar-api/src/robot-comm/mqtt.service.ts`
  - `apps/nestar-api/src/robot-comm/mqtt.module.ts`
- Registered `MqttRobotModule` in `AppModule`.
- Added `mqtt` dependency.
- `MQTT_BROKER_URL` controls broker connection.
- Missing `MQTT_BROKER_URL` logs warning and disables robot communication without crashing.
- Command publish topic:
  - `robot/{robotId}/command`
- Subscribed telemetry topics:
  - `robot/{robotId}/status`
  - `robot/{robotId}/pose`

### 3.4 Phase 5 complete (RobotGateway)
- Added dedicated robot gateway:
  - `apps/nestar-api/src/socket/robot.gateway.ts`
- Registered `RobotGateway` in `SocketModule`.
- Robot gateway is separated from existing chat/general `SocketGateway`.
- Project WebSocket adapter is plain `ws` (not Socket.IO).
- Runtime adapter mismatch fixed:
  - removed Socket.IO room assumptions
  - no `server.to(...)`
  - no `client.join(...)`
  - manual room mapping via `Map<string, Set<WebSocket>>`
- Request room format:
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

### 3.5 Phase 6 complete (MQTT telemetry integration)
- Main files:
  - `apps/nestar-api/src/robot-comm/mqtt.service.ts`
  - `apps/nestar-api/src/robot-comm/mqtt.module.ts`
- Pose telemetry updates:
  - `Robot.currentPose`
  - `Robot.lastSeenAt`
  - `Robot.isOnline`
- Status telemetry updates:
  - `Robot.status` when mapped
  - `Robot.battery`
  - `Robot.lastSeenAt`
  - `Robot.isOnline`
  - active `Request.status` when mapped
  - `Request.timeline`
- Emits request-scoped WebSocket events to `request:{requestId}`.
- 30-second robot offline timeout implemented:
  - in-progress request fails if robot stops sending telemetry
  - robot marked offline
  - request set to `FAILED`
  - inventory reservation released
  - `robotOffline`/`requestUpdated` emitted
- READY behavior finalized:
  - `Request.status` remains `READY`
  - offline timeout cleared on `READY`
  - `Robot.status` becomes `IDLE`
  - `Robot.currentRequestId` becomes `null`
  - `Robot.isOnline` remains `true`
  - request is not converted to `COMPLETED`
  - inventory is not released on `READY`
- Duplicate telemetry hardening:
  - duplicate same-status telemetry does not append duplicate timeline entries
  - stale statuses after `READY` are ignored
  - late `BOOK_NOT_FOUND` after `READY` is ignored

### 3.6 Twit read API + member data hardening (2026-05-15)
- Scope:
  - `getTwits`
  - `getTwit`
  - `getMemberTwits`
- Auth behavior update:
  - these read APIs are now usable by not-logged-in users through `WithoutGuard`
  - `getTwits` no longer switches into auth-follow feed filtering
  - `getTwits` now returns general twits from DB (`deletedAt: null`) and still supports optional `search.memberId` and `search.text`
- Member GraphQL null-safety fix:
  - Twit aggregates now normalize missing member counter fields to `0` before returning `memberData`
  - fixed runtime error:
    - `Cannot return null for non-nullable field Member.memberTwits`
- Twit module cleanup:
  - removed unused `Follow` model injection from Twit module/service after `getTwits` feed-filter removal
- One-time DB maintenance executed:
  - added script:
    - `apps/nestar-api/src/scripts/backfill-member-counters.ts`
  - added npm command:
    - `npm run backfill:member-counters`
  - execution result on 2026-05-15:
    - `matched=7`
    - `modified=2`
- Startup guardrail added (non-mutating):
  - new `MemberHealthCheckService` runs on backend startup
  - checks all member counter fields for malformed/non-numeric values
  - logs pass/warn summary and samples (max 10) without changing DB data

## 4. Build verification
- `npm run build` passes after Phase 4/5/6 implementation and follow-up fixes.

## 5. Completed runtime tests (confirmed)
- Local MQTT broker connection works.
- Backend subscribed to:
  - `robot/robot_01/status`
  - `robot/robot_01/pose`
- MQTT status messages were received and parsed successfully.
- Normal BORROW telemetry flow validated:
  - `ASSIGNED`
  - `NAVIGATING_TO_SHELF`
  - `ARRIVED_AT_SHELF`
  - `VERIFYING_BOOK`
  - `BOOK_FOUND`
  - `PICKING_UP`
  - `DELIVERING`
  - `ARRIVED_AT_STUDENT`
  - `READY`
- `Request.status` reached `READY`.
- `Request.timeline` sequence remained stable without duplicate `READY` entries after fix.
- `READY` remained `READY` after waiting more than 35 seconds.
- Robot released correctly after `READY`:
  - `Robot.status = IDLE`
  - `Robot.currentRequestId = null`
  - `Robot.isOnline = true`
- Pose telemetry path confirmed and `Robot.currentPose` update verified.
- WebSocket adapter mismatch was fixed (`server.to is not a function` removed by plain-ws room mapping).
- `BOOK_NOT_FOUND` flow validated:
  - request becomes `FAILED`
  - `Request.error` is set
  - robot is released
  - inventory reservation is released
- Offline timeout before `READY` validated:
  - in-progress request becomes `FAILED` if robot stops sending telemetry
  - robot is released
  - robot is marked offline
  - inventory reservation is released

## 6. Remaining runtime tests
- WebSocket client verification:
  - client joins `joinRequest`
  - client receives `robotPosition`, `robotStatus`, `requestUpdated`, `deliveryReady`

## 7. Next project steps
1. Finish remaining runtime tests:
- WebSocket client `joinRequest` + event reception
2. Move to Phase 7:
- staff/admin dashboard operations
3. Later:
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
