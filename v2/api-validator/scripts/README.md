# Scripts

Utility scripts for manually hitting a live server. Useful for exploratory testing, debugging, and inspecting real responses.

All scripts read connection and auth config from the environment (`.env` file or environment variables). See `env.example` in the project root for available options.

## Setup

Clone the repo and install the dependencies.

```bash
git clone git@github.com:mauriceLC92/fireblocks-network-link.git
cd fireblocks-network-link/v2/api-validator
nvm use          # Node 18.14.2
npm install
```

Create one env file per server you hit. Never commit these files — `.gitignore` already covers them.

```bash
cp env.example .env.staging      # staging server
cp env.example .env.production   # production, for read-only scripts
```

Each file needs the variables below. The signing settings are the same for staging and production:

```bash
SERVER=                      # the base URL of the server
ACCOUNT_ID=                  # the account the scripts operate on
API_KEY=                     # your API key
SIGNING_PRIVATE_KEY=         # the HMAC secret

SIGNING_ALGORITHM=hmac
SIGNING_HASH_ALGORITHM=sha256
SIGNING_PRE_ENCODING=base64
SIGNING_POST_ENCODING=base64
REJECT_UNAUTHORIZED=false    # staging only, for a self-signed TLS certificate
```

### Credentials to share

Four values differ per person or per environment.

| Variable | Where to get it | Secret? |
| --- | --- | --- |
| `SERVER` | Ask a teammate | No |
| `ACCOUNT_ID` | Ask a teammate | No |
| `API_KEY` | Create your own in the admin dashboard | Yes |
| `SIGNING_PRIVATE_KEY` | Create your own in the admin dashboard | Yes |

Create your own key and secret per environment. Never send either one over chat or email, and never commit them.

Leave `REJECT_UNAUTHORIZED` out of `.env.production`.

### Check the setup

Run a read-only script. It prints the server URL and account ID it resolved, then the response:

```bash
TARGET=staging npm run scripts:accounts
```

Pick an env file per run with `TARGET`:

```bash
TARGET=staging npm run scripts:accounts
TARGET=production npm run scripts:list-ramps
TARGET=staging npm run scripts:ui
```

With no `TARGET`, the scripts fall back to plain `.env`.

## Production

Production moves real money. Two rules:

1. Run only the read-only scripts against production. `PROD_READ_SCRIPTS.md` lists every one of them.
2. Check the printed `Target:` and `Account ID:` lines before you trust a result.

The runner UI sorts production last, marks it red, and needs a second click on Run to confirm.

## Before you push

This repo is public. Check your staged changes for personal data first:

```bash
npm run check-pii
```

See `WORKFLOW.md` in the repo root for the full rules.

## Web UI

```bash
npm run scripts:ui   # then open http://127.0.0.1:8100
```

A local-only page for picking a script, an environment, and a payload, then watching the output stream in the browser. It shells out to the same `ts-node scripts/...` commands as the CLI aliases, so the two can't disagree about what gets sent.

- **Environments** are discovered from your `.env.<target>` files. Each one's `SERVER` and `ACCOUNT_ID` are shown so you can see what you're about to hit.
- **Production** is sorted last, highlighted in red, and needs a second click on the Run button to confirm.
- **Payloads** are listed per script from `scripts/payloads/`. The body is editable: edits apply to that run only, unless you press **Save payload** to write them back to the file (where the CLI will pick them up too).
- Credentials are never sent to the browser — only the resolved server URL and account ID.

Binds to `127.0.0.1` only. Override the port with `UI_PORT`.

## Account ID

Set `ACCOUNT_ID` in each `.env.<target>` file and you can omit `<accountId>` from every command:

```bash
TARGET=staging npm run scripts:list-ramps          # uses ACCOUNT_ID from .env.staging
TARGET=staging npm run scripts:list-ramps -- <id>  # explicit argument still wins
```

## Payloads

Request bodies live in `scripts/payloads/` as JSON, one file per scenario, named `<script>.<variant>.json`. Each script has a default; override it with `--payload`:

```bash
npm run scripts:momo-offramp -- --payload momo-offramp.zmw-airtel
npm run scripts:create-quote -- --payload quote.usdc-zar-offramp
```

Pass a name that doesn't exist to print the full list. A `$comment` key is allowed in any payload for notes and is stripped before the request is sent. Ramp-creation scripts get a fresh `idempotencyKey` on every run, so each run creates a new ramp; to test idempotency instead, hard-code an `idempotencyKey` in the payload file and run it twice.

### Private payloads

Every committed payload uses placeholder names, phone numbers, emails and account numbers. This repo is public, so never commit a real person's details.

Keep payloads with live details in `scripts/payloads/private/`. That directory is gitignored. Both the CLI and the UI list its files with a `private/` prefix:

```bash
npm run scripts:lbt-offramp -- --payload private/lbt-offramp.bwp-fnb-prod
```

To set one up:

