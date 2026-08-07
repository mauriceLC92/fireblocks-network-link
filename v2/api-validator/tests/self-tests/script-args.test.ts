import { flagValue, positionalArgs } from '../../scripts/_shared';

/**
 * Every script resolves its account ID from a positional index, so a flag that
 * gets miscounted as a positional silently sends the request to the wrong
 * account. These tests pin the parsing rules for both spellings of a flag.
 */

/** Run `fn` with `argv` as the script's command line. */
function withArgv<T>(argv: string[], fn: () => T): T {
  const original = process.argv;
  process.argv = ['node', 'script', ...argv];
  try {
    return fn();
  } finally {
    process.argv = original;
  }
}

describe('positionalArgs', () => {
  it('returns bare arguments untouched', () => {
    expect(withArgv(['acct', 'pair'], positionalArgs)).toEqual(['acct', 'pair']);
  });

  it('returns an empty list when nothing is passed', () => {
    expect(withArgv([], positionalArgs)).toEqual([]);
  });

  it.each([
    ['before', ['--payload', 'q', 'acct']],
    ['after', ['acct', '--payload', 'q']],
    ['as --flag=value', ['--payload=q', 'acct']],
  ])('drops a flag given %s, whatever its position', (_name, argv) => {
    expect(withArgv(argv, positionalArgs)).toEqual(['acct']);
  });

  it('drops several flags at once', () => {
    const argv = ['--payload=q', 'acct', '--rampsPairId', 'r'];

    expect(withArgv(argv, positionalArgs)).toEqual(['acct']);
  });

  it('consumes nothing for a flag followed by another flag', () => {
    expect(withArgv(['--rampsPairId', '--payload=q', 'acct'], positionalArgs)).toEqual(['acct']);
  });

  it('consumes nothing for a flag that ends the command line', () => {
    expect(withArgv(['acct', '--rampsPairId'], positionalArgs)).toEqual(['acct']);
  });
});

describe('flagValue', () => {
  it('reads --flag value', () => {
    expect(withArgv(['--payload', 'quote.ngn-usdc'], () => flagValue('payload'))).toBe(
      'quote.ngn-usdc'
    );
  });

  it('reads --flag=value', () => {
    expect(withArgv(['--payload=quote.ngn-usdc'], () => flagValue('payload'))).toBe(
      'quote.ngn-usdc'
    );
  });

  it('keeps a value that itself contains an equals sign', () => {
    expect(withArgv(['--payload=a=b'], () => flagValue('payload'))).toBe('a=b');
  });

  it('returns undefined for an absent flag', () => {
    expect(withArgv(['acct'], () => flagValue('rampsPairId'))).toBeUndefined();
  });

  it('returns undefined when the flag has no value', () => {
    expect(
      withArgv(['--rampsPairId', '--payload=q'], () => flagValue('rampsPairId'))
    ).toBeUndefined();
  });

  it('does not match a flag whose name merely starts the same', () => {
    expect(withArgv(['--payloadExtra=q'], () => flagValue('payload'))).toBeUndefined();
  });

  it('tells the three pair flags apart', () => {
    const argv = ['--conversionPairId=BTC_USD'];

    expect(withArgv(argv, () => flagValue('conversionPairId'))).toBe('BTC_USD');
    expect(withArgv(argv, () => flagValue('rampsPairId'))).toBeUndefined();
    expect(withArgv(argv, () => flagValue('orderBookPairId'))).toBeUndefined();
  });
});
