# 같이Go Backend — Session Memory

## Last Updated
2026-05-08 · commit 30832a6

## Current Branch
develop

## What Is Complete (verified in codebase)

### Schemas (`apps/nestar-api/src/schemas/`)
Smart Library schemas:
- `Book.model.ts` — catalog fields, shelf coords, `bookCallNumber` (optional), `BookStatus` enum
- `BookInventory.model.ts` — LIBRARY/COMMERCIAL types, `bookPickup` uses `gripperOpenWidthCm`, `gripperCloseWidthCm`, `gripHoldSeconds`, `pickupDirection` (updated commit 30832a6 — gripper design changed from mast+fork)
- `Robot.model.ts` — string `robotId`, `status`, `battery`, `isOnline`, `lastSeenAt` (placeholder), `currentPose`
- `Request.model.ts` — BORROW/PURCHASE, full `RequestStatus` enum (15 values), `timeline[]`, `error`
- `Twit.model.ts` — `memberId`, `text`, `image`, `likes[]`, `likeCount`, soft-delete via `deletedAt`
- `Follow.model.ts` — `followerId`, `followingId`, unique compound index

Legacy schemas still present (Nestar Property era, untouched):
`Member.model.ts`, `BoardArticle.model.ts`, `Comment.model.ts`, `Like.model.ts`,
`Notice.model.ts`, `Notification.model.ts`, `View.model.ts`, `TwitComment.model.ts`

### Modules (`apps/nestar-api/src/components/`)
Smart Library modules (all registered in `components.module.ts`):
- `book/` — createBook (ADMIN), getBooks, getBook, updateBook (ADMIN), getAllBooksByAdmin (ADMIN), getFavoriteBooks, getVisitedBooks, likeTargetBook, removeBookByAdmin (ADMIN)
- `book-inventory/` — createBookInventory, list operations
- `robot/` — createRobot (ADMIN), getRobots (ADMIN), getRobot (ADMIN), updateRobot (ADMIN — collapses updateRobotStatus + updateRobotPose)
- `request/` — createDeliveryRequest (WithoutGuard), getRequests (ADMIN), getRequest (ADMIN), getSessionRequests (WithoutGuard), updateRequestStatus (ADMIN), cancelRequest (WithoutGuard)
- `twit/` — createTwit, getTwits (feed, AuthGuard), getMemberTwits (public), likeTwit, deleteTwit
- `twit-comment/` — nested comment module (exists as files)
- `follow/` — followMember, unfollowMember, getFollowing (public), getFollowers (public), checkFollowing

Legacy modules still present (untouched): `auth/`, `board-article/`, `comment/`, `like/`, `member/`, `view/`

### Socket (`apps/nestar-api/src/socket/`)
- `socket.gateway.ts` — general-purpose gateway (exists)
- `socket.module.ts` — socket module (exists)
- `robot.gateway.ts` — **does NOT exist** (Phase 5, not started)

### Not Yet Started
- `apps/nestar-api/src/robot-comm/` — **does NOT exist** (Phase 4, not started)

### Build
- `npm run build` → **PASS** (webpack compiled successfully, 0 errors)

### Postman-verified flows
- createBook, createBookInventory (LIBRARY + COMMERCIAL)
- createRobot
- BORROW request: selects LIBRARY inventory, assigns robot
- PURCHASE request: selects COMMERCIAL inventory, routes to RECEPTION
- cancelRequest: releases robot + inventory
- Completing PURCHASE: paymentStatus=PAID, bookSoldQuantity++, robot → IDLE

## What Is In Progress
- BORROW completion flow: needs end-to-end test (bookReservedQuantity--, bookBorrowedQuantity++, robot → IDLE)
- No-stock edge case: not yet tested in Postman
- Three bugs identified in audit (see Known Issues) — fixes not yet committed

## What Is Next
**Phase 4 — MQTT module** (`src/robot-comm/`)
- Install/use `mqtt` package
- Create `robot-comm` module
- Publish command payloads to `robot/{robotId}/command` and `robot/{robotId}/cancel`
- Subscribe to `robot/{robotId}/status`, `robot/{robotId}/pose`, `robot/{robotId}/event`
- **Before starting:** update CLAUDE.md pickup payload fields (see Known Issues P1)

## Known Issues / Cleanup Backlog

### Audit Findings — 2026-05-08

#### P1 — CLAUDE.md pickup payload is stale (must fix before Phase 4)
CLAUDE.md MQTT command still specifies `mastHeightCm` and `forkDepthCm`.
Schema (commit 30832a6) now uses `gripperOpenWidthCm`, `gripperCloseWidthCm`,
`gripHoldSeconds`, `pickupDirection`. Update CLAUDE.md before writing Phase 4.

#### P2 — cancelRequest does not block FAILED terminal state (bug)
`cancelRequest` blocks COMPLETED but not FAILED. A FAILED request can be
"cancelled", producing an invalid state transition. Add guard for FAILED before Phase 5.
File: `apps/nestar-api/src/components/request/request.service.ts` ~line 327.

#### P3 — updateRequestStatus has no terminal re-entry guard (bug)
Calling updateRequestStatus on an already-COMPLETED/FAILED/CANCELLED request
overwrites status and appends a duplicate timeline entry. Add guard before Phase 5.
File: `apps/nestar-api/src/components/request/request.service.ts` ~line 253.

#### P4 — bookCallNumber not validated at dispatch (risk)
`bookCallNumber` is optional in Book schema and CreateBookInput. A delivery request
for a book with no callNumber will produce an undefined field in the Phase 4 MQTT
pickup command. Validate in `createDeliveryRequest` before dispatching.

#### Phase 4 / Phase 6 Integration Risks
- `robotId` in MQTT payloads is a string ("robot_01"); Request stores robot's
  internal ObjectId. Phase 6 telemetry handler must do two-step lookup:
  `Robot.findOne({ robotId: "robot_01" })` → use `robot._id` to update Request.
- `lastSeenAt` on Robot schema is defined but never written — Phase 6 must update it
  when any telemetry arrives.

#### Minor / Post-MVP
- Empty-list `$facet` guard in `getRobots`, `getTwits`, `getMemberTwits` throws
  `NO_DATA_FOUND` instead of returning `{ list: [], metaCounter: [] }` — fix after Phase 6
- `bookCallNumber` is optional in schema — validated at dispatch level (P4 above)
- `removeBookByAdmin` requires `bookStatus: DELETED` set first — two-step hard delete,
  not obvious; document for staff dashboard developer
- Book image uploads still use `uploads/property` path — should be `uploads/book` (not urgent)
- `Request.error` returns object with null fields on success — acceptable; cleaner = `error: null`
- `apps/nestar-batch` may contain old property/agent batch logic — not handled yet
- Legacy schemas and modules from Nestar Property era remain (BoardArticle, Comment,
  Like, Notice, Notification, View) — not removed yet

## Recent Commits
```
30832a6 feat: update book inventory pickup for fixed gripper
29a9f46 feat: add twit nested comment module
fac727d feat: add member profile query
d1ef2de fix: restore follow state in member lists
6ed15b4 feat: add backend follow system
c88c1b0 feat: add claude code agent setup and memory system
644f7cd feat: add backend twit module
8de6dab fix: remove duplicate book inventory list api
```

## Test Data IDs (Postman confirmed)
- Book ID: `69f662844d9e6330d4a5faa9`
- LIBRARY inventory ID: `69f664874d9e6330d4a5faae`
- COMMERCIAL inventory ID: `69f664b04d9e6330d4a5fab2`
- Robot ID: `69f6670e997c6e5d143bd0d5`
- robotId string: `robot_01`
