# 같이Go Backend Agent Guide

## Purpose
Repo-level instructions for Codex and other coding agents.

## Project Identity
This repository is the backend for 같이Go, a Smart Library Robot Delivery system for a school project. The backend connects student book requests, MongoDB catalog data, robot task assignment, MQTT robot communication, and live WebSocket tracking.

## Existing Backend Stack
- NestJS monorepo
- TypeScript
- GraphQL-first API
- MongoDB + Mongoose
- JWT auth
- Existing roles: `USER`, `ADMIN`, `AGENT`
- Existing socket gateway
- Separate batch app (`apps/nestar-batch`)
- No frontend inside this backend repo
- MQTT will be added later

## Main Folders
- `apps/nestar-api`: main API application
- `apps/nestar-batch`: batch/scheduled jobs application
- `apps/nestar-api/src/components`: domain modules (resolver/service/module pattern)
- `apps/nestar-api/src/schemas`: Mongoose schemas
- `apps/nestar-api/src/socket`: WebSocket gateways
- `uploads`: runtime upload storage

## High-Level Smart Library Goal
Add Smart Library features incrementally while preserving existing backend behavior:
1. Book module
2. Robot module
3. Request/task module
4. MQTT communication module
5. Dedicated robot WebSocket gateway
6. Seed scripts
7. Staff/admin monitoring operations

## Important Coding Rules
- Preserve the existing backend; do not rewrite old architecture.
- Do not rename/delete old real-estate/domain modules.
- Add Smart Library features as **new modules**.
- Inspect existing patterns before coding (especially `member` and `property` modules).
- Keep changes small, testable, and incremental.
- Do not add MQTT before Book, Robot, and Request modules exist.
- Do not mix robot tracking with the existing general socket gateway.
- Do not add ROS, YOLO, OCR, or motor-control code inside NestJS backend.
- Backend communicates with robot through MQTT only; ROS 2 remains robot-side.
- Backend build command is `npm run build`.
- Keep Groq API access backend-only; do not expose `GROQ_API_KEY` to frontend code.
- Chatbot module lives under `apps/nestar-api/src/components/chat/`.
- Chatbot REST endpoint is `POST /chat/message`.
- Chatbot response shape is `{ reply: string, books: ChatBookSuggestion[] }`.
- Keep chatbot book answers grounded in live DB retrieval from the `Book` collection only when the current user message asks for book/catalog results.
- Do not return fallback active books as UI suggestions for unrelated chat questions.
- Do not reintroduce the old general `SocketGateway` for chatbot work.
- Do not touch `apps/nestar-api/src/socket/robot.gateway.ts` for chatbot work.

## Suggested Smart Library Locations
- `apps/nestar-api/src/components/book/`
- `apps/nestar-api/src/components/robot/`
- `apps/nestar-api/src/components/request/`
- `apps/nestar-api/src/robot-comm/`
- `apps/nestar-api/src/socket/robot.gateway.ts`
- `apps/nestar-api/src/schemas/Book.model.ts`
- `apps/nestar-api/src/schemas/Robot.model.ts`
- `apps/nestar-api/src/schemas/Request.model.ts`
- `apps/nestar-api/src/schemas/RobotStatusLog.model.ts`

## Safe Implementation Order
1. Book schema/module/resolver/service
2. Book seed data
3. Robot schema/module/resolver/service
4. Request schema/module/resolver/service without MQTT
5. Fake dispatch logic
6. MQTT service
7. Fake robot simulator
8. Dedicated robot WebSocket gateway
9. MQTT telemetry to MongoDB + WebSocket
10. Staff dashboard operations

## Migration Principle
The goal is to transform the existing real-estate Nestar project into the 같이Go Smart Library Robot Delivery project.

### 1) Keep useful infrastructure
- NestJS/Next.js project structure
- GraphQL/Apollo setup
- MongoDB/Mongoose setup
- Auth/JWT/roles
- Layouts
- Admin structure
- Shared UI patterns
- Styling system

### 2) Replace domain-specific real-estate features
- Property domain becomes Book/Catalog domain
- Property detail becomes Book detail
- Property search becomes Book search
- Property admin becomes Book availability/admin
- Agent pages may be removed or repurposed later
- Real-estate homepage sections should later become Smart Library homepage sections

### 3) Removal policy
- Do not delete old real-estate modules/pages first.
- First build a working Smart Library MVP.
- Then update navigation/homepage to Smart Library.
- Then remove old real-estate files only after checking imports and build.
- Remove old files gradually, one domain area at a time.

