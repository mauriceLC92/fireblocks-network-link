/**
 * Get details for a specific quote
 *
 * Usage:
 *   ts-node scripts/liquidity/get-quote.ts [accountId] <quoteId>
 */

import { makeClient, positionalArg, printConfig, requireAccountId, run } from '../_shared';

const accountId = requireAccountId(
  'ts-node scripts/liquidity/get-quote.ts [accountId] <quoteId>',
  2
);
const quoteId = positionalArg(1, 2);

if (!quoteId) {
  console.error('Usage: ts-node scripts/liquidity/get-quote.ts [accountId] <quoteId>');
  process.exit(1);
}

printConfig(accountId);

run(async () => {
  const client = makeClient();
  return client.liquidity.getQuoteDetails({ accountId, id: quoteId });
});
