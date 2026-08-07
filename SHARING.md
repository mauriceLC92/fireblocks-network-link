# Sharing the test scripts with the team

The upstream repo is `fireblocks/fireblocks-network-link`. It is public and Fireblocks owns it. We do not push to it.

The test scripts under `v2/api-validator/scripts/` live on our fork: `mauriceLC92/fireblocks-network-link`.

## How the fork is set up

- The fork's `main` stays an exact mirror of upstream `main`. We never commit to it.
- All script work sits on the branch `network-link-scripts`.
- `network-link-scripts` is the fork's default branch. A plain `git clone` lands a teammate on it.

This layout gives us three things:

1. A one-command clone for the team.
2. A single merge to pull in upstream changes.
3. `git diff main...network-link-scripts` always shows exactly what we added.

We chose a fork over the alternatives:

| Approach | Verdict |
| --- | --- |
| Fork, and make the work branch the default branch | **Chosen.** See the three points above. |
| Fork, and commit to the fork's `main` | This works, but our `main` drifts from upstream. Sync merges get noisy, and we lose the free "what did we add?" diff. |
| A separate repo holding only `scripts/` | The scripts import from `src/client`, `src/config` and `src/security`, and we patched two of those files. A split needs us to vendor or publish the validator as a package. Not worth it. |
| Push a branch to upstream | We do not own upstream. |
| A private mirror repo | GitHub cannot make a fork of a public repo private. A bare-clone mirror loses the fork link and the one-click upstream sync. Only worth it if the payloads must stay private. |

A fork also keeps the "Sync fork" button, and lets us open an upstream pull request later if any of this is worth contributing back.

## Personal data in the payloads

This repo is public. Anything we push is indexable and cached, even after we delete it.

The payload files under `v2/api-validator/scripts/payloads/` once held real personal data: names, email addresses, mobile numbers, a bank account number, national ID numbers, and a production account ID.

We replaced every one of those values with a placeholder. Each committed payload keeps its realistic shape — correct country code, correct number length, plausible bank code — so the file still works as a template.

Keep payloads with live details in `v2/api-validator/scripts/payloads/private/`. That directory is gitignored and stays on your own machine. Share the real values through the team password manager, never through this repo.

Both the CLI and the runner UI list `private/` payloads with a `private/` prefix:

```bash
npm run scripts:lbt-offramp -- --payload private/lbt-offramp.bwp-fnb-prod
```

Credentials were already safe. `.env`, `.env.staging`, `.env.production`, `.env.local` and `scripts/output/` are all gitignored, and no key material is tracked.

The personal data was spread across all 19 commits on the original branch. A clean working tree is not enough — pushing the branch would publish the history too. So we squashed the branch into one fresh commit.

## Teammate quickstart

See `v2/api-validator/scripts/README.md`. It covers the clone, the env files, and every script.

## Staying current with upstream

Upstream `main` moves when Fireblocks changes the OpenAPI spec. Pull that in like this:

```bash
git fetch upstream
git switch main
git merge --ff-only upstream/main
git push origin main

git switch network-link-scripts
git merge main
```

Conflicts should be rare. They can only touch the four files we changed:

- `v2/api-validator/package.json`
- `v2/api-validator/src/config/index.ts`
- `v2/api-validator/src/client/SecureClient.ts`
- `v2/api-validator/.gitignore`

The ~50 files we added are all new paths.

If the spec changed, regenerate the downstream artifacts afterwards:

```bash
cd v2/api-validator
npm run make-unified-openapi
npm run generate-openapi-client
```

Teammates just run `git pull` on `network-link-scripts`.

## Contributing a piece upstream

The fork's `main` is a clean mirror, so branch off it and cherry-pick only the commits worth sending:

```bash
git switch -c fix/something upstream/main
git cherry-pick <sha>
git push -u origin fix/something
gh pr create --repo fireblocks/fireblocks-network-link --base main
```
