/**
 * List all ramps for an account
 *
 * Usage:
 *   ts-node scripts/ramps/list-ramps.ts [accountId]
 */

import { makeClient, printConfig, requireAccountId, run } from '../_shared';

const accountId = requireAccountId('ts-node scripts/ramps/list-ramps.ts <accountId>');

printConfig(accountId);

run(async () => {
  const client = makeClient();
  return client.ramps.getRamps({ accountId });
}, `ramps-list-${accountId}.json`);
