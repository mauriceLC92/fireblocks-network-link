import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PAYLOADS_DIR, listPayloads, loadPayload } from '../../scripts/_shared';

/**
 * `$comment` is a payload annotation, so it must never reach the wire: request
 * bodies are signed, meaning anything left in the object is really transmitted
 * and a strict server rejects it. These tests pin that guarantee — both for the
 * stripping itself and for every payload file currently in the repo.
 */

/** Every `$comment` key in `value`, as a list of paths, at any depth. */
function findComments(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => findComments(item, `${path}[${i}]`));
  }
  if (value === null || typeof value !== 'object') {
    return [];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
    key === '$comment' ? [`${path}.$comment`] : findComments(nested, `${path}.${key}`)
  );
}

/** Load a payload from a temp file, the way `--payload <absolute path>` does. */
function loadFromObject(payload: unknown): unknown {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'payload-comments-test-'));
  const file = path.join(dir, 'temp-payload.json');
  fs.writeFileSync(file, JSON.stringify(payload));
  try {
    process.env.PAYLOAD = file;
    return loadPayload('unused-default');
  } finally {
    delete process.env.PAYLOAD;
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('Payload $comment stripping', () => {
  beforeAll(() => {
    // loadPayload logs the payload name; keep the test output readable.
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('strips $comment at the top level', () => {
    expect(loadFromObject({ $comment: 'note', amount: '1' })).toEqual({ amount: '1' });
  });

  it('strips $comment from nested objects', () => {
    const loaded = loadFromObject({
      $comment: 'note',
      to: { $comment: 'note', accountNumber: '123', asset: { $comment: 'note', code: 'RWF' } },
    });

    expect(findComments(loaded)).toEqual([]);
    expect(loaded).toEqual({ to: { accountNumber: '123', asset: { code: 'RWF' } } });
  });

  it('strips $comment from objects inside arrays', () => {
    const loaded = loadFromObject({
      fees: [{ $comment: 'note', feeType: 'ORDER' }, { feeType: 'NETWORK' }],
    });

    expect(findComments(loaded)).toEqual([]);
    expect(loaded).toEqual({ fees: [{ feeType: 'ORDER' }, { feeType: 'NETWORK' }] });
  });

  it('leaves everything else untouched, including nulls and empty containers', () => {
    const payload = {
      amount: '1',
      nested: { flag: false, nothing: null, list: [1, 'two', null], empty: {}, none: [] },
    };

    expect(loadFromObject({ $comment: 'note', ...payload })).toEqual(payload);
  });

  it('does not strip keys that merely look like $comment', () => {
    const payload = { comment: 'keep', $comments: 'keep', '$comment ': 'keep' };

    expect(loadFromObject(payload)).toEqual(payload);
  });

  describe('every payload file in the repo', () => {
    const names = listPayloads();

    it('finds payload files to check', () => {
      expect(names.length).toBeGreaterThan(0);
    });

    it.each(names)('%s loads with no $comment left anywhere', (name) => {
      const raw = JSON.parse(fs.readFileSync(path.join(PAYLOADS_DIR, `${name}.json`), 'utf8'));
      const loaded = loadPayload(name, { idempotencyKey: true });

      expect(findComments(loaded)).toEqual([]);
      // Guard against the reverse bug: stripping so much the body is emptied.
      expect(Object.keys(loaded as object).length).toBeGreaterThanOrEqual(
        Object.keys(raw).filter((k) => k !== '$comment').length
      );
    });
  });
});
