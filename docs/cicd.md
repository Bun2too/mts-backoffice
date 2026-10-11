# GitHub Actions → Netlify

Repository: `Bun2too/mts-backoffice`.

## Release destinations

| Merge destination | GitHub environment | Netlify URL | Release gate |
| --- | --- | --- | --- |
| `develop` | `dev` | <https://develop--mts-backoffice.netlify.app> | Successful build and tests |
| `qa` | `qa` | <https://qa--mts-backoffice.netlify.app> | Successful build and tests |
| `main` | `production` | <https://mts-backoffice.netlify.app> | Successful build/tests, then required environment reviewer approval |

The aliases are stable **draft deploy aliases on one Netlify project**, not separate Netlify projects or Git-triggered branch deploys. Only `main` uses `--prod`. Development and QA never overwrite the main URL. Browser demo data is isolated by origin; changing environment does not migrate users, transactions, or branding stored in localStorage.

## One-time setup (required before releases work)

The repository files do not create account credentials or configure GitHub reviewer settings. Complete the following setup before enabling deployment credentials.

### 1. Make GitHub Actions the only automatic publisher

Open the existing **mts-backoffice** project in Netlify.

- Under **Project configuration → Build & deploy → Continuous deployment → Build settings**, set build status to **Stopped builds**. This disables Netlify's independent Git builds while still allowing GitHub's CLI uploads.
- Set the Netlify production branch to `main`, and disable automatic branch deploys and Deploy Previews for this setup. Do not enable a Netlify branch deploy named `develop` or `qa`: those names are used for CLI aliases.
- `netlify.toml` also has `ignore = "exit 0"` to skip Git-triggered builds when that configuration is present. Stopping builds in the UI is still required: another branch or an older commit might lack the ignore rule and otherwise publish outside the approval workflow.
- Do not use Netlify build hooks as a second release path. Limit manual production publishing to authorized operators.

The workflow deploys prebuilt static files using `--no-build`; it does not require Netlify's build service to be enabled. No Figma CLI or Figma account is involved. The existing local `.figma/make/site.json` is still used when Vite builds the app.

### 2. Create GitHub environments and approval protection

