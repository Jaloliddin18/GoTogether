# 같이Go — Testing Plan (No Physical Robot Required)

## Strategy
A fake robot simulator script replaces the physical TurtleBot 3 for all
backend and integration testing. The simulator connects to the same MQTT
broker, receives commands, and publishes realistic status and pose updates
— identical to what a real robot would send. The backend cannot distinguish
between the simulator and a real robot.

## Simulator Location
tools/robot-simulator.js

## Simulator Behavior
On receiving a DELIVERY_TASK command, the simulator publishes
status and pose updates in sequence with realistic delays:

- NAVIGATING_TO_SHELF  (after 2s)
- ARRIVED_AT_SHELF     (after 4s)
- VERIFYING_BOOK       (after 6s)
- BOOK_FOUND           (after 8s)
- PICKING_UP           (after 10s)
- DELIVERING           (after 14s)
- ARRIVED_AT_STUDENT   (after 18s)
- READY                (after 20s)

Pose updates publish every 1 second with gradually moving x/y values.

Failure scenarios the simulator can trigger on demand:
- BOOK_NOT_FOUND — publish this state instead of BOOK_FOUND
- ROBOT_OFFLINE — stop publishing (triggers backend timeout)
- NAVIGATION_FAILED — publish this state after NAVIGATING_TO_SHELF

## Testing Layers

### Layer 1 — Build and Unit (available now)
- npm run build passes
- All GraphQL operations return correct shapes
- Request status transitions are guarded correctly
- Follow and Twit operations work correctly

### Layer 2 — API Testing via Postman (available now)
- createBook, createBookInventory, createRobot
- BORROW flow: createDeliveryRequest → status = QUEUED → ASSIGNED
- PURCHASE flow: same as BORROW with COMMERCIAL inventory
- cancelRequest on active, failed, and completed requests
- Twit: createTwit, likeTwit, deleteTwit, getTwits feed
- Follow: followMember, unfollowMember, getFollowers, checkFollowing

### Layer 3 — MQTT Integration (available after Phase 4)
Prerequisites:
- Mosquitto broker running locally (brew install mosquitto)
- Simulator running: MQTT_BROKER_URL=mqtt://localhost node tools/robot-simulator.js

Steps:
1. Create a BORROW request via Postman
2. Watch backend logs confirm:
   - MQTT command published to robot/robot_01/command
   - STATUS received: NAVIGATING_TO_SHELF
   - STATUS received: BOOK_FOUND
   - POSE received with x and y values
3. Check MongoDB — Robot.currentPose updated
4. Check MongoDB — Request.status updated at each step
5. Check MongoDB — Request.timeline entries appended

### Layer 4 — WebSocket Live Tracking (available after Phase 5 and Phase 6)
Steps:
1. Open browser on /track page
2. Join room request:{requestId}
3. Confirm events arrive in real time:
   - robotPosition fires every 1 second
   - robotStatus fires on each state change
   - requestUpdated fires on each status change
   - deliveryReady fires when state = READY
4. Stop the simulator to test offline detection:
   - Backend detects timeout after 30 seconds
   - robotOffline WebSocket event fires
   - Request status moves to FAILED

### Layer 5 — Failure Scenarios (available after Phase 6)
BOOK_NOT_FOUND:
- Simulator publishes BOOK_NOT_FOUND state
- Request moves to FAILED
- bookNotFound WebSocket event fires
- Inventory released back to available
- Robot returns to IDLE

ROBOT_OFFLINE:
- Simulator stops publishing
- 30 second timeout triggers
- Request moves to FAILED with ROBOT_OFFLINE error
- robotOffline WebSocket event fires
- Inventory and robot released

cancelRequest while active:
- Backend publishes to robot/robot_01/cancel
- Simulator receives cancel and stops
- Request moves to CANCELLED
- Inventory and robot released

### Layer 6 — Full End to End Demo Flow (available after frontend)
1. Open library website as student
2. Search for a book
3. Choose BORROW or PURCHASE
4. Request created — status shows QUEUED then ASSIGNED
5. Navigate to /track page
6. Robot dot moves on SVG floor plan in real time
7. Status badge updates at each step
8. deliveryReady notification appears
9. Request marked COMPLETE

## Prerequisites Per Layer

| Layer | Requires |
|---|---|
| 1 | npm run build |
| 2 | MongoDB Atlas + Postman |
| 3 | Phase 4 MQTT module + Mosquitto + simulator |
| 4 | Phase 5 WebSocket gateway + Phase 6 integration |
| 5 | Phase 6 + offline timeout handler |
| 6 | All phases + frontend complete |

## Running the Simulator
Install dependencies (mqtt package only, no extra installs needed):
```bash
cd tools
node robot-simulator.js
```

Environment variable required:

## When Physical Robot Arrives
Replace the simulator with the real TurtleBot 3.
No backend code changes are needed.
Seed real shelf and desk coordinates into MongoDB via createBookInventory.
The MQTT contract is already implemented and the robot just needs to
publish to the same topics with the same payload shapes.
