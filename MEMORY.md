# 같이Go Backend — Session Memory

## Last Updated
2026-05-26

## Current Branch
develop

## Session Update (2026-05-26, LostItem Phase 3 snapshot upload API)

### Completed
- Added lost-item-specific upload mutation:
  - `uploadLostItemSnapshot(file: Upload!): LostItemSnapshotUploadResult`
  - file: `apps/nestar-api/src/components/lost-item/lost-item.resolver.ts`
  - auth: admin-only (`RolesGuard` + `MemberType.ADMIN`)
- Added upload result DTO:
  - `LostItemSnapshotUploadResult` with `snapshotPath` and `snapshotUrl`
  - file: `apps/nestar-api/src/libs/dto/lost-item/lost-item.ts`
- Added upload service implementation:
  - `LostItemService.uploadLostItemSnapshot(...)`
  - file: `apps/nestar-api/src/components/lost-item/lost-item.service.ts`
  - fixed upload destination: `uploads/lost-items/`
  - auto-create missing directory
  - MIME validation: `image/png`, `image/jpg`, `image/jpeg`
  - size limit guard: `1_500_000` bytes
  - unique file names via existing `getSerialForImage(...)`
  - returns relative path format: `uploads/lost-items/<filename>`
  - removes partial file when upload fails.

### Explicitly preserved/deferred in this phase
- No change to generic member upload mutations (`imageUploader`, `imagesUploader`).
- No LostItem DB creation in upload mutation (still MQTT event-driven).
- No MQTT lost-item flow change.
- No frontend and Python module changes.

### Verification
- Backend build passed with `npm run build`.

## Session Update (2026-05-26, LostItem Phase 2 MQTT ingestion)

### Completed
- Extended MQTT runtime subscription for patrol lost-item topic:
  - `robot/+/lost-item`
- Extended MQTT topic parsing to support:
  - `robot/{robotId}/status`
  - `robot/{robotId}/pose`
  - `robot/{robotId}/lost-item`
- Added safe patrol-event normalization and validation in `apps/nestar-api/src/robot-comm/mqtt.service.ts`:
  - `eventType` must be `LOST_ITEM_DETECTED`
  - `confidence` must be number in `[0,1]` (invalid => drop)
  - `objectType` normalization (`id_card`/`ID_CARD` etc.) with UNKNOWN fallback
  - `priority` normalization with object-type-based fallback
  - `status` normalization with default `PENDING_REVIEW`
  - `robotId` source-of-truth from topic; mismatch logs warning
  - `detectedAt` fallback to current `Date` when missing/invalid
  - optional `snapshotPath`/`snapshotUrl` accepted.
- Added internal LostItem creation path:
  - `LostItemService.createLostItemFromPatrolEvent(...)`
- Wired MQTT module to LostItem module for service injection:
  - `apps/nestar-api/src/robot-comm/mqtt.module.ts` imports `LostItemModule`.

### Explicitly deferred in this phase
- No snapshot upload API endpoint.
- No frontend integration.
- No Python vision module changes.
- No lost-item WebSocket broadcast.
- No request/delivery state-flow changes.

### Verification
- Backend build passed with `npm run build`.

## Session Update (2026-05-25, LostItem Phase 1 backend foundation)

### Completed
- Added lost-item enum set with GraphQL registration:
  - `apps/nestar-api/src/libs/enums/lost-item.enum.ts`
  - `LostItemObjectType`, `LostItemPriority`, `LostItemStatus`, `LostItemEventType`
- Added lost-item schema:
  - `apps/nestar-api/src/schemas/LostItem.model.ts`
  - fields: `robotId`, `eventType`, `objectType`, `confidence`, `priority`, `detectedAt`, `snapshotPath`, `snapshotUrl`, `location.*`, `status`, `notes`
  - default status: `PENDING_REVIEW`
  - indexes:
    - `{ detectedAt: -1 }`
    - `{ status: 1, detectedAt: -1 }`
    - `{ robotId: 1, detectedAt: -1 }`
    - `{ objectType: 1, priority: 1, detectedAt: -1 }`
- Added DTOs and inputs:
  - `apps/nestar-api/src/libs/dto/lost-item/lost-item.ts`
  - `apps/nestar-api/src/libs/dto/lost-item/lost-item.input.ts`
  - `apps/nestar-api/src/libs/dto/lost-item/lost-item.update.ts`
- Added component module:
  - `apps/nestar-api/src/components/lost-item/lost-item.module.ts`
  - `apps/nestar-api/src/components/lost-item/lost-item.resolver.ts`
  - `apps/nestar-api/src/components/lost-item/lost-item.service.ts`
- Added config sort whitelist:
  - `apps/nestar-api/src/libs/config.ts` → `availableLostItemSorts`
