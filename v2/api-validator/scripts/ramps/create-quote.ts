/**
 * Generate a quote for a ramp
 *
 * Usage:
 *   ts-node scripts/ramps/create-quote.ts [accountId] [--payload <name>]
 *
 * The request body is read from scripts/payloads/. Pass --payload to pick a
 * different one; run without a valid name to list what's available.
 */

import { QuoteRequest } from '../../src/client/generated';
import { loadPayload, makeClient, printConfig, requireAccountId, run } from '../_shared';

const DEFAULT_PAYLOAD = 'quote.ngn-usdc';

const accountId = requireAccountId(
  'ts-node scripts/ramps/create-quote.ts <accountId> [--payload <name>]'
);

printConfig(accountId);

const request = loadPayload<QuoteRequest>(DEFAULT_PAYLOAD);

run(async () => {
  const client = makeClient();
  return client.liquidity.createQuote({ accountId, requestBody: request });
}, `ramps-create-quote-${accountId}.json`);
