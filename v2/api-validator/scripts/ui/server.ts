/**
 * Local-only web UI for running the scripts in scripts/.
 *
 * Start with `npm run scripts:ui`, then open http://127.0.0.1:8100.
 *
 * Binds to loopback only. It shells out to the same `ts-node scripts/...`
 * commands the CLI aliases use, so the UI and the CLI can never disagree about
 * what gets sent. Credentials stay in .env.<target> and are never sent to the
 * browser; only the resolved server URL and account ID are shown.
 */

import { spawn } from 'child_process';
import { parse as parseEnv } from 'dotenv';
import fastify from 'fastify';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PassThrough } from 'stream';
import { findScript, SCRIPTS } from './manifest';

const HOST = '127.0.0.1';
const PORT = Number(process.env.UI_PORT ?? 8100);

const VALIDATOR_DIR = path.resolve(__dirname, '..', '..');
const SCRIPTS_DIR = path.join(VALIDATOR_DIR, 'scripts');
const PAYLOADS_DIR = path.join(SCRIPTS_DIR, 'payloads');

type Target = {
  name: string;
  serverUrl?: string;
  accountId?: string;
  isProduction: boolean;
};

/** Discover .env.<target> files and read the non-secret fields the UI displays. */
function discoverTargets(): Target[] {
  const targets: Target[] = [];

  for (const entry of fs.readdirSync(VALIDATOR_DIR)) {
    if (!entry.startsWith('.env.')) continue;

    const name = entry.slice('.env.'.length);
    if (name === 'example' || name.endsWith('.example')) continue;

    const parsed = parseEnv(fs.readFileSync(path.join(VALIDATOR_DIR, entry), 'utf8'));
    targets.push({
      name,
      serverUrl: parsed.SERVER,
      accountId: parsed.ACCOUNT_ID,
      isProduction: name === 'production' || name === 'prod',
    });
  }

  // Sort staging-like targets first so production is never the default choice.
  targets.sort((a, b) => Number(a.isProduction) - Number(b.isProduction));
  return targets;
}

type Payload = {
  /** Name as `--payload` accepts it, e.g. `private/momo-offramp.kes-mpesa`. */
  name: string;
  /** The part after the script's prefix, e.g. `kes-mpesa`. */
  variant: string;
  /** True for files under the gitignored private/ directory. */
  isPrivate: boolean;
  /** First sentence of the payload's `$comment`, when it has one. */
  comment?: string;
  /** Fiat currencies and countries mentioned, so variants are told apart at a glance. */
  currencies: string[];
  countries: string[];
};

/** Collect the fiat currency and country codes anywhere in a payload. */
function tagsOf(value: unknown, currencies: Set<string>, countries: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) tagsOf(item, currencies, countries);
    return;
  }
  if (value === null || typeof value !== 'object') return;

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'nationalCurrencyCode' && typeof nested === 'string') {
      currencies.add(nested.toUpperCase());
    } else if (key === 'country' && typeof nested === 'string' && nested.length <= 3) {
      countries.add(nested.toUpperCase());
    }
    tagsOf(nested, currencies, countries);
  }
}

/** Read the non-secret details the UI shows for one payload file. */
function describePayload(name: string, prefix: string, filePath: string): Payload {
  const payload: Payload = {
    name,
    variant: path.basename(name).slice(prefix.length) || path.basename(name),
    isPrivate: name.includes('/'),
    currencies: [],
    countries: [],
  };

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const comment = (parsed as Record<string, unknown>)?.$comment;
    if (typeof comment === 'string') {
      payload.comment = comment.split(/(?<=\.)\s/)[0].trim();
    }
    const currencies = new Set<string>();
    const countries = new Set<string>();
    tagsOf(parsed, currencies, countries);
    payload.currencies = [...currencies].sort();
    payload.countries = [...countries].sort();
  } catch {
    // Unparseable payloads still belong in the list — the editor is where they get fixed.
  }
  return payload;
}

