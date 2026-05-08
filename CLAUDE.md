# 같이Go Backend — Claude Code Guide

## What This Project Is
같이Go is a Smart Library Robot Delivery system (university capstone, Inha University, Korea).
Students request physical books through a web app. A TurtleBot 3 robot autonomously retrieves
and delivers the book to the student's study seat. This NestJS backend is the orchestration
layer — it does NOT control motors, run ROS 2, or do OCR. It talks to the robot through MQTT only.

---

## Monorepo Structure
```
apps/nestar-api/         ← main API app (your workspace)
  src/
    components/          ← domain modules: book, robot, request (and legacy: member, property)
    schemas/             ← Mongoose schemas
    socket/              ← WebSocket gateways
    robot-comm/          ← MQTT module (does NOT exist yet — Phase 4)
    libs/dto/            ← shared DTOs and input types
apps/nestar-batch/       ← batch jobs — DO NOT TOUCH unless explicitly asked
uploads/                 ← runtime upload storage
```

---

## Tech Stack
- **NestJS** monorepo, TypeScript strict mode
- **GraphQL-first** — all app data operations use GraphQL (Apollo). No REST controllers.
- **MongoDB + Mongoose** (MongoDB Atlas)
- **JWT auth**, roles: `USER`, `ADMIN` (`AGENT` role already removed)
- **Socket.io** — existing general gateway exists; robot tracking needs its own dedicated gateway
- **MQTT** via `mqtt.js` — NOT yet implemented (Phase 4 next)
- No frontend in this repo

---

## Before Coding Anything — Always Do This First
```bash
git branch --show-current   # confirm you are on dev
git status                  # check for uncommitted changes — warn me if any exist
```
Then inspect the existing `book` or `member` module to understand the
resolver/service/module/DTO pattern before writing new code.

---

## What Codex Already Built (Phases 1–3 — Complete)

### Schemas (apps/nestar-api/src/schemas/)
- `Book.model.ts` — catalog fields, shelf coords, pickup params, `BookStatus` enum
- `BookInventory.model.ts` — LIBRARY and COMMERCIAL inventory types
- `Robot.model.ts` — robotId, status, battery, isOnline, currentPose
- `Request.model.ts` — BORROW/PURCHASE flows, RequestStatus enum, timeline array

### Modules (apps/nestar-api/src/components/)
- `book/` — getBooks, getBook, createBook, updateBook, updateBookAvailability
- `robot/` — getRobots, getRobot, createRobot, updateRobotStatus, updateRobotPose
- `request/` — createDeliveryRequest, cancelRequest, getRequest, getSessionRequests

### Tested and Working (Postman confirmed)
- createBook, createBookInventory (LIBRARY + COMMERCIAL)
- createRobot
- BORROW request flow: selects LIBRARY inventory, assigns robot
- PURCHASE request flow: selects COMMERCIAL inventory, routes to RECEPTION
- cancelRequest: releases robot + inventory
- Completing PURCHASE: sets paymentStatus=PAID, increments bookSoldQuantity, releases robot

---

## What Does NOT Exist Yet (Your Job)
- Phase 4: `src/robot-comm/` — MQTT module (connect, publish commands, subscribe to telemetry)
- Phase 5: `src/socket/robot.gateway.ts` — dedicated robot WebSocket gateway
- Phase 6: MQTT telemetry → MongoDB update → WebSocket emit pipeline
- Phase 7: Staff dashboard GraphQL operations

---

## Fixed Contracts — Never Change These Names

### MQTT Topics (robot-side ROS 2 depends on these)
```
robot/{robotId}/command   ← backend PUBLISHES navigation goals TO robot
robot/{robotId}/cancel    ← backend PUBLISHES cancel commands TO robot
robot/{robotId}/status    ← robot PUBLISHES state updates BACK to backend
robot/{robotId}/pose      ← robot PUBLISHES position BACK to backend
robot/{robotId}/event     ← robot PUBLISHES events BACK to backend
```

