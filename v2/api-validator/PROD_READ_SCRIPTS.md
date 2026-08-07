# Production read-only scripts

These scripts only read data. They do not create or change anything.

All credentials stay in `.env.production`. Prefix each command with `TARGET=production` to select that file.

- Set `ACCOUNT_ID` in `.env.production`. Then you can omit `<accountId>` from every command below.
- Each script writes its response to `scripts/output/production/`. That directory is gitignored.
- Omit `TARGET=production` to fall back to plain `.env`.

## Accounts

```bash
TARGET=production npm run scripts:accounts
```

## Capabilities

```bash
# Ramp capabilities for the account
TARGET=production npm run scripts:ramps-caps

# Ramp capabilities — summary view (on-ramp / off-ramp / bridge)
TARGET=production npm run scripts:check-ramps-caps

# Liquidity quote capabilities (no account ID required)
TARGET=production npm run scripts:liquidity-quote-caps

# Liquidity quote capabilities — summary view
TARGET=production npm run scripts:check-liquidity-quote-caps

# Supported additional assets
TARGET=production npm run scripts:additional-assets

# Asset details by asset ID (replace <assetId>)
TARGET=production npm run scripts:asset-details -- <assetId>
```

## Ramps

```bash
# List ramps for the account
TARGET=production npm run scripts:list-ramps

# Get one ramp by ID (replace <rampId>)
TARGET=production npm run scripts:get-ramp -- <rampId>
```

## Rates

```bash
# Get the rate for a ramps pair (replace <rampsPairId>)
TARGET=production npm run scripts:get-rate -- <rampsPairId>
```