### 4) Codex rule for later real-estate removal
When removing old real-estate code later, Codex must:
- Search for imports/usages first
- List files to delete
- Explain risk
- Ask for confirmation
- Run build after deletion
- Never delete large folders without confirmation

## Build and Test Expectations
- Run `npm run build` when relevant.
- Run `npm run test` when relevant.
- Run `npm run lint` if available and relevant.
- If build/test fails due to pre-existing errors, report clearly and do not hide failures.

## Do Not Do Unless Explicitly Asked
- Do not modify unrelated legacy modules.
- Do not refactor the full project structure.
- Do not change batch app behavior (`apps/nestar-batch`) unless requested.
- Do not introduce frontend code in this repo.
- Do not add non-MQTT robot transport layers.

## Solo Dev Branch Workflow
I am working alone and may work directly on `dev`.

Before any Codex coding task:
- Check current branch with `git branch --show-current`.
- Check working tree with `git status`.
- If there are existing uncommitted changes, warn me before editing.

## Codex Commit Policy
Codex may prepare commits, but should not commit blindly.

After implementing a task, Codex should:
1. Run the relevant verification command:
2. backend: `npm run build`, plus `npm run test` or `npm run lint` if relevant
3. frontend: `yarn build`, plus `yarn lint` or `yarn test` if relevant
4. Run `git status`.
5. Show a concise summary of changed files.
6. Show the proposed commit message.
7. Ask for confirmation before committing, unless my prompt explicitly says `commit after successful build`.

Commit message standard:
- Use only `feat:` or `fix:` prefixes.
- Do not use `docs:`, `refactor:`, `chore:`, `test:`, `style:`, or any other prefix.

Use `feat:` for adding, removing, or changing planned project functionality.
- `feat: add backend book module`
- `feat: add backend robot module`
- `feat: add backend request module`
- `feat: add backend book inventory module`
- `feat: remove backend agent role`
- `feat: add frontend book search page`

Use `fix:` for bug fixes, build errors, broken logic, DTO/schema mistakes, and incorrect fields.
- `fix: resolve book dto build error`
- `fix: correct request status logic`
- `fix: restore backend build after enum change`
- `fix: correct book inventory field names`

## If I Explicitly Request Auto-Commit
If my prompt includes `commit after successful build`, Codex may:
1. Run build/lint/test as requested.
2. Commit only if verification passes or only pre-existing unrelated failures are clearly identified.
3. Use a clean descriptive commit message.
4. Never push unless I explicitly ask.

## Push Policy
Codex must not run `git push` unless I explicitly ask.

## Bad Change Recovery
If Codex makes bad changes before commit, suggest:
- `git restore .`
- `git clean -fd` only if I want to remove untracked files

If a bad commit was made and not pushed, suggest:
- `git reset --soft HEAD~1` to keep changes
- `git reset --hard HEAD~1` only if I want to discard changes completely

---

## Session Update (2026-05-27) — Dock completion telemetry now finalizes robot status

### Completed
- Fixed post-delivery robot status finalization in:
  - `apps/nestar-api/src/robot-comm/mqtt.service.ts`
- In MQTT status handling, completion-style telemetry states now finalize return lifecycle:
  - completion aliases handled: `COMPLETED`, `FINISHED`, `DELIVERY_COMPLETED`, `DELIVERY_COMPLETE`, `TASK_COMPLETED`, `TASK_COMPLETE`, `MISSION_COMPLETED`, `MISSION_COMPLETE`
  - if robot is currently `RETURNING` or `DOCKING`, backend now sets robot status to `IDLE` and clears `currentRequestId`.
- Kept request terminal guardrails unchanged:
  - terminal request statuses remain protected from non-terminal rollback
  - robot finalization is handled independently from request-state downgrade logic.
- Updated emitted `robotStatus` payload to reflect finalized status when this dock completion path is triggered.

### Verification
- `npm run build` passed after the MQTT status finalization fix.

### Operational rule from this session
- Treat dock-completion telemetry as a robot-lifecycle finalization signal; when robot is returning/docking, completion aliases must transition robot to `IDLE` in DB.

## Session Update (2026-05-24) — memberBooks admin-only persistence policy

### Completed
- Enforced `memberBooks` as an admin-only stored DB field:
  - `apps/nestar-api/src/schemas/Member.model.ts`
  - removed unconditional `memberBooks` default
  - added schema pre-save guard: keep numeric `memberBooks` for `ADMIN`, unset for non-admin.
