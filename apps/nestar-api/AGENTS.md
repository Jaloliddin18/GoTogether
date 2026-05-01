# nestar-api Agent Guide

## Purpose
Specific instructions for the main NestJS API app.

## Scope
- This folder contains the main API app.
- Follow existing component/module/service/resolver/schema style.
- Add Smart Library modules under `src/components`.
- Add schemas under `src/schemas`.
- Add MQTT infrastructure under `src/robot-comm`.
- Add dedicated robot gateway under `src/socket/robot.gateway.ts`.
- Do not modify `apps/nestar-batch` unless explicitly asked.
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
- `pickup.mastHeightCm`
- `pickup.forkDepthCm`

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

