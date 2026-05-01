# Backend Architecture

## Purpose
Short architecture document for the Smart Library backend.

## Backend Role
The backend is the orchestration layer, not the robot motor controller.

## Responsibilities
- Book catalog search
- Request validation
- Robot assignment
- Request lifecycle management
- MQTT command publishing
- MQTT telemetry receiving
- WebSocket live tracking
- MongoDB persistence
- Staff monitoring operations

## Architecture Flow
```text
Frontend
→ GraphQL/HTTP
→ NestJS API
→ MongoDB

NestJS API
→ MQTT
→ Mosquitto/Raspberry Pi
→ ROS 2/TurtleBot

ROS 2/TurtleBot
→ MQTT status/pose
→ NestJS API
→ WebSocket
→ Frontend tracking page
```

## Protocol Separation
- GraphQL: normal data operations (books, robots, requests, admin queries)
- WebSocket: live tracking events and status streaming
- MQTT: backend-to-robot commands and robot telemetry

