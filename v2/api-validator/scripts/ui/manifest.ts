/**
 * The scripts the local UI can run, and what input each one needs.
 *
 * `payloadPrefix` marks a script as payload-driven: the UI offers every file in
 * scripts/payloads/ whose name starts with that prefix. `extraArg` marks a
 * script that takes one more positional argument after the account ID.
 */

export type ScriptSpec = {
  /** Stable id used in the API and the URL. */
  id: string;
  /** Human label shown in the dropdown. */
  label: string;
  /** Group heading in the dropdown. */
  group: string;
  /** Path relative to the scripts/ directory. */
  file: string;
  /** True when the script operates on a single account. */
  needsAccount: boolean;
  /** Payload filename prefix, for payload-driven scripts. */
  payloadPrefix?: string;
  /** Label + placeholder for a second positional argument. */
  extraArg?: { label: string; placeholder: string };
  /** Shown as a warning when the script creates or moves money. */
  mutates?: boolean;
};

export const SCRIPTS: ScriptSpec[] = [
  {
    id: 'accounts',
    label: 'List accounts',
    group: 'Accounts',
    file: 'accounts/list-accounts.ts',
    needsAccount: false,
  },
  {
    id: 'ramps-caps',
    label: 'Get ramp capabilities',
    group: 'Capabilities',
    file: 'capabilities/get-ramps-capabilities.ts',
    needsAccount: true,
  },
  {
    id: 'check-ramps-caps',
    label: 'Check ramp capabilities (bridge summary)',
    group: 'Capabilities',
    file: 'capabilities/check-ramps-capabilities.ts',
    needsAccount: true,
  },
  {
    id: 'liquidity-quote-caps',
    label: 'Get liquidity quote capabilities',
    group: 'Capabilities',
    file: 'capabilities/get-liquidity-quote-capabilities.ts',
    needsAccount: false,
  },
  {
    id: 'check-liquidity-quote-caps',
    label: 'Check liquidity quote capabilities (fiat→crypto summary)',
    group: 'Capabilities',
    file: 'capabilities/check-liquidity-quote-capabilities.ts',
    needsAccount: false,
  },
  {
    id: 'additional-assets',
    label: 'List additional assets',
    group: 'Capabilities',
    file: 'capabilities/get-additional-assets.ts',
    needsAccount: false,
  },
  {
    id: 'asset-details',
    label: 'Get asset details',
    group: 'Capabilities',
    file: 'capabilities/get-asset-details.ts',
    needsAccount: false,
    extraArg: { label: 'Asset ID', placeholder: 'ba215aa5-454d-4415-a575-8078e3dfeb4c' },
  },
  {
    id: 'list-ramps',
    label: 'List ramps',
    group: 'Ramps',
    file: 'ramps/list-ramps.ts',
    needsAccount: true,
  },
  {
    id: 'get-ramp',
    label: 'Get ramp',
    group: 'Ramps',
    file: 'ramps/get-ramp.ts',
    needsAccount: true,
    extraArg: { label: 'Ramp ID', placeholder: 'ramp id' },
  },
  {
    id: 'create-quote',
    label: 'Create ramp quote',
    group: 'Ramps',
    file: 'ramps/create-quote.ts',
    needsAccount: true,
    payloadPrefix: 'quote.',
  },
  {
    id: 'momo-onramp',
    label: 'Create MoMo on-ramp',
    group: 'Ramps',
    file: 'ramps/create-momo-onramp.ts',
    needsAccount: true,
    payloadPrefix: 'momo-onramp.',
    mutates: true,
  },
  {
    id: 'momo-offramp',
    label: 'Create MoMo off-ramp',
    group: 'Ramps',
    file: 'ramps/create-momo-offramp.ts',
    needsAccount: true,
    payloadPrefix: 'momo-offramp.',
    mutates: true,
  },
  {
    id: 'lbt-onramp',
    label: 'Create LBT on-ramp',
    group: 'Ramps',
    file: 'ramps/create-lbt-onramp.ts',
    needsAccount: true,
    payloadPrefix: 'lbt-onramp.',
    mutates: true,
  },
  {
    id: 'lbt-offramp',
    label: 'Create LBT off-ramp',
    group: 'Ramps',
    file: 'ramps/create-lbt-offramp.ts',
    needsAccount: true,
    payloadPrefix: 'lbt-offramp.',
    mutates: true,
  },
  {
    id: 'bridge-ramp',
    label: 'Create bridge ramp',
    group: 'Ramps',
    file: 'ramps/create-bridge-ramp.ts',
    needsAccount: true,
    payloadPrefix: 'bridge-ramp.',
    mutates: true,
  },
  {
    id: 'get-rate',
    label: 'Get rate by pair ID',
    group: 'Rates',
    file: 'rates/get-account-rate.ts',
    needsAccount: true,
    extraArg: { label: 'Ramps pair ID', placeholder: '294e0264-1d41-57af-9891-237910075696' },
  },
  {
    id: 'liquidity-create-quote',
    label: 'Create liquidity quote',
    group: 'Liquidity',
    file: 'liquidity/create-quote.ts',
    needsAccount: true,
    payloadPrefix: 'liquidity-quote.',
  },
  {
    id: 'liquidity-get-quote',
    label: 'Get liquidity quote',
    group: 'Liquidity',
    file: 'liquidity/get-quote.ts',
    needsAccount: true,
    extraArg: { label: 'Quote ID', placeholder: 'quote id' },
  },
];

export function findScript(id: string): ScriptSpec | undefined {
  return SCRIPTS.find((s) => s.id === id);
}
