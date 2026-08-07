/**
 * Get list of supported additional assets
 *
 * Usage:
 *   ts-node scripts/capabilities/get-additional-assets.ts
 */

import { makeClient, printConfig, run } from '../_shared';

printConfig();

run(async () => {
  const client = makeClient();
  return client.capabilities.getAdditionalAssets({ limit: 200 });
}, 'capabilities-additional-assets.json');
