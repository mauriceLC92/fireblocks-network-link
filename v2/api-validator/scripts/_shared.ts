import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import VError from 'verror';
import Client from '../src/client';
import config from '../src/config';
import { loadOpenApiSchemas } from '../src/schemas';

export const PAYLOADS_DIR = path.join(__dirname, 'payloads');

async function initSchemas(): Promise<void> {
  await loadOpenApiSchemas(config.getUnifiedOpenApiPathname());
}

export function makeClient(): Client {
  return new Client();
}

/**
 * Positional arguments, with every `--flag` and its value removed, so that flag
 * position never shifts the positional indexes scripts rely on.
 *
 * Both spellings are understood: `--flag value` and `--flag=value`. A flag that
 * is followed by another flag, or that ends the command line, is treated as
 * valueless and consumes nothing.
 */
export function positionalArgs(): string[] {
  const args = process.argv.slice(2);
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith('--')) {
      positional.push(args[i]);
      continue;
    }
    if (!args[i].includes('=') && i + 1 < args.length && !args[i + 1].startsWith('--')) {
      i++;
    }
  }
  return positional;
}

/**
 * The value of `--<name>`, accepting `--name value` and `--name=value`.
 * Returns undefined when the flag is absent or carries no value.
 */
export function flagValue(name: string): string | undefined {
  const args = process.argv.slice(2);
  const flag = `--${name}`;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === flag) {
      const next = args[i + 1];
      return next !== undefined && !next.startsWith('--') ? next : undefined;
    }
    if (args[i].startsWith(`${flag}=`)) {
      return args[i].slice(flag.length + 1);
    }
  }
  return undefined;
}

/**
 * Resolve the account ID to operate on: the ACCOUNT_ID variable from the active
 * env file, overridden by the first positional argument when one is given.
 *
 * `expectedArgs` is how many positional arguments the script takes *including*
 * the account ID. When ACCOUNT_ID is set and the caller passed fewer arguments
 * than that, the account ID is taken from the environment and the arguments are
 * shifted right — so `get-ramp.ts <rampId>` works with ACCOUNT_ID set, while
 * `get-ramp.ts <accountId> <rampId>` still works without it.
 */
export function requireAccountId(usage: string, expectedArgs = 1): string {
  const args = positionalArgs();
  const fromEnv = process.env.ACCOUNT_ID;
  const accountId = args.length >= expectedArgs ? args[0] : fromEnv;

  if (!accountId) {
    console.error(`Usage: ${usage}`);
    console.error('(or set ACCOUNT_ID in your .env file to omit <accountId>)');
    process.exit(1);
  }
  return accountId;
}

/**
 * The positional argument at `index`, counting the account ID as index 0 —
 * whether it came from the command line or from ACCOUNT_ID. Mirrors the
 * argument shifting done by {@link requireAccountId}.
 */
export function positionalArg(index: number, expectedArgs: number): string | undefined {
  const args = positionalArgs();
  const shifted = args.length >= expectedArgs ? 0 : 1;
  return args[index - shifted];
}

/**
 * Recursively remove every `$comment` key, at any depth.
 *
 * Payloads use `$comment` as an annotation, so it must never reach the wire —
 * the request body is signed, so anything left here is really transmitted and
 * a strict server will reject it. Deleting only the top-level key silently
 * sends nested ones.
 */
function stripComments(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripComments);
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== '$comment')
      .map(([key, nested]) => [key, stripComments(nested)])
  );
}

/**
 * Read a request body from scripts/payloads/.
 *
 * The payload is chosen by, in order of precedence:
 *   1. `--payload <name>` on the command line
 *   2. the PAYLOAD environment variable
 *   3. `defaultName`
 *
 * A name may be a bare payload name (`momo-onramp.ugx-partner`), a filename
 * (`momo-onramp.ugx-partner.json`), or an absolute path. `$comment` keys are
 * stripped at every level. With `{ idempotencyKey: true }` a fresh key is
 * injected unless the payload already carries one.
 */
