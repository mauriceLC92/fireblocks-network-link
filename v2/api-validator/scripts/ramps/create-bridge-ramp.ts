/**
 * Create a Bridge ramp (crypto → crypto, e.g. USDT Ethereum → USDC Polygon)
 *
 * Usage:
 *   ts-node scripts/ramps/create-bridge-ramp.ts [accountId] [--payload <name>]
 *
 * The request body is read from scripts/payloads/. Pass --payload to pick a
 * different one; run without a valid name to list what's available.
 * Each run gets a fresh idempotency key, so each run creates a new ramp.
 */

import { RampRequest } from '../../src/client/generated';
import { loadPayload, makeClient, printConfig, requireAccountId, run } from '../_shared';

const DEFAULT_PAYLOAD = 'bridge-ramp.usdt-usdc';

const accountId = requireAccountId(
  'ts-node scripts/ramps/create-bridge-ramp.ts <accountId> [--payload <name>]'
);

printConfig(accountId);

const request = loadPayload<RampRequest>(DEFAULT_PAYLOAD, { idempotencyKey: true });
console.log(`Idempotency key: ${request.idempotencyKey}\n`);

run(async () => {
  const client = makeClient();
  return client.ramps.createRamp({ accountId, requestBody: request });
}, `ramps-create-bridge-${accountId}.json`);