/**
 * Payloads for a script, matched on `prefix`.
 *
 * Names in a subdirectory keep a `<dir>/` prefix, so payloads in the gitignored
 * `private/` directory — the ones holding live account details — show up in the
 * UI next to the committed ones.
 */
function payloadsFor(prefix: string | undefined): Payload[] {
  if (!prefix || !fs.existsSync(PAYLOADS_DIR)) return [];

  const payloads: Payload[] = [];
  for (const entry of fs.readdirSync(PAYLOADS_DIR, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.json') && entry.name.startsWith(prefix)) {
      const name = path.basename(entry.name, '.json');
      payloads.push(describePayload(name, prefix, path.join(PAYLOADS_DIR, entry.name)));
      continue;
    }
    if (!entry.isDirectory()) {
      continue;
    }
    for (const nested of fs.readdirSync(path.join(PAYLOADS_DIR, entry.name))) {
      if (nested.endsWith('.json') && nested.startsWith(prefix)) {
        const name = `${entry.name}/${path.basename(nested, '.json')}`;
        payloads.push(describePayload(name, prefix, path.join(PAYLOADS_DIR, entry.name, nested)));
      }
    }
  }
  return payloads.sort((a, b) => a.name.localeCompare(b.name));
}

/** Reject anything that could escape scripts/payloads/ or nest deeper than one level. */
function resolvePayloadPath(name: string): string {
  const filename = name.endsWith('.json') ? name : `${name}.json`;
  const resolved = path.resolve(PAYLOADS_DIR, filename);
  const parent = path.dirname(resolved);
  if (parent !== PAYLOADS_DIR && path.dirname(parent) !== PAYLOADS_DIR) {
    throw new Error(`Invalid payload name: ${name}`);
  }
  return resolved;
}

const app = fastify({ logger: false });

app.get('/', async (_request, reply) => {
  reply.type('text/html');
  return fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
});

app.get('/api/config', async () => ({
  targets: discoverTargets(),
  scripts: SCRIPTS.map((s) => ({
    id: s.id,
    label: s.label,
    group: s.group,
    file: s.file,
    needsAccount: s.needsAccount,
    mutates: s.mutates ?? false,
    extraArg: s.extraArg ?? null,
    payloadPrefix: s.payloadPrefix ?? null,
    payloads: payloadsFor(s.payloadPrefix),
  })),
}));

