/**
 * List all accounts
 *
 * Usage:
 *   ts-node scripts/accounts/list-accounts.ts
 */

import { makeClient, printConfig, run } from '../_shared';

printConfig();

run(async () => {
  const client = makeClient();
  return client.accounts.getAccounts({});
}, 'accounts-list.json');
