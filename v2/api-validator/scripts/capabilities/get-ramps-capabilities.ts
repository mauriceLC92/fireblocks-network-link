/**
 * Get ramp capabilities for an account
 *
 * Usage:
 *   ts-node scripts/capabilities/get-ramps-capabilities.ts [accountId]
 */

import { makeClient, printConfig, requireAccountId, run } from '../_shared';

const accountId = requireAccountId(
  'ts-node scripts/capabilities/get-ramps-capabilities.ts <accountId>'
);

printConfig(accountId);

run(async () => {
  const client = makeClient();
  return client.capabilities.getRampMethods({ accountId, limit: 200 });
}, `capabilities-ramps-caps-${accountId}.json`);
