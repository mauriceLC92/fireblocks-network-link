/**
 * Get details for a specific ramp
 *
 * Usage:
 *   ts-node scripts/ramps/get-ramp.ts [accountId] <rampId>
 */

import { makeClient, positionalArg, printConfig, requireAccountId, run } from '../_shared';

const accountId = requireAccountId('ts-node scripts/ramps/get-ramp.ts [accountId] <rampId>', 2);
const rampId = positionalArg(1, 2);

if (!rampId) {
  console.error('Usage: ts-node scripts/ramps/get-ramp.ts [accountId] <rampId>');
  process.exit(1);
}

printConfig(accountId);

run(async () => {
  const client = makeClient();
  return client.ramps.getRampDetails({ accountId, id: rampId });
}, `ramps-get-${accountId}-${rampId}.json`);
