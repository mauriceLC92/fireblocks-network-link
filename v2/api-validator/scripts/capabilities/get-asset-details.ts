/**
 * Get details of a supported additional asset by ID
 *
 * Usage:
 *   ts-node scripts/capabilities/get-asset-details.ts <assetId>
 */

import { makeClient, printConfig, run } from '../_shared';

const assetId = process.argv[2];

if (!assetId) {
  console.error('Usage: ts-node scripts/capabilities/get-asset-details.ts <assetId>');
  process.exit(1);
}

printConfig();

run(async () => {
  const client = makeClient();
  return client.capabilities.getAssetDetails({ id: assetId });
}, `capabilities-asset-${assetId}.json`);
