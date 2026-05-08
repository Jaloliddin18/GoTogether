# 같이Go Backend — Session Memory

## Last Updated
2026-05-08 · commit 8de6dabc66ba831a7c290019aeb8ef9c7b1b2eb5

## Current Branch
develop

## What Is Complete (verified in codebase)

### Schemas (`apps/nestar-api/src/schemas/`)
- `Book.model.ts` — catalog fields, shelf coords, pickup params, `BookStatus` enum
- `BookInventory.model.ts` — LIBRARY and COMMERCIAL inventory types
- `Robot.model.ts` — robotId, status, battery, isOnline, currentPose
- `Request.model.ts` — BORROW/PURCHASE flows, RequestStatus enum, timeline array
- Legacy schemas still present: `Member.model.ts`, `BoardArticle.model.ts`, `Comment.model.ts`, `Follow.model.ts`, `Like.model.ts`, `Notice.model.ts`, `Notification.model.ts`, `View.model.ts`

### Modules (`apps/nestar-api/src/components/`)
- `book/` — resolver, service, module (getBooks, getBook, createBook, updateBook, updateBookAvailability)
- `book-inventory/` — resolver, service, module (createBookInventory, list)
- `robot/` — resolver, service, module (getRobots, getRobot, createRobot, updateRobotStatus, updateRobotPose)
- `request/` — resolver, service, module (createDeliveryRequest, cancelRequest, getRequest, getSessionRequests)
- Legacy modules still present: `auth/`, `board-article/`, `comment/`, `follow/`, `like/`, `member/`, `view/`

### Socket (`apps/nestar-api/src/socket/`)
- `socket.gateway.ts` — general-purpose gateway (exists)
- `socket.module.ts` — socket module (exists)
- `robot.gateway.ts` — **does NOT exist** (Phase 5)

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
- Upload path still uses `uploads/property` instead of `uploads/book` (not urgent)

## What Is Next
**Phase 4 — MQTT module** (`src/robot-comm/`)
- Install/use `mqtt` package
- Create `robot-comm` module
- Publish command payloads to `robot/{robotId}/command` and `robot/{robotId}/cancel`
- Subscribe to `robot/{robotId}/status`, `robot/{robotId}/pose`, `robot/{robotId}/event`
- Add fake robot simulator for local testing

## Known Issues / Cleanup Backlog
- Book image uploads still use `uploads/property` path — should be `uploads/book` (not urgent)
- `Request.error` returns object with null fields on success — acceptable for now; cleaner would be `error: null`
- `apps/nestar-batch` may still contain old property/agent batch logic — not handled yet
- Legacy schemas and modules from Nestar Property era remain in repo (BoardArticle, Comment, Follow, Like, Notice, Notification, View) — not removed yet

## Recent Commits
```
8de6dab fix: remove duplicate book inventory list api
f82b4f2 feat: simplify robot update api
8c178c2 fix: remove duplicate book update api
190204f fix: populate liked state in book queries
2331cdb feat: add backend progress context
8674827 feat: remove legacy book availability field
fe024fa fix: improve robot error handling
369fe36 fix: correct request error dto nullability
```

## Test Data IDs (Postman confirmed)
- Book ID: `69f662844d9e6330d4a5faa9`
- LIBRARY inventory ID: `69f664874d9e6330d4a5faae`
- COMMERCIAL inventory ID: `69f664b04d9e6330d4a5fab2`
- Robot ID: `69f6670e997c6e5d143bd0d5`
- robotId string: `robot_01`
