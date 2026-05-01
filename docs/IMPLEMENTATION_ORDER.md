# Smart Library Backend Implementation Order

## Purpose
Step-by-step backend roadmap for safe incremental delivery.

## Phase 1: Book Module
- Create schema
- Create resolver
- Create service
- Add DTOs/input models
- Implement search
- Implement get by id
- Implement create book for admin/staff
- Seed sample books

## Phase 2: Robot Module
- Create schema
- Create resolver
- Create service
- Implement create robot
- Implement get robots
- Implement internal robot status/pose updates

## Phase 3: Request Module (Without MQTT)
- Create request
- Validate book
- Assign robot
- Update statuses
- Add fake dispatch logic

## Phase 4: MQTT
- Install/use `mqtt` only when needed
- Create `robot-comm` module
- Publish command payloads
- Subscribe to status/pose/event topics
- Add fake robot simulator

## Phase 5: WebSocket Tracking
- Add dedicated robot gateway
- Add `joinRequest`
- Add `robotPosition`
- Add `robotStatus`
- Add `requestUpdated`
- Add `robotOffline`

## Phase 6: Integration
- Use MQTT status to update `Request` and `Robot`
- Emit live tracking events from backend
- Implement offline timeout handling
- Implement failure handling paths

## Phase 7: Staff Dashboard Operations
- Active requests view operations
- Robot health operations
- Failed request monitoring operations
- Book availability monitoring operations

## Out of Scope Until MVP Works
Do not implement AI assistant, OCR, YOLO, ROS code, or multi-floor optimization before the MVP flow works end-to-end.

