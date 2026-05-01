# GraphQL Contract

## Purpose
This backend is GraphQL-first. Use GraphQL for normal app data such as books, robots, requests, and staff dashboard queries.

Do not use GraphQL for live robot position streaming in the MVP.
Use WebSocket for live robot tracking.
Use MQTT for backend-to-robot communication.

## Book operations

Queries:
- getBooks
- getBook

Mutations:
- createBook
- updateBook
- updateBookAvailability

Search/filter support:
- title
- author
- isbn
- callNumber
- category
- available
- bookStatus

## Robot operations

Queries:
- getRobots
- getRobot

Mutations:
- createRobot
- updateRobotStatus
- updateRobotPose

Note:
Robot status/pose mutations are mainly for internal testing or staff operations. Real robot telemetry should eventually come through MQTT.

## Request operations

Queries:
- getRequest
- getSessionRequests
- getActiveRequests

Mutations:
- createDeliveryRequest
- cancelRequest

## Staff operations

Queries:
- getRobotHealth
- getFailedRequests
- getBookAvailabilitySummary

Mutations:
- updateBookAvailability
- markRequestFailed
- resetRobotState

## Naming rules

- Follow existing resolver/service/input/output patterns in this repo.
- Prefer names that match existing GraphQL style.
- Do not introduce REST controllers unless explicitly requested.
- Do not introduce GraphQL subscriptions for MVP unless explicitly requested.
