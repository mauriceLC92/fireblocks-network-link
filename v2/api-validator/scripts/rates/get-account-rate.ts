/**
 * Get rate for an account by ramps pair ID
 *
 * Usage:
 *   ts-node scripts/rates/get-account-rate.ts [accountId] <rampsPairId>
 *
 * Example:
 *   ts-node scripts/rates/get-account-rate.ts my-account-123 294e0264-1d41-57af-9891-237910075696
 */

import { makeClient, positionalArg, printConfig, requireAccountId, run } from '../_shared';

const accountId = requireAccountId(
  'ts-node scripts/rates/get-account-rate.ts [accountId] <rampsPairId>',
  2
);
const rampsPairId = positionalArg(1, 2);

if (!rampsPairId) {
  console.error('Usage: ts-node scripts/rates/get-account-rate.ts [accountId] <rampsPairId>');
  process.exit(1);
}

printConfig(accountId);

run(async () => {
  const client = makeClient();
  return client.rates.getRateByAccountAndPairId({ accountId, rampsPairId });
}, `rates-get-${accountId}-${rampsPairId}.json`);
