/**
 * Check liquidity quote capabilities for fiat→crypto entries (Finding 1).
 *
 * Fetches GET /capabilities/liquidity/quotes and prints a summary of:
 *   - crypto→fiat entries  (fromAsset.assetId   + toAsset.nationalCurrencyCode)  — previously present
 *   - crypto→crypto entries (fromAsset.assetId   + toAsset.assetId)              — previously present
 *   - fiat→crypto entries  (fromAsset.nationalCurrencyCode + toAsset.assetId)    — Finding 1: should now exist
 *
 * Usage:
 *   ts-node scripts/capabilities/check-liquidity-quote-capabilities.ts
 */

import { makeClient, printConfig, run } from '../_shared';

printConfig();

run(async () => {
  const client = makeClient();
  const response = await client.capabilities.getQuoteCapabilities({ limit: 200 });
  const capabilities = response.capabilities ?? [];

  const cryptoToFiat = capabilities.filter(
    (c) => 'assetId' in c.fromAsset && 'nationalCurrencyCode' in c.toAsset
  );
  const cryptoToCrypto = capabilities.filter(
    (c) => 'assetId' in c.fromAsset && 'assetId' in c.toAsset
  );
  const fiatToCrypto = capabilities.filter(
    (c) => 'nationalCurrencyCode' in c.fromAsset && 'assetId' in c.toAsset
  );

  console.log('\n=== Liquidity Quote Capabilities Summary ===\n');
  console.log(`Total entries: ${capabilities.length}`);
  console.log(`  crypto→fiat  (assetId → nationalCurrencyCode): ${cryptoToFiat.length}`);
  console.log(`  crypto→crypto (assetId → assetId):              ${cryptoToCrypto.length}`);
  console.log(`  fiat→crypto  (nationalCurrencyCode → assetId):  ${fiatToCrypto.length}`);

  if (fiatToCrypto.length === 0) {
    console.log('\n[FINDING 1] MISSING: No fiat→crypto entries found.');
    console.log(
      '  Expected entries with { fromAsset: { nationalCurrencyCode }, toAsset: { assetId } }'
    );
  } else {
    console.log('\n[FINDING 1] OK: fiat→crypto entries present:');
    for (const c of fiatToCrypto) {
      const from = (c.fromAsset as { nationalCurrencyCode: string }).nationalCurrencyCode;
      const to = (c.toAsset as { assetId: string }).assetId;
      console.log(`  id=${c.id}  ${from} → ${to}`);
    }
  }

  return response;
}, 'capabilities-liquidity-quote-caps.json');
