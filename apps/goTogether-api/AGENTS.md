# goTogether-api Agent Guide

## Purpose
Specific instructions for the main NestJS API app.

## Scope
- This folder contains the main API app.
- Follow existing component/module/service/resolver/schema style.
- Add Smart Library modules under `src/components`.
- Add schemas under `src/schemas`.
- Add MQTT infrastructure under `src/robot-comm`.
- Add dedicated robot gateway under `src/socket/robot.gateway.ts`.
- Do not modify `apps/goTogether-batch` unless explicitly asked.
- Do not touch auth unless adding staff/student role support.

## Communication Boundaries
- Use GraphQL for app data.
- Use WebSocket for live tracking.
- Use MQTT for backend-to-robot communication.

## New Smart Library Modules

### Book Module
Fields:
- `title`
- `author`
- `isbn`
- `callNumber`
- `category`
- `description`
- `available`
- `bookStatus`
- `shelf.section`
- `shelf.row`
- `shelf.level`
- `location.floorId`
- `location.x`
- `location.y`
- `location.theta`
- `pickup.gripperOpenWidthCm`
- `pickup.gripperCloseWidthCm`
- `pickup.gripHoldSeconds`
- `pickup.pickupDirection`

BookStatus:
- `AVAILABLE`
- `RESERVED`
- `IN_DELIVERY`
- `BORROWED`
- `MISSING`

### Robot Module
Fields:
- `robotId`
- `name`
- `status`
- `battery`
- `isOnline`
- `lastSeenAt`
- `currentRequestId`
- `currentPose.floorId`
- `currentPose.x`
- `currentPose.y`
- `currentPose.theta`

RobotStatus:
- `OFFLINE`
- `IDLE`
- `ASSIGNED`
- `NAVIGATING`
- `VERIFYING_BOOK`
- `PICKING_UP`
- `DELIVERING`
- `RETURNING`
- `DOCKING`
- `ERROR`
- `MAINTENANCE`

### Request Module
Fields:
- `bookId`
- `robotId`
- `sessionId` or `memberId`
- `destination`
- `status`
- `timeline`
- `error`
- `createdAt`
- `updatedAt`

RequestStatus:
- `QUEUED`
- `ASSIGNED`
- `DISPATCHED`
- `NAVIGATING_TO_SHELF`
- `ARRIVED_AT_SHELF`
- `VERIFYING_BOOK`
- `BOOK_FOUND`
- `BOOK_NOT_FOUND`
- `PICKING_UP`
- `DELIVERING`
- `ARRIVED_AT_STUDENT`
- `READY`
- `COMPLETED`
- `FAILED`
- `CANCELLED`

---

## Session Update (2026-05-29) — App naming migration baseline

- App scope naming is now `goTogether-api`.
- Companion batch app naming is now `goTogether-batch`.
- Path references in docs/config/scripts were aligned to `apps/goTogether-api` and `apps/goTogether-batch`.
- Build verification after migration:
  - `npm run build` passed.
- Operational rule:
  - use `goTogether` naming for all future modules/scripts/paths; do not reintroduce legacy naming.

---

## Session Update (2026-05-19) — Command-driven simulator expectation

- `scripts/simulateRobotDelivery.ts` now supports persistent listener mode.
- Listener mode must subscribe to `robot/<robotId>/command` and execute robot movement from backend commands (`DELIVERY_TASK`, `RETURN_TO_DOCK`) without per-request manual trigger.
- Keep status payload key as `state` and continue continuous pose publishing to `robot/<robotId>/pose`.
- Ignore overlapping commands while a simulation is already running for safe demo behavior.

---

## Session Update (2026-05-25) — LostItem Phase 1 module baseline

- Added new smart-library module: `src/components/lost-item/`
  - `lost-item.module.ts`
  - `lost-item.resolver.ts`
  - `lost-item.service.ts`
- Added new schema: `src/schemas/LostItem.model.ts` with required patrol-detection fields, default `PENDING_REVIEW`, and query indexes.
- Added GraphQL contracts under `src/libs/dto/lost-item/`:
  - output: `LostItem`, `LostItems`
  - input: `LostItemsInquiry` (+ filters/status/objectType/priority/robotId/date-range/pagination)
  - update: `UpdateLostItemStatusInput`
- Added enums in `src/libs/enums/lost-item.enum.ts` and registered them for GraphQL.
- Added admin GraphQL operations:
  - `getLostItems(input)`
  - `updateLostItemStatus(input)`
- Added sort whitelist in `src/libs/config.ts`: `availableLostItemSorts`.
- Registered `LostItemModule` inside `src/components/components.module.ts`.

Operational boundary for this phase:
- Do not add MQTT lost-item subscription in this step.
- Do not add robot snapshot upload endpoint in this step.
- Keep request/robot delivery runtime flow unchanged.

---

## Session Update (2026-05-26) — LostItem Phase 2 MQTT listener baseline

- `src/robot-comm/mqtt.service.ts` now subscribes to wildcard patrol topic:
  - `robot/+/lost-item`
- MQTT incoming topic parser now supports:
  - `status`, `pose`, and `lost-item`
