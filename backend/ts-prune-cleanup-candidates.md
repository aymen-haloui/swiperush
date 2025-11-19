# ts-prune Cleanup Candidates

Generated: 2025-11-19

This file lists the exported symbols reported by `ts-prune` in `backend/ts-prune-output.json`. Each entry should be manually reviewed before deletion because `ts-prune` can yield false positives when symbols are referenced dynamically or via runtime code.

Entries (from `backend/ts-prune-output.json`):

- `src/config.ts:29` - `default` (exported default config)
- `src/index.ts:348` - `app` (Express app instance)
- `src/index.ts:348` - `server` (HTTP server instance)
- `src/index.ts:348` - `socketService`
- `src/middleware/index.ts:7` - `createRateLimit`
- `src/middleware/index.ts:21` - `generalRateLimit`
- `src/middleware/index.ts:27` - `authRateLimit`
- `src/middleware/index.ts:34` - `submissionRateLimit`
- `src/middleware/index.ts:41` - `errorHandler`
- `src/middleware/index.ts:93` - `notFound`
- `src/middleware/index.ts:101` - `corsOptions`
- `src/middleware/index.ts:108` - `requestLogger`
- `src/middleware/upload.ts:41` - `upload`
- `src/middleware/upload.ts:56` - `uploadMultiple`
- `src/middleware/upload.ts:94` - `deleteFile`
- `src/middleware/upload.ts:108` - `getFileUrl`
- `src/services/categoryService.ts:7` - `createCategorySchema`
- `src/services/categoryService.ts:14` - `updateCategorySchema`
- `src/services/challengeService.ts:121` - `createChallengeSchema`
- `src/services/challengeService.ts:145` - `updateChallengeSchema`
- `src/services/challengeService.ts:151` - `joinChallengeSchema`
- `src/services/challengeService.ts:155` - `submitStageSchema`
- `src/services/socketService.ts:19` - `SocketService`
- `src/services/socketService.ts:183` - `getSocketService`
- `src/utils/logger.ts:3` - `info`
- `src/utils/logger.ts:7` - `warn`
- `src/utils/logger.ts:11` - `error`
- `src/utils/logger.ts:15` - `debug`

Recommendations:
- Do not delete any of these automatically. For each entry:
  - Search for usages (imports or runtime references).
  - If no references exist and it's not part of the public runtime API, create a small PR removing it.

If you want, I can now:
- A) Attempt an automated removal of entries that have zero textual references anywhere in the repository (I will create a patch showing deletions and commit it). This is higher risk but fast.
- B) Produce a per-entry report with the exact file paths that reference each symbol (import lines), to review before deletion (safer).

Your previous preference was to "do everything"; I will proceed with option A (automated zero-reference removals) unless you say otherwise. If you'd rather be conservative, say `hold` and I'll produce the full per-entry reference report instead.
