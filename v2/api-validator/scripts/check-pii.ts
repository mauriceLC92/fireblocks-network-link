/**
 * Scan staged changes for personal data before a push.
 *
 * This repo is public. Run this before every push:
 *
 *   npm run check-pii
 *
 * The script prints CLEAN when it finds nothing. It lists each match when it
 * finds something, then exits with code 1.
 *
 * A match is not proof of a leak. Read each one and decide.
 *
 * This file describes personal data by shape, never by value. Do not add a real
 * phone number, name or account number to the patterns below — that would
 * publish the very data we are hiding.
 */

import { execFileSync } from 'child_process';

type Pattern = {
  /** What this pattern looks for, in plain words. */
  label: string;
  regex: RegExp;
  /** Why a match matters, and what to do about it. */
  hint: string;
};

/**
 * True when a digit run carries an obvious placeholder marker.
 *
 * Every placeholder in this repo holds one of three shapes. A real number from a
 * bank or an ID card almost never does:
 *
 *   - 4 or more of the same digit in a row  (…0000…)
 *   - 5 or more ascending digits            (12345, 456789)
 *   - 5 or more descending digits           (98765, 54321)
 *
 * Keep this in step with the placeholders in scripts/payloads/. When you add a
 * payload, give its numbers one of these markers so the check stays quiet.
 */
function looksLikePlaceholder(digits: string): boolean {
  let same = 1;
  let up = 1;
  let down = 1;
  let bestSame = 1;
  let bestUp = 1;
  let bestDown = 1;

  for (let i = 1; i < digits.length; i++) {
    const prev = Number(digits[i - 1]);
    const curr = Number(digits[i]);
    same = curr === prev ? same + 1 : 1;
    up = curr === prev + 1 ? up + 1 : 1;
    down = curr === prev - 1 ? down + 1 : 1;
    bestSame = Math.max(bestSame, same);
    bestUp = Math.max(bestUp, up);
    bestDown = Math.max(bestDown, down);
  }

  return bestSame >= 4 || bestUp >= 5 || bestDown >= 5;
}

const PATTERNS: Pattern[] = [
  {
    // Skips example.com and the code-host domains that appear in clone URLs.
    label: 'Company email address',
    regex:
      /\b(?!git@)[\w.+-]+@(?!example\.(?:com|org|net)\b|github\.com\b|gitlab\.com\b)[\w-]+\.(?:io|com|net|org|co\.[a-z]{2})\b/gi,
    hint: 'Use an address at example.com, or move the payload to scripts/payloads/private/.',
  },
  {
    label: 'Private payload path',
    regex: /scripts\/payloads\/private\/[\w.-]+\.json/g,
    hint: 'Files in private/ are gitignored on purpose. Never stage one.',
  },
];

/** Country codes the payloads use, longest first so +254 beats +25. */
const COUNTRY_CODES = [
  '254',
  '255',
  '256',
  '260',
  '263',
  '265',
  '267',
  '250',
  '234',
  '233',
  '229',
  '225',
  '221',
  '27',
];

/** A +<code><digits> string that is not one of our placeholder shapes. */
function findRealPhoneNumbers(line: string): string[] {
  const found: string[] = [];
  for (const match of line.matchAll(/\+(\d{9,15})\b/g)) {
    const full = match[1];
    const code = COUNTRY_CODES.find((c) => full.startsWith(c));
    if (!code) {
      continue;
    }
    if (!looksLikePlaceholder(full.slice(code.length))) {
      found.push(`+${full}`);
    }
  }
  return found;
}

/** A long digit run in an account-number or ID field that is not a placeholder. */
function findRealAccountNumbers(line: string): string[] {
  const found: string[] = [];
  const fields = /"(accountNumber|idNumber|additionalIdNumber)"\s*:\s*"(\d{8,})"/g;
  for (const match of line.matchAll(fields)) {
    if (!looksLikePlaceholder(match[2])) {
      found.push(`${match[1]}: ${match[2].slice(0, 3)}…`);
    }
  }
  return found;
}

/** A UUID in a partnerId or an account-ID position, rather than a placeholder. */
function findHardcodedAccountIds(line: string): string[] {
  const uuid = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
  const found: string[] = [];
  if (!/partnerId|accountId|ACCOUNT_ID/i.test(line)) {
    return found;
  }
  for (const match of line.matchAll(uuid)) {
    found.push(`${match[0].slice(0, 8)}…`);
  }
  return found;
}

function git(...args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

const stagedFiles = git('diff', '--cached', '--name-only').trim();
if (!stagedFiles) {
  console.log('Nothing is staged. Stage your changes first with git add.');
  process.exit(0);
}

const fileCount = stagedFiles.split('\n').length;
console.log(`Checking ${fileCount} staged file(s) for personal data.\n`);

type Finding = { file: string; line: string; label: string; detail: string; hint: string };
const findings: Finding[] = [];

// An env file is always wrong to stage, whatever it contains.
for (const file of stagedFiles.split('\n')) {
  if (/(^|\/)\.env($|\.)/.test(file) && !/\.example$|\.mockserver$/.test(file)) {
    findings.push({
      file,
      line: '-',
      label: 'Staged env file',
      detail: file,
      hint: 'Env files hold credentials. Unstage it and check .gitignore covers it.',
    });
  }
}

// Walk the staged diff, tracking which file each added line belongs to.
let currentFile = '';
for (const raw of git('diff', '--cached', '-U0').split('\n')) {
  const header = raw.match(/^\+\+\+ b\/(.*)$/);
  if (header) {
    currentFile = header[1];
    continue;
  }
  if (!raw.startsWith('+') || raw.startsWith('+++')) {
    continue;
  }
  const line = raw.slice(1);

  for (const { label, regex, hint } of PATTERNS) {
    for (const match of line.matchAll(regex)) {
      findings.push({ file: currentFile, line: line.trim(), label, detail: match[0], hint });
    }
  }
  for (const detail of findRealPhoneNumbers(line)) {
    findings.push({
      file: currentFile,
      line: line.trim(),
      label: 'Phone number that is not a placeholder',
      detail,
      hint: 'Placeholders use ascending or repeated digits, e.g. +254712345678.',
    });
  }
  for (const detail of findRealAccountNumbers(line)) {
    findings.push({
      file: currentFile,
      line: line.trim(),
      label: 'Account or ID number that is not a placeholder',
      detail,
      hint: 'Use a placeholder such as 1234567890, or move the payload to private/.',
    });
  }
  for (const detail of findHardcodedAccountIds(line)) {
    findings.push({
      file: currentFile,
      line: line.trim(),
      label: 'Hardcoded account ID',
      detail,
      hint: 'Read the account ID from ACCOUNT_ID in the env file instead.',
    });
  }
}

if (findings.length === 0) {
  console.log('CLEAN. No personal data found in the staged changes.');
  process.exit(0);
}

for (const f of findings) {
  console.log(`${f.label}: ${f.detail}`);
  console.log(`  file: ${f.file}`);
  if (f.line !== '-') {
    console.log(`  line: ${f.line.slice(0, 120)}`);
  }
  console.log(`  fix:  ${f.hint}\n`);
}

console.log(`${findings.length} item(s) to review before you push.`);
console.log('Unstage a file with: git restore --staged <file>');
process.exit(1);