- Registered module:
  - `apps/nestar-api/src/components/components.module.ts` includes `LostItemModule`
- New admin APIs:
  - query `getLostItems(input: LostItemsInquiry!): LostItems`
  - mutation `updateLostItemStatus(input: UpdateLostItemStatusInput!): LostItem`

### Explicitly deferred in this phase
- No MQTT lost-item topic subscription.
- No robot snapshot upload mutation/endpoint.
- No frontend integration.
- No Python vision module integration.

### Verification
- `npm run build` passed after Phase 1 implementation.

## Session Update (2026-05-24, memberBooks admin-only policy)

### Completed
- Enforced `memberBooks` as admin-only at backend persistence level.
- `apps/nestar-api/src/schemas/Member.model.ts`:
  - removed unconditional `memberBooks` default
  - added pre-save policy:
    - `ADMIN` => ensure numeric `memberBooks` (fallback `0`)
    - non-admin => unset `memberBooks`.
- `apps/nestar-api/src/components/member/member.service.ts`:
  - added post-update enforcement for `memberBooks` by `memberType`
  - non-admin member updates now unset `memberBooks` from DB
  - admin updates ensure `memberBooks` exists as numeric
  - response payloads normalize `memberBooks` to `0` when missing to preserve GraphQL compatibility.
- `apps/nestar-api/src/libs/config.ts`:
  - upgraded `lookupMember`, `lookupFollowingData`, `lookupFollowerData` to lookup pipelines with `$addFields.memberBooks: { $ifNull: ['$memberBooks', 0] }`
  - protects nested `memberData` reads in twit/follow/comment aggregation flows.
- `apps/nestar-api/src/scripts/backfill-member-counters.ts`:
  - keeps general counters backfill behavior
  - normalizes `memberBooks` only for admins
  - removes `memberBooks` from all non-admin docs.
- `apps/nestar-api/src/components/member/member-health-check.service.ts`:
  - added policy health check:
    - admins must have numeric `memberBooks`
    - non-admins must have missing `memberBooks`.

### Verification
- Backend build passed with `npm run build`.
- `npm run backfill:member-counters` executed successfully:
  - `member counter backfill done (general counters): matched=9, modified=0`
  - `memberBooks admin-only normalize done: matched=2, modified=0`
  - `memberBooks removed for non-admins: matched=7, modified=7`.

### Current stopping point
- Existing DB rows were migrated once using the updated backfill script.
- Backend now enforces admin-only `memberBooks` for new and updated member documents.

---

## Session Update (2026-05-24)

### Completed
- Added `bookLikes` to `availableBookSorts` in `apps/nestar-api/src/libs/config.ts`.
- Admin `GET_ALL_BOOKS_BY_ADMIN` now accepts `sort: "bookLikes"`, which the frontend admin dashboard uses for the Top Liked Books ranked list.

### Verification
- Backend build passed with `npm run build`.

### Current stopping point
- Restart the backend server so the new validation config is loaded at runtime.

---

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
- Book suggestions are returned only when the current user message asks for books/catalog results.
- General assistant answers do not inject catalog context and should not recommend books.

### Verification
- Backend build passed with `npm run build`.
- Frontend build also passed from the frontend repo with `yarn build`.

### Key rules from this session
- Backend build command is `npm run build`, not yarn.
- Keep Groq access backend-only; never expose `GROQ_API_KEY` to the frontend.
- Keep chatbot catalog answers grounded in DB retrieval context only when the user asks for book/catalog results.
- Do not return fallback active books as UI suggestions for unrelated questions.
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

## Session Update (2026-05-26, READY timeline duplicate hardening)

### Root cause
- Duplicate READY timeline entries could still occur under out-of-order/concurrent MQTT status telemetry.
- Prior duplicate protection focused on current status equality; semantic READY history (timeline-level READY reached) was not fully enforced across all update paths.

### Completed
- Hardened MQTT request-status updates in `apps/nestar-api/src/robot-comm/mqtt.service.ts`:
  - added `hasReachedReady(...)` semantic check using both `request.status` and `request.timeline`
  - added stale-after-READY guard for non-terminal movement statuses
  - added duplicate READY guard when READY already exists in timeline
  - switched telemetry status write to guarded conditional update path to avoid race-driven stale regressions.
- Hardened manual/admin status updates in `apps/nestar-api/src/components/request/request.service.ts`:
  - duplicate READY updates now no-op with warning
  - stale movement statuses after READY now no-op with warning
  - existing terminal-state protections unchanged.

### Explicitly preserved
- No DB schema changes.
- No frontend changes.
- No Python module changes.
- No LostItem flow changes.
- BORROW/PURCHASE completion and inventory behaviors unchanged.

### Verification
- `npm run build` passed after READY dedupe hardening.
