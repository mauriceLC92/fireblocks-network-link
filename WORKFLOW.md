# Daily workflow on this fork

This directory is the fork `mauriceLC92/fireblocks-network-link`. It is not a separate clone. `origin` is the fork. `upstream` is `fireblocks/fireblocks-network-link`, and its push URL is disabled.

| Branch | Purpose | Safe to push? |
| --- | --- | --- |
| `network-link-scripts` | All script work. The fork's default branch. | Yes |
| `main` | An exact mirror of upstream `main`. Never commit here. | Yes |

No branch holds real personal data. The old branches are deleted, and their commits are purged.

## When is a push safe?

A push is safe when both of these are true:

1. You are on `network-link-scripts` or `main`.
2. The staged changes hold no real personal data.

Run this check before every push:

```bash
cd v2/api-validator
npm run check-pii
```

The command scans your staged changes. It prints `CLEAN` when it finds nothing, and it lists each match when it does. A match does not always mean a leak — read the output and decide.

The check looks for four things:

- An email address at a domain other than `example.com`.
- A phone number without a placeholder marker.
- An account number or ID number without a placeholder marker.
- A hardcoded UUID next to `partnerId`, `accountId` or `ACCOUNT_ID`.

A placeholder marker is 4 or more repeated digits, or 5 or more ascending or descending digits. Give every new placeholder one of those shapes and the check stays quiet.

Then push:

```bash
git push
```

Use plain `git push`. It sends the current branch only.

## Never do these

- **Never commit an env file.** `.gitignore` covers `.env`, `.env.staging`, `.env.production` and `.env.local`.
- **Never commit a payload with live details.** Those belong in `v2/api-validator/scripts/payloads/private/`, which is gitignored.

## How this fork reached a safe state

The script work started on a branch that held real personal data across 19 commits. We cleaned it in four steps:

1. Replaced every real name, phone number, email and account number with a placeholder.
2. Squashed the 19 commits into one, so no earlier version keeps the real values.
3. Deleted the two old branches. Neither ever reached GitHub.
4. Purged the unreachable commits with `git reflog expire` and `git gc`.

Nothing in this repo now holds a real person's details. Keep it that way with the check above.

## Pushing normal work

```bash
git switch network-link-scripts
# edit files
git add <files>
cd v2/api-validator && npm run check-pii && cd -
git commit -m "Describe the change"
git push
```

## Pulling upstream changes

Upstream `main` moves when Fireblocks changes the OpenAPI spec.

```bash
git fetch upstream
git switch main
git merge --ff-only upstream/main
git push                              # goes to your fork, not upstream

git switch network-link-scripts
git merge main
git push
```

Conflicts can only touch the four files we changed:

- `v2/api-validator/package.json`
- `v2/api-validator/src/config/index.ts`
- `v2/api-validator/src/client/SecureClient.ts`
- `v2/api-validator/.gitignore`

The ~50 files we added are all new paths.

If the spec changed, regenerate the downstream artifacts:

```bash
cd v2/api-validator
npm run make-unified-openapi
npm run generate-openapi-client
```

## What to share with teammates

Send them two things:

1. The clone command. A plain clone lands on `network-link-scripts`, because that is the fork's default branch. `v2/api-validator/scripts/README.md` covers the rest.
   ```bash
   git clone git@github.com:mauriceLC92/fireblocks-network-link.git
   ```
2. The server URL and the account ID, for staging and for production. Neither is a credential.

Each person creates their own API key and signing secret in the admin dashboard. Never send a key or a secret through chat, email, or a commit. See "Credentials to share" in `v2/api-validator/scripts/README.md`.
