# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What lives here

OpenAPI 3.0.0 spec files for the Fireblocks Provider Connectivity API v2. All edits happen here; the generated outputs live in `../api-validator/`.

| File | Purpose |
|------|---------|
| `fb-provider-api.yaml` | Base spec: capabilities, accounts, balances, rates. Defines all shared parameters, pagination, security headers, and common schemas referenced by the other files. |
| `fb-provider-transfer-api.yaml` | Deposit/withdrawal operations (blockchain, fiat, internal, P2P). |
| `fb-provider-trading-api.yaml` | Trading operations. |
| `fb-provider-collateral-api.yaml` | Off-Exchange / collateral integration (bidirectional). |
| `fb-provider-liquidity-api.yaml` | Liquidity operations. |
| `fb-provider-ramp-api.yaml` | On-ramp / off-ramp / bridging (active development). |
| `fb-provider-subscription-api.yaml` | Subscription operations. |
| `fb-unified-openapi.yaml` | **Auto-generated. Never edit directly.** |

## Modular spec conventions

Each optional spec (`fb-provider-*-api.yaml`) uses a local `x-path-params` / `x-query-params` / `x-security-headers` block at the top to alias cross-file `$ref`s (e.g. `$ref: "./fb-provider-api.yaml#/components/parameters/X-FBAPI-KEY"`). Endpoints then reference `$ref: "#/x-security-headers/..."`. This pattern keeps individual files valid YAML while avoiding duplication.

**Linting rules** (`fireblocks-openapi-ruleset.yaml`) enforce:
- Every operation must declare all four security headers (`X-FBAPI-KEY`, `X-FBAPI-NONCE`, `X-FBAPI-TIMESTAMP`, `X-FBAPI-SIGNATURE`).
- All response body schemas must be `type: object` (no primitives or arrays at the top level).
- `readOnly` / `writeOnly` are forbidden on properties.
- `operationId` and tag names must be camelCase.

## Workflow after editing

```bash
cd ../api-validator

# 1. Regenerate the unified spec
npm run make-unified-openapi

# 2. Lint (requires Docker)
cd ../openapi && ./lint-openapi.sh

# 3. Regenerate the TypeScript client
cd ../api-validator && npm run generate-openapi-client

# 4. Restart mock server and run tests
npm run server   # separate shell
npm test
```

## Adding a new endpoint

1. Add the path + operation to the relevant `fb-provider-*-api.yaml`.
2. Reference security headers via the local `x-security-headers` alias block (copy the pattern from any existing operation).
3. Give the operation a camelCase `operationId` — the mock server auto-registers handlers by this name.
4. Run the workflow above. The mock server will log a warning for any `operationId` without a matching handler in `../api-validator/src/server/handlers/`.