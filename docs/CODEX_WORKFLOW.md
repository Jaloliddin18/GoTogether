# Codex Workflow

## Solo dev branch workflow

I am working alone and may work directly on `dev`.

Before any Codex coding task:
- Check current branch with `git branch --show-current`.
- Check working tree with `git status`.
- If there are existing uncommitted changes, warn me before editing.

## Codex commit policy

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

## If I explicitly request auto-commit

If my prompt includes:
`commit after successful build`

Then Codex may:
1. Run build/lint/test as requested.
2. Commit only if verification passes or only pre-existing unrelated failures are clearly identified.
3. Use a clean descriptive commit message.
4. Never push unless I explicitly ask.

## Push policy

Codex must not run `git push` unless I explicitly ask.

## Bad change recovery

If Codex makes bad changes before commit, suggest:
- `git restore .`
- `git clean -fd` only if I want to remove untracked files

If a bad commit was made and not pushed, suggest:
- `git reset --soft HEAD~1` to keep changes
- `git reset --hard HEAD~1` only if I want to discard changes completely

## Codex task pattern

For every non-trivial task:
1. Inspect only
2. Plan only
3. Implement only
4. Review changes
5. Build/test
6. Commit

## Scope rules

- Do not ask Codex to build the whole Smart Library backend at once.
- Keep tasks small and isolated.

## Migration strategy

The goal is to transform the existing real-estate GoTogether project into the 같이Go Smart Library Robot Delivery project.

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
- First build working Smart Library MVP.
- Then update navigation/homepage to Smart Library.
- Then remove old real-estate files only after checking imports and build.
- Remove old files gradually, one domain area at a time.

### 4) Codex removal rule
When removing old real-estate code later, Codex must:
- Search for imports/usages first
- List files to delete
- Explain risk
- Ask for confirmation
- Run build after deletion
- Never delete large folders without confirmation

---

## Session Note (2026-05-25) — LostItem Phase 1 workflow boundary

For night patrol lost-item backend work, keep implementation split into safe phases:
1. Phase 1: schema/enums/dto/service/resolver/module registration + admin query/status update only.
2. Phase 2: MQTT subscription and persistence flow.
3. Phase 3: snapshot upload API path.
4. Later: frontend/admin review UI.

Phase 1 guardrails:
- Do not change existing request/delivery status logic.
- Do not modify MQTT runtime service in Phase 1.
- Do not modify upload behavior in Phase 1.
- Always run `npm run build` after Phase 1 backend changes.

---

## Session Note (2026-05-26) — LostItem Phase 2 workflow boundary

For LostItem Phase 2 backend work:
- Extend MQTT handling only for patrol lost-item ingestion (`robot/{robotId}/lost-item`).
- Preserve existing status/pose MQTT runtime behavior as-is.
- Save valid patrol events to `lostItems` collection only.
- Drop malformed payloads with warnings; never crash backend telemetry pipeline.
- Do not add image upload API in Phase 2.
- Do not add frontend changes in Phase 2.
- Run `npm run build` after MQTT/LostItem integration edits.

---

## Session Note (2026-05-26) — LostItem Phase 3 workflow boundary

For LostItem Phase 3 backend work:
- Add only a lost-item-specific snapshot upload API.
- Keep existing generic member upload mutations unchanged.
- Keep existing MQTT status/pose/lost-item ingestion behavior unchanged.
- Keep upload destination constrained to `uploads/lost-items` only.
- Validate file type to png/jpg/jpeg and enforce size limit aligned with existing upload config.
- Return backend-consumable relative paths (for media resolver compatibility).
- Do not create LostItem DB records from upload mutation (DB creation remains MQTT-event flow).
- Do not add frontend changes in Phase 3.
- Do not add Python vision module changes in Phase 3.
- Run `npm run build` after upload API integration edits.
