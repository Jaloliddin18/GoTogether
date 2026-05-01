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

