/**
 * Create a liquidity quote
 *
 * Usage:
 *   ts-node scripts/liquidity/create-quote.ts [accountId] [--payload <name>]
 *
 * The request body is read from scripts/payloads/. Get capability IDs from
 * GET /capabilities/liquidity/quotes first — the payload's `id` must be one.
 */

import { QuoteRequest } from '../../src/client/generated';
import { loadPayload, makeClient, printConfig, requireAccountId, run } from '../_shared';

const DEFAULT_PAYLOAD = 'liquidity-quote.usdc-zar';

const accountId = requireAccountId(
  'ts-node scripts/liquidity/create-quote.ts <accountId> [--payload <name>]'
);

printConfig(accountId);

const request = loadPayload<QuoteRequest>(DEFAULT_PAYLOAD);

run(async () => {
  const client = makeClient();
  return client.liquidity.createQuote({ accountId, requestBody: request });
}, `liquidity-create-quote-${accountId}.json`);
