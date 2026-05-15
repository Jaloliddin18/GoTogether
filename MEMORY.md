# 같이Go Backend — Session Memory

## Last Updated
2026-05-15

## Current Branch
develop

## Implementation Snapshot

### Twit read API and member counter hardening (2026-05-15)
- `getTwits`, `getTwit`, and `getMemberTwits` are available through `WithoutGuard` for guest access.
- `getTwits` no longer applies logged-in follow-feed filtering.
  - current behavior returns global twit list (`deletedAt: null`) with optional `search.memberId` and `search.text`.
- Twit `memberData` null-safety fix added in aggregation:
  - member numeric counters are normalized with `$ifNull` fallback to `0`.
  - prevents GraphQL crash:
    - `Cannot return null for non-nullable field Member.memberTwits.`
- Twit module/service cleanup:
  - removed `Follow` model dependency from Twit path after feed-filter removal.
- One-time DB script added and executed:
  - `npm run backfill:member-counters`
  - result: `matched=7`, `modified=2`
- Startup health check added:
  - `MemberHealthCheckService` runs on module init.
  - reports malformed member counter fields (sample limit 10) without writing to DB.

### Twit click-based view tracking (2026-05-15)
- `getTwit` now applies view tracking directly (no separate increment mutation API).
- Uses existing `ViewService.recordView` pattern, aligned with existing Book + View flow (`BookService` + `ViewGroup.BOOK`) as reference.
- Added `TWIT` in `ViewGroup` enum.
- Added `viewCount` field to Twit schema/model and GraphQL DTO.
- Added `$ifNull` normalization for `viewCount` in Twit aggregate pipelines to protect older docs with missing values.
- Wired `ViewModule` into `TwitModule`.

### Twit like-system migration to centralized Like collection (2026-05-15)
- Twit likes migrated from embedded array to centralized `Like` collection.
- Added `LikeGroup.TWIT` to `LikeGroup` enum.
- Wired `LikeModule` into `TwitModule`.
- `likeTwit` now uses `LikeService.toggleLike` pattern (same as Book), then updates `likeCount` with modifier.
- `meLiked` is computed via `lookupAuthMemberLiked` in `getTwit` and `getTwits` aggregates.
- Removed `likes: ObjectId[]` from Twit schema.

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
- `BOOK_NOT_FOUND` flow verified:
  - request `FAILED`
  - request error set
  - robot released
  - inventory reservation released
- Offline timeout before `READY` verified:
  - in-progress request becomes `FAILED` if robot stops sending telemetry
  - robot released
  - robot marked offline
  - inventory reservation released

### Remaining runtime tests
- WebSocket client verification:
  - client joins with `joinRequest`
  - receives `robotPosition`, `robotStatus`, `requestUpdated`, `deliveryReady`

## Next Steps
1. Finish remaining WebSocket client runtime test above.
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
