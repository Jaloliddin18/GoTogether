# 같이Go Backend — Session Memory

## Last Updated
2026-05-21

## Current Branch
develop

## Session Update (2026-05-21)

### Completed
- Added Groq-powered REST chatbot backend under `apps/nestar-api/src/components/chat/`.
- New endpoint: `POST /chat/message`.
- Registered `ChatModule` in `ComponentsModule`.
- Removed the old general `SocketGateway` provider from `SocketModule`; `RobotGateway` remains registered and untouched.
- `ChatService` reads `process.env.GROQ_API_KEY` and sends Groq requests with `Authorization: Bearer <key>`.
- Groq model: `llama-3.3-70b-versatile`.
- Chat retrieval now uses live MongoDB `Book` data rather than static examples.
- Retrieval is query-aware:
  - detects borrow/purchase intent
  - matches category, type, format, language, and audience enums
  - searches title, author, ISBN, call number, and description
  - scores/ranks candidate books
  - fetches a detail-style top match for availability/detail/ISBN/call-number/price/rating questions
- `/chat/message` returns structured response shape:
  - `reply: string`
  - `books: ChatBookSuggestion[]`
- `ChatBookSuggestion` includes `bookId`, `title`, `author`, `image`, `category`, `callNumber`, `isBorrowable`, and `isPurchasable`.

### Verification
- Backend build passed with `npm run build`.
- Frontend build also passed from the frontend repo with `yarn build`.

### Key rules from this session
- Backend build command is `npm run build`, not yarn.
- Keep Groq access backend-only; never expose `GROQ_API_KEY` to the frontend.
- Keep chatbot catalog answers grounded in DB retrieval context.
- Do not use the old general socket chat for chatbot work.
- Do not touch `apps/nestar-api/src/socket/robot.gateway.ts` for chatbot work.

### Current stopping point
- Backend chatbot module and structured book suggestion API are implemented and build cleanly.
- Live runtime QA still needed with MongoDB, backend `.env`, valid `GROQ_API_KEY`, and frontend chatbot UI.

---

## Session Update (2026-05-20)

### Completed
- Raised twit text character limit from 280 to 500 across all three enforcement points:
  - `apps/nestar-api/src/libs/dto/twit/twit.input.ts` — `@Length(1, 500)`
  - `apps/nestar-api/src/components/twit/twit.service.ts` — service guard `text.length > 500`
  - `apps/nestar-api/src/schemas/Twit.model.ts` — Mongoose `maxlength: 500`
- Commit: `6b20d45`

---

## Session Update (2026-05-19)

### Completed
- Frontend realtime completion gap was traced to backend + simulator behavior and closed with lifecycle-safe telemetry updates.
- `updateRequestStatus(COMPLETED)` flow now supports automatic post-completion lifecycle:
  - release robot from completed request
  - auto-assign next queued request when available
  - when no queued request exists, transition robot to `RETURNING` and publish `RETURN_TO_DOCK`.
- MQTT request resolution now supports post-completion telemetry continuity for the same request room (windowed), so frontend can track return movement without manual refresh.
- Added terminal-status guardrails so terminal request state is not downgraded by later non-terminal telemetry.
- Extended MQTT command contracts to include `RETURN_TO_DOCK`.
- Reworked `scripts/simulateRobotDelivery.ts` into dual mode:
  - one-shot/manual mode retained
  - persistent listener mode added (`--listen=true`) subscribing to `robot/<robotId>/command`
  - supports `DELIVERY_TASK` and `RETURN_TO_DOCK`
  - mode inference from command payload with safe fallbacks
  - ignores duplicates / busy overlap and keeps continuous pose + `state` status publishing.

### Verification
- Backend build passed (`npm run build`) after lifecycle and simulator listener changes.

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
