# 같이Go Backend — Session Memory

## Last Updated
2026-05-08

## Current Branch
develop

## Implementation Status Snapshot

### Completed through Phase 6
- Phase 4 completed: MQTT robot communication module
  - `apps/nestar-api/src/robot-comm/mqtt.types.ts`
  - `apps/nestar-api/src/robot-comm/mqtt.service.ts`
  - `apps/nestar-api/src/robot-comm/mqtt.module.ts`
  - `MqttRobotModule` registered in `AppModule`
  - `mqtt` dependency added
  - `MQTT_BROKER_URL` missing case handled safely (warning + no crash)
  - publish: `robot/{robotId}/command`
  - subscribe: `robot/{robotId}/status`, `robot/{robotId}/pose`

- Phase 5 completed: dedicated robot gateway
  - `apps/nestar-api/src/socket/robot.gateway.ts`
  - `RobotGateway` registered in `SocketModule`
  - `joinRequest` + server events (`robotPosition`, `robotStatus`, `requestUpdated`, `robotOffline`, `bookNotFound`, `deliveryReady`)

- Phase 6 completed: telemetry integration
  - MQTT pose/status telemetry updates MongoDB
  - active request status/timeline updates
  - request-scoped WebSocket emissions
  - `BOOK_NOT_FOUND` handling: fail request, set error, release robot/inventory, emit `bookNotFound` + `requestUpdated`
  - `READY` handling: emit `deliveryReady`
  - offline timeout handling: 30s timeout → robot offline + request failed + inventory release + `robotOffline` emit

- Runtime adapter fix completed
  - Fixed `server.to is not a function`
  - Root cause: Socket.IO room API used in a plain `ws` adapter setup
  - `RobotGateway` now tracks request clients manually via `Map<string, Set<WebSocket>>`

## BookInventory Pickup Model (Current)
- Removed legacy fields:
  - `mastHeightCm`
  - `forkDepthCm`
  - `gripWidthCm`
  - `requiresContainer`
  - `containerId`
- Current fixed gripper fields:
  - `gripperOpenWidthCm`
  - `gripperCloseWidthCm`
  - `gripHoldSeconds`
  - `pickupDirection`
- Mechanism notes:
  - fixed gripper only
  - no fork lift
  - no moving arm
  - robot body aligns and picks at coordinate by `pickupDirection`
  - demo currently one floor, but `floorId` remains in schema

## Request Hardening (Current)
- `cancelRequest` blocks terminal statuses:
  - `COMPLETED`, `FAILED`, `CANCELLED`
- `updateRequestStatus` guards terminal requests from duplicate updates
- `createDeliveryRequest` validates `bookCallNumber` before inventory reservation

## Current Build/Test State
- `npm run build` passes after Phase 4/5/6 implementation and gateway runtime fix.

## Runtime Verification State
- Confirmed:
  - MQTT broker connection works when local broker is running
  - MQTT subscriptions confirmed for `robot_01`:
    - `robot/robot_01/status`
    - `robot/robot_01/pose`
  - status message reception/parsing confirmed
  - WebSocket adapter mismatch found and fixed
- Remaining runtime checks:
  - resend MQTT status and confirm no `server.to` error
  - verify Request status/timeline changes end-to-end
  - verify Robot pose/status updates
  - verify `BOOK_NOT_FOUND` failure path
  - verify offline timeout path
  - verify WebSocket `joinRequest` behavior

## Next Steps
1. Finish Phase 4–6 runtime tests listed above.
2. Start Phase 7 staff/admin dashboard operations.
3. Continue demo/product flow:
   - richer demo data
   - frontend book list/detail
   - borrow/purchase actions
   - request status/history
   - robot tracking UI
   - community Twit feed/profile/comments

## Current IDs (test data)
- Book ID: `69f662844d9e6330d4a5faa9`
- LIBRARY inventory ID: `69f664874d9e6330d4a5faae`
- COMMERCIAL inventory ID: `69f664b04d9e6330d4a5fab2`
- Robot ID: `69f6670e997c6e5d143bd0d5`
- robotId string: `robot_01`