- Added service-level enforcement and response normalization:
  - `apps/nestar-api/src/components/member/member.service.ts`
  - on member updates, non-admin docs now `$unset` `memberBooks`; admin docs ensure numeric `memberBooks`.
  - API responses normalize missing `memberBooks` to `0` to keep existing GraphQL consumers safe.
- Hardened member lookups used by twit/follow/comment aggregations:
  - `apps/nestar-api/src/libs/config.ts`
  - `lookupMember`, `lookupFollowingData`, `lookupFollowerData` now include `$addFields.memberBooks: { $ifNull: [...] }`.
- Updated backfill script for policy migration:
  - `apps/nestar-api/src/scripts/backfill-member-counters.ts`
  - general counters backfill keeps existing behavior
  - `memberBooks` now normalized only for admins and removed from non-admin docs.
- Updated startup health check policy:
  - `apps/nestar-api/src/components/member/member-health-check.service.ts`
  - validates `memberBooks` is numeric for admins and missing for non-admins.

### Verification
- `npm run build` passed.

---

## Session Update (2026-05-28) — Global MQTT telemetry topic subscription for demo tracking

### Completed
- Updated `apps/nestar-api/src/robot-comm/mqtt.service.ts` startup MQTT wiring to subscribe global telemetry topics on every connect:
  - `robot/+/status`
  - `robot/+/pose`
  - `robot/+/lost-item` (preserved)
- Added centralized duplicate-subscription protection in MQTT service:
  - `subscribedTopicFilters` and `pendingTopicFilters` sets
  - `subscribeTopicsOnce(...)` helper to skip already subscribed or in-flight topic filters.
- Preserved existing per-robot subscription flow (`subscribeToRobotTopics(robotId)`):
  - per-robot status/pose subscribe is still available as fallback
  - when global telemetry topic filters are already active, per-robot subscribe is skipped to avoid overlap.
- Preserved existing delivery/lost-item runtime guards:
  - status/pose/lost-item topic parsing unchanged
  - request/robot validation and malformed payload handling unchanged.

### Verification
- `npm run build` passed.

### Operational rule from this session
- For demo/testing (manual MQTT publish), backend must subscribe `robot/+/status` and `robot/+/pose` at startup so `robot/robot_01/status` and `robot/robot_01/pose` are received without waiting for per-request subscription triggers.

---

## Session Update (2026-05-28) — LostItem multi-class YOLO label compatibility

### Completed
- Updated LostItem MQTT object-type normalization in:
  - `apps/nestar-api/src/robot-comm/mqtt.service.ts`
- Added/confirmed compatibility mappings for new model labels:
  - `watch` / `WATCH` -> `WATCH`
  - `airpods` / `AIRPODS` -> `AIRPODS`
  - `airpod` -> `AIRPODS`
  - `airpods_case` -> `AIRPODS`
- Kept existing mappings intact:
  - `id_card` -> `ID_CARD`
  - `phone` -> `PHONE`
  - `wallet` -> `WALLET`
  - `bottle` -> `BOTTLE`
- Updated priority fallback defaults in MQTT normalization:
  - `ID_CARD`, `PHONE`, `WALLET` -> `HIGH`
  - `WATCH`, `AIRPODS`, `BOOK` -> `MEDIUM`
  - `BOTTLE`, `UNKNOWN` -> `LOW`
- Enum compatibility confirmed:
  - `LostItemObjectType` already includes `WATCH` and `AIRPODS` and remains GraphQL-registered.

### Explicitly preserved
- No LostItem schema field changes.
- No new APIs.
- No changes to `uploadLostItemSnapshot`.
- No behavior changes to `getLostItems` / `updateLostItemStatus` beyond enum/object-type compatibility.
- No frontend or Python vision module changes.
- No request/delivery flow changes outside lost-item normalization.

### Verification
- `npm run build` passed after the normalization/priority update.
- `npm run backfill:member-counters` executed with:
  - `member counter backfill done (general counters): matched=9, modified=0`
  - `memberBooks admin-only normalize done: matched=2, modified=0`
  - `memberBooks removed for non-admins: matched=7, modified=7`

### Operational rule from this session
- `memberBooks` should be treated as an admin-only persisted DB field.
- For user-facing/non-admin member documents, `memberBooks` must not be stored in Mongo.

---

## Session Update (2026-05-19) — Robot lifecycle automation + simulator command listener

