/**
 * Get rate for an account by pair ID
 *
 * The endpoint accepts three kinds of pair. Pass exactly one:
 *
 *   --rampsPairId=<id>        a ramps pair
 *   --conversionPairId=<id>   a conversion pair
 *   --orderBookPairId=<id>    an order book pair
 *
 * A bare positional argument counts as a ramps pair ID, which is the common case.
 *
 * Usage:
 *   ts-node scripts/rates/get-account-rate.ts [accountId] <rampsPairId>
 *   ts-node scripts/rates/get-account-rate.ts [accountId] --conversionPairId=<id>
 *
 * Example:
 *   ts-node scripts/rates/get-account-rate.ts my-account-123 294e0264-1d41-57af-9891-237910075696
 *   ts-node scripts/rates/get-account-rate.ts --orderBookPairId=BTC_USDT
 */

import {
  flagValue,
  makeClient,
  positionalArg,
  printConfig,
  requireAccountId,
  run,
} from '../_shared';

const USAGE = `ts-node scripts/rates/get-account-rate.ts [accountId] <rampsPairId>
   or: ts-node scripts/rates/get-account-rate.ts [accountId] --conversionPairId=<id>
   or: ts-node scripts/rates/get-account-rate.ts [accountId] --orderBookPairId=<id>`;

/** The three pair types the endpoint accepts. */
const PAIR_TYPES = ['rampsPairId', 'conversionPairId', 'orderBookPairId'] as const;

type PairType = (typeof PAIR_TYPES)[number];

const fromFlags = PAIR_TYPES.map((type) => ({ type, id: flagValue(type) })).filter(
  (pair): pair is { type: PairType; id: string } => pair.id !== undefined
);

// Sending two pair types would leave the server to choose, so the result would
// not say which pair it priced. Refuse instead.
if (fromFlags.length > 1) {
  console.error(`Pass one pair type only. You passed ${fromFlags.length}:`);
  for (const pair of fromFlags) {
    console.error(`  --${pair.type}=${pair.id}`);
  }
  process.exit(1);
}

// A pair flag leaves the account ID as the only positional argument.
const expectedArgs = fromFlags.length === 1 ? 1 : 2;
const accountId = requireAccountId(USAGE, expectedArgs);
const positional = expectedArgs === 2 ? positionalArg(1, 2) : undefined;
const pair =
  fromFlags[0] ?? (positional ? { type: 'rampsPairId' as PairType, id: positional } : undefined);

if (!pair) {
  console.error(`Usage: ${USAGE}`);
  process.exit(1);
}

printConfig(accountId);
console.log(`  Pair: ${pair.type}=${pair.id}\n`);

run(async () => {
  const client = makeClient();
  return client.rates.getRateByAccountAndPairId({ accountId, [pair.type]: pair.id });
}, `rates-get-${accountId}-${pair.id}.json`);