1. Copy a committed payload into `scripts/payloads/private/`.
2. Replace the placeholder details with the real ones.
3. Ask a teammate for any shared value you need, such as a partner ID.

## Output files

Each script automatically saves its response as pretty-printed JSON to `scripts/output/`. The directory is created on first run and is gitignored. Filenames follow the pattern `<category>-<operation>[-<args>].json`. With `TARGET=production`, output goes to `scripts/output/production/` instead.

## Scripts

### Accounts

**List all accounts**
```bash
npm run scripts:accounts
# Output: scripts/output/accounts-list.json
```

---

### Capabilities

`<accountId>` is optional everywhere below when `ACCOUNT_ID` is set for the target.

**Get ramp methods for an account**
```bash
npm run scripts:ramps-caps -- <accountId>
# Output: scripts/output/capabilities-ramps-caps-<accountId>.json
```

**Check ramp capabilities** — summarises on-ramp / off-ramp / bridge entries
```bash
npm run scripts:check-ramps-caps -- <accountId>
```

**Liquidity quote capabilities**
```bash
npm run scripts:liquidity-quote-caps
npm run scripts:check-liquidity-quote-caps   # summarises fiat→crypto entries
```

**Additional assets**
```bash
npm run scripts:additional-assets
npm run scripts:asset-details -- <assetId>
```

---

### Ramps

**List all ramps for an account**
```bash
npm run scripts:list-ramps -- <accountId>
# Output: scripts/output/ramps-list-<accountId>.json
```

**Get a specific ramp**
```bash
npm run scripts:get-ramp -- <accountId> <rampId>
# Output: scripts/output/ramps-get-<accountId>-<rampId>.json
```

**Create a quote**
```bash
npm run scripts:create-quote -- [--payload quote.<variant>]
# Payloads: quote.ngn-usdc (default), quote.ugx-usdt-onramp, quote.usdc-zar-offramp
# Output: scripts/output/ramps-create-quote-<accountId>.json
```

**Create a MoMo on-ramp**
```bash
npm run scripts:momo-onramp -- [--payload momo-onramp.<variant>]
# Payloads: momo-onramp.ugx-partner (default), momo-onramp.kes-test
# Output: scripts/output/ramps-create-momo-onramp-<accountId>.json
```

**Create a MoMo off-ramp**
```bash
npm run scripts:momo-offramp -- [--payload momo-offramp.<variant>]
# Payloads: momo-offramp.xof-wave (default), .kes-mpesa, .kes-partner-email-repro,
#           .zmw-airtel, .zar-default, .bwp-orange-prod
```

**Create an LBT on-ramp**
```bash
npm run scripts:lbt-onramp -- [--payload lbt-onramp.<variant>]
# Payloads: lbt-onramp.ngn-usdc (default), lbt-onramp.zar-test
```

**Create an LBT off-ramp**
```bash
npm run scripts:lbt-offramp -- [--payload lbt-offramp.<variant>]
# Payloads: lbt-offramp.zar-test (default), .xof-bank, .bwp-fnb-prod
```

**Create a bridge ramp (crypto → crypto)**
```bash
npm run scripts:bridge-ramp -- [--payload bridge-ramp.usdt-usdc]
```

---

### Rates

**Get rate for an account by pair ID**
```bash
npm run scripts:get-rate -- <accountId> <rampsPairId>
# Output: scripts/output/rates-get-<accountId>-<pairId>.json
```

The endpoint accepts three kinds of pair. Pass exactly one:

| Argument | Pair type |
| --- | --- |
| `<rampsPairId>`, or `--rampsPairId=<id>` | A ramps pair |
| `--conversionPairId=<id>` | A conversion pair |
| `--orderBookPairId=<id>` | An order book pair |

A bare argument counts as a ramps pair ID, which is the common case.

```bash
npm run scripts:get-rate -- --conversionPairId=BTC_USD
npm run scripts:get-rate -- --orderBookPairId=BTC_USDT
```

The script stops when you pass two pair types. Your provider may not support all three.

---

### Liquidity

No npm aliases yet — run these directly.

**Create a liquidity quote**
```bash
ts-node scripts/liquidity/create-quote.ts [accountId] [--payload liquidity-quote.usdc-zar]
```

The payload's `id` field must be a capability ID from `GET /capabilities/liquidity/quotes`.

**Get a specific quote**
```bash
ts-node scripts/liquidity/get-quote.ts [accountId] <quoteId>
```

---

## Typical workflow

```bash
# 1. Find your account ID (then set ACCOUNT_ID in .env.<target> to skip passing it)
npm run scripts:accounts

# 2. Check what ramp methods are available
npm run scripts:ramps-caps

# 3. Quote, then create a ramp with a matching payload
npm run scripts:create-quote -- --payload quote.ngn-usdc
npm run scripts:lbt-onramp -- --payload lbt-onramp.ngn-usdc

# 4. Inspect the created ramp
npm run scripts:list-ramps
npm run scripts:get-ramp -- <rampId>
```

Or do all of the above from the browser with `npm run scripts:ui`.
