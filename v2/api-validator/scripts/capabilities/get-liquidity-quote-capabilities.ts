/**
 * Get liquidity quote capabilities
 *
 * Usage:
 *   ts-node scripts/capabilities/get-liquidity-quote-capabilities.ts
 */

import { makeClient, printConfig, run } from '../_shared';

printConfig();

run(async () => {
  const client = makeClient();
  return client.capabilities.getQuoteCapabilities({ limit: 200 });
}, 'capabilities-liquidity-quote-caps.json');
