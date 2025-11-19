# Cleanup Report — backend

Generated: 2025-11-19

Summary
- depcheck found: `uuid` and `@types/uuid` as unused dependencies in the backend (`backend/depcheck-output.json`).
- ts-prune produced a list of exported symbols that may be unused (`backend/ts-prune-output.json`). Many entries are module-level or appear used; these need manual verification.
- Build artifacts removal (`backend/dist/`) already performed.

Low-risk actions (I can apply now if you approve)
- Remove `backend/dist/` (already removed).
- Remove any other generated artefacts (e.g., `*.js` files in repo `dist` folders) that are clearly build outputs and not source. I will not touch `node_modules`.

Medium-risk actions (recommend review before removing)
- Remove `uuid` and `@types/uuid` from `backend/package.json` if still present; depcheck flagged them unused. Double-check runtime code for any `uuid` usage in dynamic requires.
- Remove files flagged by ts-prune only if they have no import sites. See the `ts-prune` list in `backend/ts-prune-output.json`.

High-risk actions (manual review required)
- Any deletion of exported symbols listed by `ts-prune` must be verified across repo and external consumers (e.g., tests, deployment scripts, or external packages that may import the module by path). Many `ts-prune` hits are false-positives (some default exports or runtime references).

Findings (from checked files)
- `backend/depcheck-output.json`: shows `uuid` and `@types/uuid` reported as unused in backend.
- `backend/ts-prune-output.json`: entries found (excerpt):
  - `src\config.ts:29 - default`
  - `src\index.ts:348 - app` and `server` and `socketService`
  - `src\middleware\index.ts` many exported middlewares (rate limit, error handler, corsOptions, requestLogger, notFound)
  - `src\middleware\upload.ts` helpers: `upload`, `uploadMultiple`, `deleteFile`, `getFileUrl`
  - `src\services\challengeService.ts` validation schemas: `createChallengeSchema`, `updateChallengeSchema`, `joinChallengeSchema`, etc.
  - `src\services\socketService.ts`: `SocketService` and `getSocketService`
  - `src\utils\logger.ts`: `info`, `warn`, `error`, `debug`

Notes and rationale
- `ts-prune` reports exports that are not statically referenced by TypeScript import syntax; runtime uses, require() or reflection can make them appear unused. Manual verification is safest.
- `depcheck` is good at detecting unused dependencies but can miss cases where modules are required dynamically. `uuid` looks unused in backend per depcheck; earlier commits already removed it in some places, but confirm by checking `backend/package.json`.

Recommended next steps (pick one)
- Option A (safe, incremental) — I apply only low-risk deletions automatically now (done for `dist`), then produce a detailed per-file candidate list from `ts-prune` mapping to import locations. You review and approve medium/high risk removals.
- Option B (aggressive, but cautious) — I create a patch that removes `backend/dist/` (done), removes `uuid` from `backend/package.json` if present, and removes any files with `dist/` or other generated paths. I will run `npx tsc --noEmit` and `npx eslint . --ext .ts,.tsx --fix` afterwards and commit changes.
- Option C (full automated cleanup) — I attempt to remove all files flagged by `ts-prune` that have zero textual references across the repo (search for the exported symbol names). This is riskier and I will not do it without explicit approval.

What I can do next (I will wait for your choice)
- Produce a per-file safe-deletion patch (Option A) listing each deletion in a git patch you can review.
- Or apply Option B now and commit the changes.

Commands I will run after approval

PowerShell (run from `backend`):

```powershell
# Safe deletions and checks
Remove-Item -Recurse -Force .\dist -ErrorAction SilentlyContinue
git add -A
git commit -m "chore: remove build artifacts (dist)" || Write-Output "No changes to commit"
git push origin main
npx tsc --noEmit
npx eslint . --ext .ts,.tsx --fix
```

If you want me to proceed automatically, reply with `apply` and which option (A/B/C). If you want the per-file report first, reply `report` and I will generate a patch containing candidate deletions with usage evidence for each.
