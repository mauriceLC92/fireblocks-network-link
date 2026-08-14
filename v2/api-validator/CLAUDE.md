# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Setup

```bash
nvm use           # Node.js 18.14.2
npm install
cp .env.mockserver .env   # quick start against mock server
```

## Common Commands

```bash
npm run server                           # Start mock server (Fastify, port 8000)
npm test                                 # Sanity tests first, then full suite
npm run test:server -- --testPathPattern=ramps   # Run a single test file
npm run test:self                        # Unit tests for this tool's internals
npm run lint:fix
npm run make-unified-openapi             # Regenerate fb-unified-openapi.yaml after editing spec files
npm run generate-openapi-client          # Regenerate src/client/generated/ (requires Docker for linting)
```

## Architecture

### Mock Server

**Request lifecycle**: every request passes through `src/server/routes.ts` which runs five `preHandler` hooks (signature verify → nonce → timestamp → API key → pagination), then dispatches to a handler.

**Handler registration** (`src/server/routes.ts`): on startup, iterates all OpenAPI endpoint schemas and looks up `Handlers[operationId]` from `src/server/handlers/index.ts`. If the export is missing, a dummy handler (200 or 404) is registered with a warning. To add a new handler: export a function whose name exactly equals the endpoint's `operationId` from one of the `*-handlers.ts` files, then re-export it from `index.ts`. Commenting out a line in `index.ts` silently degrades that endpoint to a dummy.

**Per-account state**: `ControllersContainer<T>` (`src/server/controllers/controllers-container.ts`) lazily creates one controller per account ID. `Repository<T>` provides in-memory CRUD. All state resets on server restart.

**Capability presets**: if `CAPABILITIES_DIR` is set (default `capability-presets/all-capabilities`), the mock server reads JSON files from that directory to pre-populate accounts and capabilities. Without a preset, data is randomly generated via `json-schema-faker`.

### Client / Tests

**`SecureClient`** (`src/client/SecureClient.ts`) wraps the generated OpenAPI client, automatically injecting the four security headers (`X-FBAPI-KEY`, `X-FBAPI-NONCE`, `X-FBAPI-TIMESTAMP`, `X-FBAPI-SIGNATURE`) on every request using `src/security/`.

**Test capability skipping**: `tests/setup/preload-capabilities.ts` (Jest global setup) fetches capabilities and caches them. Tests call `hasCapability(component)` / `getCapableAccountId(component)` from `tests/utils/capable-accounts.ts` and use `describe.skipIf` / `it.skipIf` (defined in `tests/setup/conditional-tests.ts`) to skip suites for API components the server doesn't support.

**Schema-driven faking**: `src/schemas.ts` exposes `fakeSchemaObject(name)` which generates a valid fake object from the OpenAPI component schema. Used by mock handlers to return realistic data without hard-coding fixtures.

### Scripts

All scripts use `scripts/_shared.ts`, which exports `makeClient()`, `printConfig()`, `requireAccountId()`, `loadPayload()`, and `run(fn, outputFile?)`. `run()` initialises schemas, calls `fn`, pretty-prints the result, and optionally saves it to `scripts/output/` (gitignored).

`requireAccountId(usage, expectedArgs?)` takes the account ID from `ACCOUNT_ID` in the active env file, overridden by the first positional argument. For scripts taking a second positional argument (`get-ramp`, `get-rate`, `get-quote`), pass `expectedArgs = 2` and read the second with `positionalArg(1, 2)` — that keeps `<accountId> <rampId>` and bare `<rampId>` both working.

`positionalArgs()` strips every `--flag` and its value, so flag position never shifts those positional indexes; `flagValue(name)` reads one, accepting both `--name value` and `--name=value`. Anything reading `process.argv` directly re-introduces the bug where a flag is miscounted as the account ID — `tests/self-tests/script-args.test.ts` pins the rules. `get-account-rate.ts` shows the pattern for a script whose argument count depends on which flags were passed.

Request bodies are JSON files in `scripts/payloads/`, named `<script>.<variant>.json`. Scripts declare a `DEFAULT_PAYLOAD` and call `loadPayload(name, { idempotencyKey: true })`; the payload is overridden by `--payload <name>` or the `PAYLOAD` env var (which also accepts an absolute path). `loadPayload` strips the `$comment` key and injects a fresh `idempotencyKey` when asked. Never reintroduce inline request consts — the UI reads the same files, so a second copy would drift.

Liquidity scripts (`scripts/liquidity/`) have no npm aliases — run with `ts-node scripts/liquidity/<script>.ts` directly.

### Script runner UI

`npm run scripts:ui` starts a loopback-only Fastify server (`scripts/ui/server.ts`, port 8100, `UI_PORT` to override) serving `scripts/ui/index.html`. It spawns the same `ts-node scripts/...` commands as the CLI aliases and streams stdout/stderr to the browser, so UI and CLI behaviour can't diverge.

`scripts/ui/manifest.ts` lists the runnable scripts; add an entry there when adding a script. `payloadPrefix` makes the UI offer every matching file in `scripts/payloads/`, `extraArg` adds a second positional input, and `mutates: true` flags scripts that create resources. Environments are discovered from `.env.<target>` files; only `SERVER` and `ACCOUNT_ID` are exposed to the browser, never credentials. Targets named `production`/`prod` sort last and require a confirming second click on Run.

`GET/PUT/POST/DELETE /api/payloads/:name` back the payload list, so New/Clone/Delete write real files under `scripts/payloads/`; `resolvePayloadPath` rejects any name that escapes that directory or nests deeper than one level. The page is a single dependency-free `index.html`: unsaved edits live in `localStorage` per payload, the selected request is in the URL hash, and the result panel parses the output format `scripts/_shared.ts` prints (`Response:`, `Error:`, `Request:`, `Output saved to:`) — changing those lines changes what the UI can show.

### Configuration

`src/config/index.ts` uses `convict`. An optional `src/config/{NODE_ENV}.json` file can override any convict default (loaded at startup if it exists). Key env vars: `SERVER` (required), `API_KEY` (required), `SIGNING_ALGORITHM` (hmac/rsa/ecdsa), `CAPABILITIES_DIR`.

## OpenAPI Workflow

1. Edit `../openapi/fb-provider-*-api.yaml`
2. `npm run make-unified-openapi` → updates `fb-unified-openapi.yaml`
3. `npm run generate-openapi-client` → updates `src/client/generated/` (runs Docker lint first)
4. Restart server and run tests

**Never edit** `fb-unified-openapi.yaml` or `src/client/generated/` directly.