### Completed
- `updateRequestStatus(COMPLETED)` lifecycle now supports automatic robot transition:
  - emit completion update
  - release robot
  - assign next queued request if available
  - otherwise set robot to `RETURNING` and publish `RETURN_TO_DOCK` command.
- MQTT telemetry resolution was extended so post-completion movement can continue to reach the same request room for frontend tracking continuity.
- Terminal request statuses are protected from non-terminal rollback during late telemetry.
- Simulator script was upgraded:
  - kept one-shot/manual mode
  - added persistent listener mode (`--listen=true`) that subscribes to `robot/<robotId>/command`
  - supports `DELIVERY_TASK` and `RETURN_TO_DOCK`
  - prevents overlapping runs while robot is busy
  - keeps `state` field in status payloads and continuous pose publishing.

### Operational rule from this session
- For realistic demos, start simulator once in listener mode and trigger movement by creating requests or completing requests; avoid manual per-request one-shot publishing.

---

## Session Update (2026-05-24) — Admin bookLikes sort validation

### Completed
- Added `bookLikes` to `availableBookSorts` in `apps/nestar-api/src/libs/config.ts`.
- This allows admin `GET_ALL_BOOKS_BY_ADMIN` queries to sort by `bookLikes`, required by the frontend admin dashboard `Top Liked Books` ranked list.

### Verification
- `npm run build` passed after the validation change.

### Key rule
- When frontend admin dashboards add ranked book widgets, ensure the requested sort field is included in backend `availableBookSorts`; otherwise GraphQL validation returns `Bad Request Exception` before the service runs.

---

## Session Update (2026-05-25) — LostItem Phase 1 backend foundation

### Completed
- Added LostItem enum layer with GraphQL registration:
  - `apps/nestar-api/src/libs/enums/lost-item.enum.ts`
  - `LostItemObjectType`: `ID_CARD`, `BOTTLE`, `WALLET`, `PHONE`, `BOOK`, `UNKNOWN`
  - `LostItemPriority`: `HIGH`, `MEDIUM`, `LOW`
  - `LostItemStatus`: `PENDING_REVIEW`, `COLLECTED`, `DISMISSED`
- Added LostItem schema:
  - `apps/nestar-api/src/schemas/LostItem.model.ts`
  - required fields: `robotId`, `eventType`, `objectType`, `confidence`, `priority`, `detectedAt`
  - optional fields: `snapshotPath`, `snapshotUrl`, `location.*`, `notes`
  - default status: `PENDING_REVIEW`
  - indexes:
    - `{ detectedAt: -1 }`
    - `{ status: 1, detectedAt: -1 }`
    - `{ robotId: 1, detectedAt: -1 }`
    - `{ objectType: 1, priority: 1, detectedAt: -1 }`
- Added LostItem DTO and input/update contracts:
  - `apps/nestar-api/src/libs/dto/lost-item/lost-item.ts`
  - `apps/nestar-api/src/libs/dto/lost-item/lost-item.input.ts`
  - `apps/nestar-api/src/libs/dto/lost-item/lost-item.update.ts`
- Added LostItem component module/resolver/service:
  - `apps/nestar-api/src/components/lost-item/lost-item.module.ts`
  - `apps/nestar-api/src/components/lost-item/lost-item.resolver.ts`
  - `apps/nestar-api/src/components/lost-item/lost-item.service.ts`
- Registered `LostItemModule` in `apps/nestar-api/src/components/components.module.ts`.
- Added LostItem sort whitelist in `apps/nestar-api/src/libs/config.ts`:
  - `availableLostItemSorts` with default use on `detectedAt DESC`.

### API Added (admin-only)
- Query: `getLostItems(input: LostItemsInquiry!): LostItems`
- Mutation: `updateLostItemStatus(input: UpdateLostItemStatusInput!): LostItem`
- Guard pattern: `@Roles(MemberType.ADMIN)` + `@UseGuards(RolesGuard)`

### Explicitly Not Done In Phase 1
- No MQTT lost-item listener/subscription.
- No image upload endpoint for robot snapshots.
- No frontend changes.
- No Python vision module changes.
- No request/delivery flow logic changes.

### Verification
- `npm run build` passed.

---

## Session Update (2026-05-26) — LostItem Phase 2 MQTT ingestion

### Completed
- Extended MQTT runtime to subscribe patrol lost-item topic:
  - wildcard topic: `robot/+/lost-item`
  - existing per-robot status/pose topic behavior preserved.
- Extended MQTT topic parser to handle:
  - `robot/{robotId}/status`
  - `robot/{robotId}/pose`
  - `robot/{robotId}/lost-item`
