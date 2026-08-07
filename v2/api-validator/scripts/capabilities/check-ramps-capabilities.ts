/**
 * Check ramp capabilities for crypto→crypto (Bridge) entries (Finding 2).
 *
 * Fetches GET /accounts/\{accountId\}/capabilities/ramps and prints a summary of:
 *   - on-ramp entries  (fiat → crypto)   — previously present
 *   - off-ramp entries (crypto → fiat)   — previously present
 *   - bridge entries   (crypto → crypto) — Finding 2: USDT↔USDC cross-chain pairs should now exist
 *
 * Usage:
 *   ts-node scripts/capabilities/check-ramps-capabilities.ts [accountId]
 */

import type { BridgeCapability } from '../../src/client/generated';
import { makeClient, printConfig, requireAccountId, run } from '../_shared';

const accountId = requireAccountId(
  'ts-node scripts/capabilities/check-ramps-capabilities.ts <accountId>'
);

printConfig(accountId);

function isBridge(cap: object): cap is BridgeCapability {
  return (
    'from' in cap &&
    'to' in cap &&
    'asset' in (cap as BridgeCapability).from &&
    'asset' in (cap as BridgeCapability).to &&
    'assetId' in ((cap as BridgeCapability).from.asset ?? {}) &&
    'assetId' in ((cap as BridgeCapability).to.asset ?? {})
  );
}

run(async () => {
  const client = makeClient();
  const response = await client.capabilities.getRampMethods({ accountId, limit: 200 });
  const capabilities = response.capabilities ?? [];

  const onRamps = capabilities.filter((c) => {
    const cap = c as object;
    return (
      'from' in cap &&
      'to' in cap &&
      'nationalCurrencyCode' in ((cap as { from: { asset: object } }).from?.asset ?? {})
    );
  });

  const offRamps = capabilities.filter((c) => {
    const cap = c as object;
    return (
      'from' in cap &&
      'to' in cap &&
      'assetId' in ((cap as { from: { asset: object } }).from?.asset ?? {}) &&
      'nationalCurrencyCode' in ((cap as { to: { asset: object } }).to?.asset ?? {})
    );
  });

  const bridges = capabilities.filter((c) => isBridge(c as object));

  console.log('\n=== Ramp Capabilities Summary ===\n');
  console.log(`Total entries: ${capabilities.length}`);
  console.log(`  on-ramp  (fiat → crypto):   ${onRamps.length}`);
  console.log(`  off-ramp (crypto → fiat):   ${offRamps.length}`);
  console.log(`  bridge   (crypto → crypto): ${bridges.length}`);

  if (bridges.length === 0) {
    console.log('\n[FINDING 2] MISSING: No crypto→crypto (Bridge) entries found.');
    console.log('  Expected entries where both from.asset.assetId and to.asset.assetId are set.');
    console.log('  Example: USDT (Ethereum) ↔ USDC (Polygon) cross-chain pairs.');
  } else {
    console.log('\n[FINDING 2] OK: crypto→crypto (Bridge) entries present:');
    for (const c of bridges as unknown as Array<{ id: string } & BridgeCapability>) {
      const from = (c.from.asset as { assetId: string }).assetId;
      const to = (c.to.asset as { assetId: string }).assetId;
      console.log(`  id=${c.id}  ${from} → ${to}`);
    }
  }

  return response;
}, `capabilities-ramps-caps-${accountId}.json`);
