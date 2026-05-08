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
    socket/              ← WebSocket gateways (general + robot)
    robot-comm/          ← MQTT module (implemented)
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
- **WebSocket (`ws`)** — app uses `@nestjs/platform-ws` adapter
- **MQTT** via `mqtt.js` — backend robot communication implemented
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

## What Is Implemented

### Core domains in place
- `Book.model.ts`, `BookInventory.model.ts`, `Robot.model.ts`, `Request.model.ts`
- BookInventory pickup uses fixed-gripper fields:
  - `gripperOpenWidthCm`, `gripperCloseWidthCm`, `gripHoldSeconds`, `pickupDirection`
- Old fork/container pickup fields are removed:
  - `mastHeightCm`, `forkDepthCm`, `gripWidthCm`, `requiresContainer`, `containerId`

### Request hardening in place
- `cancelRequest` blocks terminal statuses (`COMPLETED`, `FAILED`, `CANCELLED`)
- `updateRequestStatus` guards terminal-state re-entry
- `createDeliveryRequest` validates `bookCallNumber` before inventory reservation

### Robot communication phases complete
- Phase 4: MQTT module implemented (`src/robot-comm/*`)
- Phase 5: dedicated robot gateway implemented (`src/socket/robot.gateway.ts`)
- Phase 6: MQTT telemetry wired to MongoDB updates + WebSocket emits

---

## Current Delivery Status
- Phase 4 complete: MQTT module (`src/robot-comm/`)
- Phase 5 complete: dedicated robot gateway (`src/socket/robot.gateway.ts`)
- Phase 6 complete: MQTT telemetry → MongoDB update → WebSocket emit integration
- Phase 7 pending: staff/admin dashboard GraphQL operations

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
  "pickup": { "floorId": "floor_1", "x": 4.25, "y": 2.8, "theta": 1.57, "gripperOpenWidthCm": 8, "gripperCloseWidthCm": 3, "gripHoldSeconds": 2, "pickupDirection": "FRONT" },
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
- Adapter reality: this project uses plain `ws`, so request-scoped targeting is implemented via manual client-room mapping (not Socket.IO rooms).

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

## Runtime Verification Status
- Confirmed:
  - build passes
  - local MQTT broker connection works
  - backend subscribed to `robot/robot_01/status` and `robot/robot_01/pose`
  - MQTT status messages were received and parsed
  - BORROW telemetry sequence was tested through `READY`
  - request reached `READY` and stayed `READY` after >35s
  - robot is released on `READY` (`IDLE`, `currentRequestId=null`, `isOnline=true`)
  - pose telemetry path updates Robot pose data
  - previous `server.to is not a function` adapter mismatch is fixed
  - `BOOK_NOT_FOUND` flow works:
    - request becomes `FAILED`
    - request error is set
    - robot is released
    - inventory reservation is released
  - offline timeout before `READY` works:
    - in-progress request becomes `FAILED` if robot stops sending telemetry
    - robot is released
    - robot is marked offline
    - inventory reservation is released
- Still pending final runtime checks:
  - WebSocket client-side join/receive verification for `joinRequest` + robot events

---

## Known Issues / Cleanup Backlog
- Book image uploads still use `uploads/property` path — should be `uploads/book` (not urgent)
- `Request.error` returns object with null fields on success — acceptable for now
- `apps/nestar-batch` may still contain old property/agent logic — not handled yet

## Recent Backend Completion Notes
- BookInventory pickup refactor is complete:
  - removed old pickup fields (`mastHeightCm`, `forkDepthCm`, `gripWidthCm`, `requiresContainer`, `containerId`)
  - fixed-gripper fields now used (`gripperOpenWidthCm`, `gripperCloseWidthCm`, `gripHoldSeconds`, `pickupDirection`)
  - mechanism is fixed gripper only (no fork lift, no moving arm)
- Request hardening updates are complete:
  - terminal guards in `cancelRequest` and `updateRequestStatus`
  - `createDeliveryRequest` validates `bookCallNumber` before reservation/dispatch path
- Phase 6 runtime behavior implemented:
  - pose/status telemetry updates Robot + active Request data
  - `BOOK_NOT_FOUND` and offline timeout paths fail request safely and release robot/inventory
  - request-scoped WebSocket emits for status/pose/ready/failure events
  - READY keeps request at READY, clears timeout, releases robot, and avoids duplicate timeline entries