- Added lost-item payload normalization/validation in MQTT service:
  - requires `eventType = LOST_ITEM_DETECTED`
  - validates `confidence` in `[0, 1]` (invalid payloads dropped)
  - normalizes `objectType` (`id_card`, `bottle`, etc. to enum values)
  - normalizes/fallbacks `priority` and `status`
  - uses topic `robotId` as source of truth on mismatch
  - accepts missing `snapshotUrl`/`snapshotPath` for this phase
  - uses current time when `detectedAt` is missing/invalid.
- Added internal LostItem creation path used by MQTT:
  - `LostItemService.createLostItemFromPatrolEvent(...)`
- Wired MQTT module to consume LostItem service via module import.

### Explicitly deferred
- No image upload endpoint in this phase.
- No WebSocket push event for lost-item in this phase.
- No frontend or Python vision module changes in this phase.
- No request/delivery flow/status logic changes in this phase.

### Verification
- `npm run build` passed after Phase 2 changes.

### Operational rule from this session
- Lost-item ingestion must remain resilient and non-blocking:
  malformed payloads are warned and dropped without affecting ongoing status/pose telemetry handling.

---

## Session Update (2026-05-26) — LostItem Phase 3 snapshot upload API

### Completed
- Added lost-item-specific GraphQL upload mutation:
  - `uploadLostItemSnapshot(file: Upload!): LostItemSnapshotUploadResult`
  - file: `apps/nestar-api/src/components/lost-item/lost-item.resolver.ts`
  - guard: `@Roles(MemberType.ADMIN)` + `@UseGuards(RolesGuard)`
- Added upload result DTO:
  - `LostItemSnapshotUploadResult`
  - fields: `snapshotPath`, `snapshotUrl`
  - file: `apps/nestar-api/src/libs/dto/lost-item/lost-item.ts`
- Added scoped upload service logic:
  - method: `LostItemService.uploadLostItemSnapshot(...)`
  - file: `apps/nestar-api/src/components/lost-item/lost-item.service.ts`
  - upload target is fixed to `uploads/lost-items/` only
  - directory auto-create uses `mkdirSync(..., { recursive: true })`
  - allowed MIME: `image/png`, `image/jpg`, `image/jpeg`
  - unique filename via existing `getSerialForImage(...)`
  - file size guard set to `1_500_000` bytes (aligned with GraphQL upload middleware)
  - returns relative path format: `uploads/lost-items/<filename>`
  - partial failed uploads are removed safely.

### Explicitly preserved/deferred
- Existing generic `imageUploader` / `imagesUploader` behavior remains unchanged.
- LostItem DB record creation remains MQTT-driven (upload mutation does not create LostItem docs).
- Existing lost-item MQTT ingestion behavior was not changed in this phase.
- No frontend or Python vision module changes in this phase.
- No request/delivery flow logic changes in this phase.

### Verification
- `npm run build` passed after Phase 3 changes.

### Operational rule from this session
- Phase 3 currently requires admin JWT for snapshot upload; Python/robot automation will need either a valid token or a later dedicated robot-auth path.

---

## Session Update (2026-05-26) — Request READY timeline dedupe hardening

### Completed
- Hardened request-status lifecycle to prevent duplicate `READY` timeline entries and stale post-`READY` regressions.
- Updated MQTT status telemetry handling in `apps/nestar-api/src/robot-comm/mqtt.service.ts`:
  - added semantic `hasReachedReady(...)` guard (checks status and timeline history, not only current status)
  - ignores duplicate `READY` telemetry after READY already exists in timeline
  - ignores stale non-terminal movement statuses after READY (e.g. `ARRIVED_AT_STUDENT`, `DELIVERING`, `NAVIGATING_TO_SHELF`)
  - moved request status write into guarded atomic update path to reduce out-of-order race regressions.
- Updated admin/manual status mutation path in `apps/nestar-api/src/components/request/request.service.ts`:
  - ignores duplicate `READY` updates
  - ignores stale movement-status updates after READY
  - preserves existing terminal guards (`COMPLETED`, `FAILED`, `CANCELLED`) unchanged.
- Added explicit warning logs when duplicate/stale READY-related updates are ignored.

### Explicitly preserved
- No frontend changes.
- No Python vision module changes.
- No LostItem patrol flow changes.
- No DB schema changes.
- BORROW/PURCHASE inventory completion/release behavior unchanged.

### Verification
- `npm run build` passed.