### MQTT Payload Shapes

**Command (backend → robot):**
```json
{
  "type": "DELIVERY_TASK",
  "requestId": "...",
  "book": { "bookId": "...", "title": "...", "callNumber": "..." },
  "pickup": { "floorId": "floor_1", "x": 4.25, "y": 2.8, "theta": 1.57, "mastHeightCm": 72, "forkDepthCm": 12 },
  "dropoff": { "seatId": "A12", "x": 8.4, "y": 3.2, "theta": 0 }
}
```

**Status (robot → backend):**
```json
{ "robotId": "robot_01", "requestId": "...", "state": "NAVIGATING_TO_SHELF", "message": "...", "battery": 84, "timestamp": "..." }
```

**Pose (robot → backend):**
```json
{ "robotId": "robot_01", "requestId": "...", "floorId": "floor_1", "x": 3.7, "y": 2.4, "theta": 1.2, "timestamp": "..." }
```

### WebSocket Events (frontend will depend on these)
Gateway file: `apps/nestar-api/src/socket/robot.gateway.ts`
Room model: clients join room `request:{requestId}`

**Client → server:**
- `joinRequest` — payload: `{ requestId }`

**Server → client:**
- `robotPosition` — `{ robotId, requestId, floorId, x, y, theta, timestamp }`
- `robotStatus` — `{ robotId, requestId, status, message, battery, timestamp }`
- `requestUpdated` — `{ requestId, status, message, timestamp }`
- `robotOffline` — `{ robotId, requestId, message, timestamp }`
- `bookNotFound` — `{ requestId, bookId, message, timestamp }`
- `deliveryReady` — `{ requestId, message, timestamp }`

### Request Status Enum (used in MongoDB + WebSocket — do not rename)
Normal flow:
`QUEUED → ASSIGNED → DISPATCHED → NAVIGATING_TO_SHELF → ARRIVED_AT_SHELF →
VERIFYING_BOOK → BOOK_FOUND → PICKING_UP → DELIVERING →
ARRIVED_AT_STUDENT → READY → COMPLETED`

Failure terminals: `BOOK_NOT_FOUND → FAILED`, `ROBOT_OFFLINE → FAILED`,
`NAVIGATION_FAILED → FAILED`, `PICKUP_FAILED → FAILED`

Cancellation: `USER_CANCELLED → CANCELLED`

---

## Coding Rules
- **Follow existing module patterns** — inspect `book` or `member` module before writing new code
- **GraphQL-first** — no REST controllers
- **Small incremental steps** — one module at a time, build after each step
- **Validate MQTT payloads** before trusting them — do not process garbage from robot
- **MongoDB update before WebSocket emit** — always persist first, then notify frontend
- **Do not mix robot gateway with existing general socket gateway**
- **Do not touch** `apps/nestar-batch` unless explicitly asked
- **Do not add** ROS, YOLO, OCR, or motor-control code in this repo
- Run `npm run build` after every implementation step and fix errors before continuing

---

## Commit Rules
- Only `feat:` or `fix:` prefixes — nothing else
- Show proposed commit message and ask for confirmation before committing
- Never run `git push` unless explicitly asked

## Recovery Commands
```bash
git restore .                # discard uncommitted changes
git reset --soft HEAD~1      # undo last commit, keep changes
git reset --hard HEAD~1      # undo last commit, discard changes
```

---

## Environment Variables
```
MONGODB_URI=
MQTT_BROKER_URL=        # mqtt://[Raspberry Pi IP]
PORT=
JWT_SECRET=
```

---

## Known Issues / Cleanup Backlog
- Book image uploads still use `uploads/property` path — should be `uploads/book` (not urgent)
- `Request.error` returns object with null fields on success — acceptable for now
- `apps/nestar-batch` may still contain old property/agent logic — not handled yet