Open [repository environment settings](https://github.com/Bun2too/mts-backoffice/settings/environments). Create these exact names:

| Environment | Allowed deployment branch | Required reviewers |
| --- | --- | --- |
| `dev` | `develop` only | Optional |
| `qa` | `qa` only | Optional |
| `production` | `main` only | **Required: choose at least one authorized reviewer** |

Use **Selected branches and tags** and add the appropriate **branch** rule, not a tag rule. For `production`, enable **Required reviewers** and select the authorized user/team. Enable **Prevent self-review** if another person must approve releases. Disable administrator bypass if approval must apply to administrators too.

**The workflow's `environment: production` declaration does not itself require approval. GitHub's Required reviewers setting supplies that gate. Configure it before adding production secrets.** Only one of the configured required reviewers needs to approve a deployment.

If Required reviewers is not available for your repository's visibility and GitHub plan, this release policy is not configured yet. Use a plan/repository setup supporting environment approvals before enabling production credentials. A PR approval alone is not equivalent to this post-build deployment approval.

### 3. Add Netlify credentials to each GitHub environment

In Netlify, copy the **Project ID** for `mts-backoffice` and create a personal access token from the authorized deploy user's account settings.

Under each GitHub environment above, add these **environment secrets**:

| Secret | Value |
| --- | --- |
| `NETLIFY_SITE_ID` | Netlify Project ID for `mts-backoffice` |
| `NETLIFY_AUTH_TOKEN` | A Netlify access token authorized to deploy that project |

Use the same Project ID for all three environments. Tokens may be separately managed, but these aliases still share one Netlify project and do not provide separate Netlify permission boundaries. Do not commit tokens, place them in `netlify.toml`, or add them as `VITE_*` variables. Prefer environment secrets over repository-wide deployment secrets so production credentials stay behind its approval gate.

`GITHUB_TOKEN` is supplied automatically by Actions with read-only repository access. The deployment script checks the branch's current revision and verifies that the supplied Netlify Project ID belongs to `mts-backoffice` before uploading.

### 4. Protect the branches

Under GitHub **Settings → Rules → Rulesets** (or branch protection), protect `develop`, `qa`, and `main`:

- Require pull requests before merging and disallow ordinary direct pushes/force pushes.
- Require the **Build and test** check from **CI and Netlify deployment**. It becomes selectable after the workflow has run.
- Require review as appropriate for your team and keep deployment/workflow changes reviewable.

The workflow triggers on **push** to each destination branch, which includes a completed PR merge. Direct pushes would also trigger it if branch rules allow them. PRs targeting these branches run tests only and do not receive Netlify deployment credentials. `workflow_dispatch` allows an authorized operator to rerun a branch release; only the three configured branches may deploy.

## Normal promotion workflow

1. Merge a feature PR into `develop`.
2. GitHub installs locked dependencies, runs unit tests, builds production assets and tests that built app in Chromium. On success it uploads the build artifact and deploys the development alias.
3. Verify the dev demo. Open and merge a PR from `develop` into `qa`.
4. GitHub builds/tests the QA merge revision and updates the QA alias.
5. After QA acceptance, open and merge a PR from `qa` into `main`.
6. GitHub builds/tests the main merge revision. The **Deploy to Netlify** job waits for the `production` environment reviewer.
7. The reviewer opens the Actions run, selects **Review deployments**, reviews the revision and checks, and approves `production`.
8. That run's previously verified artifact is uploaded with `--prod`. The main URL updates, then the workflow checks `/deployment.json` to confirm it serves the expected commit.

Promotion here means merging reviewed code through the branches. Each branch merge gets its own build; it does not copy an older environment's artifact or localStorage data. Within each workflow run, the deploy job downloads the exact artifact tested by the verification job and never rebuilds it.

The workflow does not auto-merge branches or enforce the source branch of a PR. Team branch rules/review must preserve the `develop → qa → main` promotion path if that is mandatory.

## Configuration files

- `.github/workflows/netlify.yml`: PR validation, merge/push releases, artifact transfer and GitHub environment selection.
- `scripts/netlify-deploy.mjs`: allowlisted branch-to-alias mapping, Netlify CLI 27.5.2, site/revision checks and post-deploy verification.
- `netlify.toml`: ignored Git builds, build contexts, publish directory, and response headers. `develop` and `qa` contexts still use optimized production assets; they are not Vite development builds.
- `playwright.config.ts`: in CI, tests `pnpm preview` against the built `dist/`; locally, keeps the existing Vite development test server.
- `tests/deployment.test.mjs`: verifies nonproduction branches cannot select `--prod`, unsupported refs are rejected, and artifacts match the deploying revision.

Build artifacts are retained for 14 days; failure traces for 7 days. If approval is delayed beyond artifact retention, run a fresh workflow on the latest branch revision. Runs are serialized per branch. A queued or manually rerun commit that is no longer the branch head is rejected to prevent a stale release replacing newer code.

`netlify.toml` deploy contexts do not inject frontend configuration into an already-built artifact. Future API endpoints or other `VITE_*` settings must be supplied to the **build job** in GitHub. Never put secrets in frontend build variables.

## First deployment and validation

Commit/push these configuration changes and make sure the workflow and scripts exist on all three destination branches (merge them through the normal PR flow). A workflow file existing only on `main` does not make pushes to older `develop` or `qa` trees run that workflow.

After completing account setup, merge a small PR into `develop` or use **Actions → CI and Netlify deployment → Run workflow**, choosing `develop`.

Check:

- **Build and test** succeeds, then **Deploy to Netlify** succeeds.
- The development alias loads the demo, and `/deployment.json` contains the merged SHA.
- The main URL is unchanged by development and QA releases.
- A `main` run waits for review after verification and before the deployment job starts.
- After production approval, the main URL's `/deployment.json` contains the approved SHA.

Public aliases become available after their first successful deployment; the YAML alone does not create them. This setup has no backend or shared database; it remains the browser-persisted demo described in README.md.

## Failures and rollback

- **Missing secret:** add both Netlify secrets to the selected environment, then rerun. Do not copy tokens into workflow logs.
- **No production approval prompt:** stop and configure Required reviewers; the environment name alone does not protect deployments.
- **Main changes before approval:** disable independent Netlify Git publishing/build hooks and check other workflows/manual publishers.
- **Stale run:** use the workflow for the latest commit instead. This check intentionally prevents rerunning an older SHA as a rollback.
- **Build or tests fail:** no deploy occurs; inspect the Actions logs and browser failure artifact.
- **Upload succeeds but URL verification fails:** inspect the site and `/deployment.json`; publication may already have happened. Check alias conflicts and Netlify availability before retrying. The workflow does not automatically roll back a published deployment.
- **Rollback through the approval path:** create a revert PR into the affected branch and merge it. Main will build/test the reverted code and wait for production approval again. Netlify's manual restore feature is an operator action outside this GitHub approval workflow.
- **Old demo data after release:** browser localStorage is intentionally retained. Export if needed, then reset/import demo data to load a new packaged scenario.

## Official references

- [Netlify CLI deployment flags and alias behavior](https://cli.netlify.com/commands/deploy/)
- [Stopping Netlify Git builds while retaining CLI deployments](https://docs.netlify.com/build/configure-builds/stop-or-activate-builds/)
- [Netlify ignored-build configuration](https://docs.netlify.com/build/configure-builds/ignore-builds/)
- [GitHub environments and protection rules](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- [Reviewing deployments and plan availability](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/review-deployments)

## Regulus dev integration (October 2026)

The `develop` build now uses API mode, firm `1`, with browser requests to `/api`.
The browser calls a Netlify server function at `/api/*`. Its upstream origin is read from
`REGULUS_PROXY_TARGET` in the function environment; no `_redirects` file contains that address.
The deployed dev API remains unauthenticated; the proxy does not add user/role authorization.
QA and production remain demo deployments with their proxy explicitly disabled.

### Configure the private target

1. Open GitHub repository **Settings → Environments → dev → Environment secrets**.
2. Add `REGULUS_PROXY_TARGET` with the actual upstream origin, including protocol and port,
   without `/api`, a trailing path, or credentials. Do not use a `VITE_` prefix.
3. Merge/run the latest `develop` workflow. The deploy job reads this secret after entering
   the `dev` environment and passes it using Netlify CLI `--secret-env` for that deployment.
   No manual Netlify variable entry is needed. Missing/invalid values fail deployment.
4. Verify `/api/accounts?firmId=1` on the dev site. The browser should see only the site origin.

Builds and PR tests do not receive the secret. The uploaded artifact includes `dist/` and
`netlify/functions/` as separate directories, both without the target value. Only `dist/` is
published as static content; the function source is packaged by Netlify as server code.
The target is supplied separately as private deployment configuration, never written into either
artifact directory. Keep both directories when transferring an API deployment; static folder
uploads alone cannot install a function or its environment. The demo packaging command remains
for standalone demo sites; IIS API deployments require their own server-side proxy configuration.

The secret is scoped to the deploy, so draft aliases on the shared Netlify project do not overwrite
each other's runtime target. QA/main currently pass `DISABLED` instead of inheriting a dev target.
When enabling API mode for those environments, extend `proxyDeploymentSecret` and configure each
GitHub environment independently. Re-deploy to apply a secret change; it does not modify older deploys.

For local development, copy `.env.example` to ignored `.env.local` and set the actual origin there.
Vite reads it only for the local server proxy. Never commit `.env.local`, use `VITE_REGULUS_PROXY_TARGET`,
or put the value in `netlify.toml`, `public/`, build arguments exposed to the browser, or docs.

The function restricts routes/methods, disables redirects, and strips upstream headers and error
bodies so backend error pages cannot reveal the address. The public `/api` route names and returned
business data remain visible by design. This is address confidentiality, not an access-control boundary.
Netlify administrators and trusted CI runner operators can access deployment configuration.
Removing a literal from current files does not erase earlier commits, logs, or previously downloaded
artifacts. If it was published previously, handle those separately; this change does not rewrite history.

References: [deploy-scoped secret environment variables](https://cli.netlify.com/commands/deploy/),
[function runtime environment](https://docs.netlify.com/build/functions/environment-variables/).

The previous deployment failure (`--context flag is only available when using the --build flag`)
was in the deploy step, after build/test success. Prebuilt deployments now pass `--alias=develop`,
`--alias=qa`, or `--prod` without `--context`. The artifact is still uploaded with `--no-build`.
See the [Netlify deploy CLI reference](https://cli.netlify.com/commands/deploy/) and
[proxy documentation](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/).

To release the fix, merge these changes into `develop` and let that new commit's workflow complete.
Rerunning an old failed workflow uses its old deployment script and will not pick up this fix.
The workflow deliberately rejects stale revisions; use the latest `develop` workflow, not an older
successful artifact. Check the stable dev URL and `/deployment.json` after deployment, then verify
that `/api/accounts?firmId=1` returns JSON from Regulus.
