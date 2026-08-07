# Daily workflow on this fork

This directory is the fork `mauriceLC92/fireblocks-network-link`. It is not a separate clone. `origin` is the fork. `upstream` is `fireblocks/fireblocks-network-link`, and its push URL is disabled.

| Branch | Purpose | Safe to push? |
| --- | --- | --- |
| `network-link-scripts` | All script work. The fork's default branch. | Yes |
| `main` | An exact mirror of upstream `main`. Never commit here. | Yes |
| `feat/maurice-scripts` | The old branch. Its history holds real personal data. | **No** |
| `backup/maurice-scripts-original` | A safety copy of the old branch. Same personal data. | **No** |

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

- **Never run `git push --all` or `git push --mirror`.** Both commands push every local branch, including the two that hold real personal data.
- **Never push `feat/maurice-scripts` or `backup/maurice-scripts-original`.** Their history holds the real names, phone numbers, bank account numbers, and the production account ID across all 19 original commits.
- **Never commit an env file.** `.gitignore` covers `.env`, `.env.staging`, `.env.production` and `.env.local`.
- **Never commit a payload with live details.** Those belong in `v2/api-validator/scripts/payloads/private/`, which is gitignored.

## The old branches

Two local branches still hold the real personal data in their history:

- `feat/maurice-scripts`
- `backup/maurice-scripts-original`

Neither branch exists on GitHub. They are a safety net, in case the squash lost something.

Delete both once you are confident the new branch is complete:

```bash
git branch -D feat/maurice-scripts backup/maurice-scripts-original
```

After the deletion, no local branch holds personal data, and `git push --all` becomes harmless. Until then, treat the two branches as local-only.

To compare the new branch against the old one first:

```bash
git diff feat/maurice-scripts network-link-scripts --stat
```

Expect differences only in the payload files, `PROD_READ_SCRIPTS.md`, `SHARING.md`, and the two deleted stray files.

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

1. The clone command. `v2/api-validator/scripts/README.md` covers the rest.
   ```bash
   git clone git@github.com:mauriceLC92/fireblocks-network-link.git
   ```
2. The credentials, through the team password manager. Never through chat, email, or a commit. See "Credentials to share" in `v2/api-validator/scripts/README.md` for the exact list.