export function loadPayload<T>(defaultName: string, options: { idempotencyKey?: boolean } = {}): T {
  const requested = flagValue('payload') ?? process.env.PAYLOAD ?? defaultName;

  const filename = requested.endsWith('.json') ? requested : `${requested}.json`;
  const filePath = path.isAbsolute(filename) ? filename : path.join(PAYLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.error(`Payload not found: ${filePath}`);
    console.error(`\nAvailable payloads in ${PAYLOADS_DIR}:`);
    for (const name of listPayloads()) {
      console.error(`  ${name}`);
    }
    process.exit(1);
  }

  const raw = stripComments(JSON.parse(fs.readFileSync(filePath, 'utf8'))) as Record<
    string,
    unknown
  >;

  console.log(`Payload: ${path.basename(filePath, '.json')}`);

  if (options.idempotencyKey && !('idempotencyKey' in raw)) {
    return { idempotencyKey: randomUUID(), ...raw } as T;
  }
  return raw as T;
}

/**
 * Payload names (without the .json extension) available in scripts/payloads/.
 *
 * Files in a subdirectory get a `<dir>/<name>` prefix, which is exactly what
 * `--payload` accepts. This is how the gitignored `private/` directory — where
 * payloads with live account details live — becomes visible to both the CLI
 * listing and the runner UI.
 */
export function listPayloads(): string[] {
  if (!fs.existsSync(PAYLOADS_DIR)) {
    return [];
  }

  const names: string[] = [];
  for (const entry of fs.readdirSync(PAYLOADS_DIR, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.json')) {
      names.push(path.basename(entry.name, '.json'));
      continue;
    }
    if (!entry.isDirectory()) {
      continue;
    }
    for (const nested of fs.readdirSync(path.join(PAYLOADS_DIR, entry.name))) {
      if (nested.endsWith('.json')) {
        names.push(`${entry.name}/${path.basename(nested, '.json')}`);
      }
    }
  }
  return names.sort();
}

export function printConfig(accountId?: string): void {
  console.log('\nConfiguration:');
  console.log(`  Target:     ${process.env.TARGET ?? '(default .env)'}`);
  console.log(`  Server URL: ${config.get('client').serverBaseUrl}`);
  if (accountId) {
    console.log(`  Account ID: ${accountId}`);
  }
  console.log('');
}

export async function run(fn: () => Promise<unknown>, outputFile?: string): Promise<void> {
  try {
    await initSchemas();
    const result = await fn();
    const json = JSON.stringify(result, null, 2);
    console.log('Response:');
    console.log(json);
    console.log('');
    if (outputFile) {
      const isProd = process.env.TARGET?.trim() === 'production';
      const outputDir = isProd
        ? path.join(__dirname, 'output', 'production')
        : path.join(__dirname, 'output');
      fs.mkdirSync(outputDir, { recursive: true });
      const filePath = path.join(outputDir, outputFile);
      fs.writeFileSync(filePath, json + '\n');
      console.log(`Output saved to: ${filePath}`);
    }
    process.exit(0);
  } catch (error) {
    const failure = error as { message?: string; body?: unknown };
    console.error('Error:', failure.message);
    if (failure.body) {
      console.error('\nResponse body:');
      console.error(JSON.stringify(failure.body, null, 2));
    }
    const info = VError.info(error as Error);
    if (info && Object.keys(info).length > 0) {
      if (info.method || info.url) {
        console.error(`\nRequest: ${info.method} ${info.url}`);
      }
      if (info.response !== undefined) {
        console.error('\nActual response:');
        console.error(JSON.stringify(info.response, null, 2));
      }
      if (info.error !== undefined) {
        console.error('\nValidation error:');
        console.error(JSON.stringify(info.error, null, 2));
      }
    }
    process.exit(1);
  }
}
