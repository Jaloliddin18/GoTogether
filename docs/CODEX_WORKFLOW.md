# Codex Workflow

## Solo workflow

Use feature branches even though I work alone.

Recommended flow:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/<task-name>
```

Run Codex.

After Codex changes:

```bash
npm run build
npm run test
npm run lint
git status
git diff
```

If good:

```bash
git add .
git commit -m "<message>"
git checkout dev
git merge feature/<task-name>
git branch -d feature/<task-name>
git push origin dev
```

## Codex task pattern

For every non-trivial task:

1. Inspect only
2. Plan only
3. Implement only
4. Review changes
5. Build/test
6. Commit

## Rules

- One Codex task = one feature branch.
- Do not let Codex work directly on dev.
- Do not ask Codex to build the whole Smart Library backend at once.
- Keep tasks small:
  - Book module only
  - Robot module only
  - Request module only
  - MQTT service only
  - WebSocket gateway only
- If Codex makes bad changes before commit:
  - use `git restore .`
  - use `git clean -fd` carefully for untracked files
- If a bad commit was made:
  - use `git reset --hard HEAD~1` only if it has not been pushed/shared
