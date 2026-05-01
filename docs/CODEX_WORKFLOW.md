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

Preferred commit format:
- `Add backend book module`
- `Add backend robot module`
- `Add backend request lifecycle`
- `Add frontend book search page`
- `Add frontend tracking page`
- `Fix frontend book search loading state`
- `Update Smart Library docs`

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
