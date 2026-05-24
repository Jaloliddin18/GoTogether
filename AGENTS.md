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
- Backend build command is `npm run build`.
- Keep Groq API access backend-only; do not expose `GROQ_API_KEY` to frontend code.
- Chatbot module lives under `apps/nestar-api/src/components/chat/`.
- Chatbot REST endpoint is `POST /chat/message`.
- Chatbot response shape is `{ reply: string, books: ChatBookSuggestion[] }`.
- Keep chatbot book answers grounded in live DB retrieval from the `Book` collection only when the current user message asks for book/catalog results.
- Do not return fallback active books as UI suggestions for unrelated chat questions.
- Do not reintroduce the old general `SocketGateway` for chatbot work.
- Do not touch `apps/nestar-api/src/socket/robot.gateway.ts` for chatbot work.

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

## Migration Principle
The goal is to transform the existing real-estate Nestar project into the 같이Go Smart Library Robot Delivery project.

### 1) Keep useful infrastructure
- NestJS/Next.js project structure
- GraphQL/Apollo setup
- MongoDB/Mongoose setup
- Auth/JWT/roles
- Layouts
- Admin structure
- Shared UI patterns
- Styling system

### 2) Replace domain-specific real-estate features
- Property domain becomes Book/Catalog domain
- Property detail becomes Book detail
- Property search becomes Book search
- Property admin becomes Book availability/admin
- Agent pages may be removed or repurposed later
- Real-estate homepage sections should later become Smart Library homepage sections

### 3) Removal policy
- Do not delete old real-estate modules/pages first.
- First build a working Smart Library MVP.
- Then update navigation/homepage to Smart Library.
- Then remove old real-estate files only after checking imports and build.
- Remove old files gradually, one domain area at a time.

### 4) Codex rule for later real-estate removal
When removing old real-estate code later, Codex must:
- Search for imports/usages first
- List files to delete
- Explain risk
- Ask for confirmation
- Run build after deletion
- Never delete large folders without confirmation

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

## Solo Dev Branch Workflow
I am working alone and may work directly on `dev`.

Before any Codex coding task:
- Check current branch with `git branch --show-current`.
- Check working tree with `git status`.
- If there are existing uncommitted changes, warn me before editing.

## Codex Commit Policy
Codex may prepare commits, but should not commit blindly.

After implementing a task, Codex should:
1. Run the relevant verification command:
2. backend: `npm run build`, plus `npm run test` or `npm run lint` if relevant
3. frontend: `yarn build`, plus `yarn lint` or `yarn test` if relevant
4. Run `git status`.
5. Show a concise summary of changed files.
6. Show the proposed commit message.
7. Ask for confirmation before committing, unless my prompt explicitly says `commit after successful build`.

Commit message standard:
- Use only `feat:` or `fix:` prefixes.
- Do not use `docs:`, `refactor:`, `chore:`, `test:`, `style:`, or any other prefix.

Use `feat:` for adding, removing, or changing planned project functionality.
- `feat: add backend book module`
- `feat: add backend robot module`
- `feat: add backend request module`
- `feat: add backend book inventory module`
- `feat: remove backend agent role`
- `feat: add frontend book search page`

Use `fix:` for bug fixes, build errors, broken logic, DTO/schema mistakes, and incorrect fields.
- `fix: resolve book dto build error`
- `fix: correct request status logic`
- `fix: restore backend build after enum change`
- `fix: correct book inventory field names`

## If I Explicitly Request Auto-Commit
If my prompt includes `commit after successful build`, Codex may:
1. Run build/lint/test as requested.
2. Commit only if verification passes or only pre-existing unrelated failures are clearly identified.
3. Use a clean descriptive commit message.
4. Never push unless I explicitly ask.

## Push Policy
Codex must not run `git push` unless I explicitly ask.

## Bad Change Recovery
If Codex makes bad changes before commit, suggest:
- `git restore .`
- `git clean -fd` only if I want to remove untracked files

If a bad commit was made and not pushed, suggest:
- `git reset --soft HEAD~1` to keep changes
- `git reset --hard HEAD~1` only if I want to discard changes completely

---

## Session Update (2026-05-19) — Robot lifecycle automation + simulator command listener

### Completed
- `updateRequestStatus(COMPLETED)` lifecycle now supports automatic robot transition:
  - emit completion update
  - release robot
  - assign next queued request if available
  - otherwise set robot to `RETURNING` and publish `RETURN_TO_DOCK` command.
- MQTT telemetry resolution was extended so post-completion movement can continue to reach the same request room for frontend tracking continuity.
- Terminal request statuses are protected from non-terminal rollback during late telemetry.
- Simulator script was upgraded:
  - kept one-shot/manual mode
  - added persistent listener mode (`--listen=true`) that subscribes to `robot/<robotId>/command`
  - supports `DELIVERY_TASK` and `RETURN_TO_DOCK`
  - prevents overlapping runs while robot is busy
  - keeps `state` field in status payloads and continuous pose publishing.

### Operational rule from this session
- For realistic demos, start simulator once in listener mode and trigger movement by creating requests or completing requests; avoid manual per-request one-shot publishing.

---

## Session Update (2026-05-24) — Admin bookLikes sort validation

### Completed
- Added `bookLikes` to `availableBookSorts` in `apps/nestar-api/src/libs/config.ts`.
- This allows admin `GET_ALL_BOOKS_BY_ADMIN` queries to sort by `bookLikes`, required by the frontend admin dashboard `Top Liked Books` ranked list.

### Verification
- `npm run build` passed after the validation change.

### Key rule
- When frontend admin dashboards add ranked book widgets, ensure the requested sort field is included in backend `availableBookSorts`; otherwise GraphQL validation returns `Bad Request Exception` before the service runs.