app.get<{ Params: { name: string } }>('/api/payloads/:name', async (request, reply) => {
  let filePath: string;
  try {
    filePath = resolvePayloadPath(request.params.name);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
  if (!fs.existsSync(filePath)) {
    return reply.code(404).send({ error: `Payload not found: ${request.params.name}` });
  }
  reply.type('application/json');
  return fs.readFileSync(filePath, 'utf8');
});

/** Persist an edited payload back to scripts/payloads/, so the CLI sees it too. */
app.put<{ Params: { name: string }; Body: { body: string } }>(
  '/api/payloads/:name',
  async (request, reply) => {
    let filePath: string;
    try {
      filePath = resolvePayloadPath(request.params.name);
      JSON.parse(request.body.body);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, request.body.body.trimEnd() + '\n');
    return { saved: path.relative(VALIDATOR_DIR, filePath) };
  }
);

/** Create a new payload file. Refuses to overwrite, so a clone can't clobber its source. */
app.post<{ Params: { name: string }; Body: { body: string } }>(
  '/api/payloads/:name',
  async (request, reply) => {
    let filePath: string;
    try {
      filePath = resolvePayloadPath(request.params.name);
      JSON.parse(request.body.body);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
    if (fs.existsSync(filePath)) {
      return reply.code(409).send({ error: `Payload already exists: ${request.params.name}` });
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, request.body.body.trimEnd() + '\n');
    return { created: path.relative(VALIDATOR_DIR, filePath) };
  }
);

app.delete<{ Params: { name: string } }>('/api/payloads/:name', async (request, reply) => {
  let filePath: string;
  try {
    filePath = resolvePayloadPath(request.params.name);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
  if (!fs.existsSync(filePath)) {
    return reply.code(404).send({ error: `Payload not found: ${request.params.name}` });
  }
  fs.rmSync(filePath);
  return { deleted: path.relative(VALIDATOR_DIR, filePath) };
});

type RunBody = {
  scriptId: string;
  target: string;
  accountId?: string;
  extraArg?: string;
  payload?: string;
  /** Edited payload JSON. Sent as a one-off temp file, leaving the stored file untouched. */
  payloadBody?: string;
};

app.post<{ Body: RunBody }>('/api/run', async (request, reply) => {
  const spec = findScript(request.body.scriptId);
  if (!spec) {
    return reply.code(400).send({ error: `Unknown script: ${request.body.scriptId}` });
  }

  const target = discoverTargets().find((t) => t.name === request.body.target);
  if (!target) {
    return reply.code(400).send({ error: `Unknown target: ${request.body.target}` });
  }

  const env: NodeJS.ProcessEnv = { ...process.env, TARGET: target.name };
  let tempPayloadPath: string | undefined;

  if (request.body.accountId) {
    env.ACCOUNT_ID = request.body.accountId;
  }

  if (request.body.payloadBody !== undefined) {
    try {
      JSON.parse(request.body.payloadBody);
    } catch (error) {
      return reply
        .code(400)
        .send({ error: `Payload is not valid JSON: ${(error as Error).message}` });
    }
    // Name the temp file after the payload it was edited from, so the script's
    // "Payload:" line still says which one it came from.
    const base = (request.body.payload ?? 'payload').replace(/[^\w.-]/g, '_');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nl-payload-'));
    tempPayloadPath = path.join(dir, `${base}(edited).json`);
    fs.writeFileSync(tempPayloadPath, request.body.payloadBody);
    env.PAYLOAD = tempPayloadPath;
  } else if (request.body.payload) {
    try {
      env.PAYLOAD = resolvePayloadPath(request.body.payload);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  }

  const args = ['ts-node', path.join('scripts', spec.file)];
  if (request.body.extraArg) {
    args.push(request.body.extraArg);
  }

  const stream = new PassThrough();
  reply.type('text/plain; charset=utf-8').header('cache-control', 'no-cache').send(stream);

  stream.write(`$ TARGET=${target.name} npx ${args.join(' ')}\n\n`);

  const child = spawn('npx', args, { cwd: VALIDATOR_DIR, env });
  child.stdout.pipe(stream, { end: false });
  child.stderr.pipe(stream, { end: false });

  child.on('error', (error) => {
    stream.write(`\nFailed to start script: ${error.message}\n`);
  });

  child.on('close', (code) => {
    stream.end(`\n--- exit code ${code} ---\n`);
    if (tempPayloadPath) {
      fs.rmSync(path.dirname(tempPayloadPath), { recursive: true, force: true });
    }
  });

  // Kill the script if the browser disconnects mid-run. Guard on the response:
  // the request stream closes as soon as its body has been read, which is not a
  // disconnect.
  reply.raw.on('close', () => {
    if (!reply.raw.writableFinished && child.exitCode === null) {
      child.kill('SIGTERM');
    }
  });
});

app
  .listen({ host: HOST, port: PORT })
  .then(() => {
    console.log(`\n  Network Link script runner: http://${HOST}:${PORT}\n`);
    const targets = discoverTargets();
    if (targets.length === 0) {
      console.log('  No .env.<target> files found. Create .env.staging / .env.production.\n');
    } else {
      for (const t of targets) {
        console.log(
          `  ${t.name.padEnd(12)} ${t.serverUrl ?? '(no SERVER)'}  account=${
            t.accountId ?? '(no ACCOUNT_ID)'
          }`
        );
      }
      console.log('');
    }
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
