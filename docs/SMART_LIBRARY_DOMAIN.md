# Smart Library Domain Model

## Purpose
Domain model guide for Smart Library backend modules.

## MVP Domain Objects

### Book
Purpose: Catalog and physical pickup metadata for deliverable library books.
Core fields:
- Identity/search: `title`, `author`, `isbn`, `callNumber`, `category`, `description`
- Availability: `available`, `bookStatus`
- Shelf location: `shelf.section`, `shelf.row`, `shelf.level`
- Map pose: `location.floorId`, `location.x`, `location.y`, `location.theta`
- Pickup parameters: `pickup.mastHeightCm`, `pickup.forkDepthCm`

### Robot
Purpose: Runtime state of each delivery robot.
Core fields:
- Identity: `robotId`, `name`
- Runtime: `status`, `battery`, `isOnline`, `lastSeenAt`, `currentRequestId`
- Pose: `currentPose.floorId`, `currentPose.x`, `currentPose.y`, `currentPose.theta`

### RequestTask
Purpose: End-to-end delivery request lifecycle from student request to completion/failure.
Core fields:
- Relations: `bookId`, `robotId`, `sessionId` or `memberId`
- Routing: `destination`
- Lifecycle: `status`, `timeline`, `error`
- Timestamps: `createdAt`, `updatedAt`

### RobotStatusLog
Purpose: Persisted telemetry/event history for robot and request observability.
Core fields:
- Identity: `robotId`, `requestId`
- Event data: `state`, `message`, `battery`, `floorId`, `x`, `y`, `theta`
- Time: `timestamp`, `createdAt`

## Optional Later Domain Objects

### Seat/Destination (later)
Purpose: Structured destination configuration for student drop-off points.

### StaffAlert (later)
Purpose: Alerts for failures, low battery, offline robots, and stale requests.

## Later (Non-MVP) Capabilities
- Seat collection
- StaffAlert collection
- AI assistant workflows
- OCR/vision event ingestion