- Added safe lost-item ingestion flow:
  - JSON parse guard + payload shape guard
  - `eventType` must be `LOST_ITEM_DETECTED`
  - confidence validation (`0..1`) with malformed payload drop
  - object type/priority/status normalization + defaults
  - `robotId` mismatch rule: prefer topic robotId, warn on mismatch
  - `detectedAt` fallback to current Date when invalid
- Added LostItem creation method for internal MQTT use:
  - `LostItemService.createLostItemFromPatrolEvent(...)`
- `src/robot-comm/mqtt.module.ts` now imports `LostItemModule` for service injection.

Operational boundary for this phase:
- Preserve existing status/pose subscription and handling behavior.
- Do not add snapshot upload endpoint here.
- Do not add frontend/socket lost-item broadcast in this step.

---

## Session Update (2026-05-26) — LostItem Phase 3 snapshot upload baseline

- Added lost-item upload mutation under existing GraphQL upload flow:
  - `uploadLostItemSnapshot(file: Upload!): LostItemSnapshotUploadResult`
  - resolver file: `src/components/lost-item/lost-item.resolver.ts`
- Added new output contract:
  - `LostItemSnapshotUploadResult { snapshotPath, snapshotUrl }`
  - dto file: `src/libs/dto/lost-item/lost-item.ts`
- Added upload service implementation:
  - method: `LostItemService.uploadLostItemSnapshot(...)`
  - service file: `src/components/lost-item/lost-item.service.ts`
  - fixed storage folder: `uploads/lost-items/`
  - mime validation: png/jpg/jpeg only
  - size guard: `1_500_000` bytes
  - unique file naming with existing helper
  - returns relative path values (`uploads/lost-items/<filename>`).
- Guard/auth approach for this phase:
  - admin-only via existing `RolesGuard` + `MemberType.ADMIN`.
- Preserved boundaries:
  - no changes to generic member image uploader behavior
  - no changes to MQTT lost-item ingestion flow
  - no LostItem DB write from upload mutation (DB write stays MQTT event-driven).

Operational boundary for this phase:
- Keep upload target controlled (`uploads/lost-items` only).
- Keep current auth simple/safe (admin token required for now).
- Defer robot-specific auth mechanism and Python integration wiring to later phase.

---

## Session Update (2026-05-26) — READY timeline dedupe and stale telemetry guard

- Request delivery telemetry path now treats READY as a semantic milestone:
  - once READY exists in request timeline, later stale non-terminal delivery statuses are ignored
  - duplicate READY telemetry is ignored and logged
  - request timeline no longer appends READY more than once for the same request.
- Backend mutation guard was aligned:
  - manual/admin `updateRequestStatus` ignores duplicate READY updates
  - stale movement statuses after READY are rejected.
- Existing terminal behavior remains unchanged:
  - `COMPLETED`, `FAILED`, `CANCELLED` guard logic preserved.
- Scope preserved for this fix:
  - no frontend changes
  - no Python vision module changes
  - no LostItem module/runtime changes.
- Verification:
  - `npm run build` passed.

---

## Session Update (2026-05-28) — LostItem YOLO multi-class normalization update

- Updated `src/robot-comm/mqtt.service.ts` lost-item normalization for new detection labels.
- Object type mapping now explicitly supports:
  - `watch`/`WATCH` -> `WATCH`
  - `airpods`/`AIRPODS` -> `AIRPODS`
  - `airpod` -> `AIRPODS`
  - `airpods_case` -> `AIRPODS`
- Existing mappings preserved (`id_card`, `phone`, `wallet`, `bottle`).
- Priority fallback defaults are now:
  - `ID_CARD`, `PHONE`, `WALLET` => `HIGH`
  - `WATCH`, `AIRPODS`, `BOOK` => `MEDIUM`
  - `BOTTLE`, `UNKNOWN` => `LOW`
- Enum compatibility confirmed:
  - `src/libs/enums/lost-item.enum.ts` already contains `WATCH` and `AIRPODS`
  - GraphQL enum registration remains unchanged.

Operational boundary for this update:
- No schema changes.
- No new GraphQL operations.
- No upload flow changes.
- No frontend/Python/request-flow changes outside lost-item normalization.

Verification:
- `npm run build` passed.

---

## Session Update (2026-05-28) — MQTT startup telemetry subscriptions for demo tracking

- Updated `src/robot-comm/mqtt.service.ts` MQTT connect flow to subscribe at startup:
  - `robot/+/status`
  - `robot/+/pose`
  - `robot/+/lost-item`
- Added duplicate-subscription guard for topic filters:
  - tracks subscribed and pending topic filters
  - skips repeated subscribe calls for the same filter.
- Kept per-robot subscribe flow (`subscribeToRobotTopics(robotId)`) as fallback:
  - now safely no-ops when global telemetry wildcard subscriptions are already active.
- Preserved runtime handling boundaries:
  - no request-status mapping logic changes
  - existing robot/request validation and malformed payload drop behavior unchanged.

Operational note:
- Demo/manual publish to `robot/robot_01/status` now works immediately after backend startup without needing prior request-driven per-robot subscription.

Verification:
- `npm run build` passed.
