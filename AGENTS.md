# AGENTS.md

## Commands
- **Lint/Format:** `bun run format` (Biome check + fix)
- **Typecheck:** `bun run typecheck` (all packages) or `nx run <package>:typecheck`
- **Test all:** `bun run test` or `nx run-many -t test`
- **Test single package:** `nx run <package>:test` (e.g., `nx run @packages/utils:test`)
- **Test single file:** `bun test <path>` (e.g., `bun test packages/utils/__tests__/date.test.ts`)
- **Build:** `bun run build:all`
- **Dev:** `bun run dev:dashboard` (dashboard + server) or `bun run dev:server`

## Code Style
- **Formatting:** Biome (3-space indent, 80-char line, LF endings)
- **Imports:** Auto-organized by Biome; use organized imports
- **Types:** TypeScript everywhere; explicit types/interfaces preferred
- **Naming:** camelCase (vars/functions), PascalCase (types/components/classes)
- **Error Handling:** try/catch for async ops; return typed errors via tRPC
- **React:** Function components, hooks, TanStack Router/Query conventions
- **Testing:** Bun test runner (`bun:test`); tests in `__tests__/` or `test/` dirs
- **No comments** unless explicitly requested
