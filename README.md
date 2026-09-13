# MTS Backoffice Demo

An interactive brokerage backoffice mockup derived from a Figma Make design. Built with React, TypeScript, Vite and Tailwind CSS. It demonstrates firm, branch, representative (CSR) and account-holder workflows using fictional data.

This is a static demo, with simulated authentication and financial calculations. It is not a production brokerage system. Passwords and data live in the browser and exported snapshots in plain text. Use fictional information and demo-only passwords. Role checks demonstrate the UI workflow; they are not server-enforced security.

## Scope and capabilities

| Role | Access |
| --- | --- |
| Firm | All accounts; user CRUD and role/status assignment; approve/reject registrations; rep CRUD and account assignment; branch/account management; firm settings; create/edit transactions; snapshot tools |
| Branch | Accounts in its assigned branch; create/edit transactions for those accounts; profile |
| CSR / Rep | Accounts currently assigned to the linked active representative, including accounts across branches; profile |
| Account holder | Its linked account's transactions, positions and balances; profile |

- Public registration requests a role, profile details and a demo password. Firm admins must approve it before sign-in is possible. The approver assigns a branch, rep or account for scoped roles. Firm-role approval grants administration access.
- Suspended and pending users cannot sign in. Deleted users lose access. The last active firm administrator cannot be deactivated or demoted.
- Each account has one primary rep. Assigning it to a different rep transfers that association. The representative's primary branch is organizational metadata; it does not automatically grant access to every branch account. **Assign all accounts in primary branch** adds the current branch accounts; future accounts require assignment.
- Firm name and contact/legal details can be edited under **Firm Settings**.
- **Light theme / Dark theme** is available at login and in the sidebar and persists in the browser.
- Financial screens share one data source. Positions and balances are calculated views; make financial adjustments through **Transactions**.
- Branches/accounts with linked records cannot be deleted until references are resolved. Existing accounts can be closed instead. Deleting an unlinked rep unassigns its accounts.

## Data storage and repeatable demos

`src/data/mockData.ts` contains the original seed fixtures. The app uses `src/data/seed.ts` to initialize its shared `DataProvider` and saves changes to localStorage under `ace-backoffice-demo-v1`. Theme uses `ace-backoffice-theme`. Sign-in itself is intentionally not persisted: a refresh returns to login but retains demo changes.

Changes survive navigation, sign-out, and browser refresh. Tabs on the same origin receive storage updates. Separate devices, browser profiles, private windows, ports, and deployment URLs have separate data. Concurrent tab edits use the last saved snapshot; this is not a multi-user database. Clearing site storage removes local changes. Storage failures are reported to the user.

A deployed static site cannot rewrite a repository source file. For demo persistence across builds or machines:

1. Sign in as a firm admin and open **Firm Settings → Demo data**.
2. Choose **Export demo snapshot** to download `backoffice-demo.json`.
3. On another browser/deployment, use **Import demo snapshot** and confirm replacement. Import validates the file, replaces current demo data and signs out. Sign in with a user/password from the imported snapshot.
4. To make the snapshot the project's default seed, run:

   ```bash
   pnpm seed:demo /path/to/backoffice-demo.json
   pnpm package:demo
   ```

   This validates the snapshot and writes `src/data/demoSeed.json`. Commit that file if the scenario should be included in future deployments. The original `mockData.ts` remains the fallback seed. Existing browsers retain their saved scenario until a firm admin chooses **Reset demo data**.

5. To restore the original seed for future builds:

   ```bash
   pnpm seed:demo --clear
   pnpm package:demo
   ```

**Reset demo data** requires confirmation and returns the browser to the currently packaged seed. Export before replacing data you want to keep. Snapshots include demo passwords and registration details.

For shared approvals and edits across real users/devices, a backend, database, real authentication and server-side authorization are required. Neither deployment below adds those services.

## Custom firm branding

Sign in as a firm administrator, open **Firm Settings**, and click **Edit**. In **Firm Branding**, change **Firm Name** and upload a PNG, JPEG or WebP logo (maximum 512 KB). A transparent square image works best. The preview shows your draft; **Save Changes** applies it to the sidebar, sign-in and registration screens. The browser tab title follows the firm name. **Discard** leaves the saved branding unchanged, and **Use default logo** restores the three blue bars when saved. The legal name is edited separately under General Information.

Branding persists in this browser and is included in demo snapshots. To package a different firm's branding for all new visitors, configure it in the interface, export a snapshot, run `pnpm seed:demo <snapshot.json>`, then run `pnpm package:demo`. Upload the rebuilt package to Netlify or IIS. Existing browsers must reset or import demo data to adopt the new packaged branding. This renames the single demo firm; it does not create an additional tenant or change users' login emails.

The optional `firmInfo.logoDataUrl` snapshot field stores the uploaded image as a data URL. Older snapshots without that field continue to use the default bars. The default firm name is in `src/data/seed.ts`; a custom `src/data/demoSeed.json` overrides that seed. Static page metadata before React loads remains configured in `.figma/make/site.json`.

## Calculation model

- Creating a settled buy debits cash and adds shares; a settled sell credits cash and removes shares. Trade amount is quantity × price, rounded to cents.
- Existing symbols retain their seeded/current mock mark; new symbols use the entered trade price as the mark. Position market value is quantity × mark. Account portfolio value changes by the position market-value delta, and total equity is cash + portfolio value.
- Settled cash deposits/dividends add cash; withdrawals subtract cash.
- Pending, cancelled, failed and rebilled transactions have no financial effect. Set a row to **settled** to apply it. Rebilling does not create a second trade automatically.
- Editing a transaction reverses its previous financial effect and applies the new one. Cancelling reverses the settled effect. Repeated saves do not double-count it. Moving a transaction to another authorized account updates both accounts.
- Seed account totals already include historical activity, so seed transactions are never replayed at startup. Seed position rows are illustrative and do not enumerate each account's full portfolio. Account-level portfolio totals preserve the unlisted holdings.
- Cost basis is a simplified book-cost approximation, not tax-lot accounting. Day P&L stays at the seed value. Margin and buying power are illustrative ratios, not a risk engine. No fees, real quotes, real settlement calendar, or cash-availability enforcement are modeled. Short positions are rejected. Historical stock transfers are view only.

## Dependencies and toolchain

- Node.js **22.18+ on the 22.x line** (the build configuration uses 22.23.2).
- pnpm **10.34.3**, pinned in `package.json` and `.mise.toml`.
- Runtime: React 19, React DOM 19.
- Build: Vite 8, TypeScript 5.x, React Vite plugin 6, Tailwind CSS 4 with its Vite plugin, oxfmt.
- Browser tests: Playwright and Chromium. Unit tests use Node's built-in test runner.
- Google Fonts supplies Inter and JetBrains Mono; system fonts are used if offline.

`pnpm-lock.yaml` pins the resolved versions. Keep it in source control. Figma CLI is only needed for the original `.figma/make/deploy*` scripts, not local development, Netlify or IIS.

## Local setup

If using mise, install and activate mise in your shell, then:

```bash
mise install
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm dev
```

Alternatively, install Node 22 and `npm install --global pnpm@10.34.3`, then run the last two commands. If mise is installed but not activated, prefix commands with `mise exec --`, for example `mise exec -- pnpm dev`.

Open **http://localhost:8443** (HTTP, despite the port number). Vite hot-reloads source changes. In Figma Make the development server may already be running. If the port is occupied, use `pnpm dev --port 8444`.

No `.env` file or backend is required. Keep `.figma/make/site.json` available: `vite.config.ts` imports it for page metadata.

### Demo sign-in

Choose the corresponding role, enter the email, select **Skip verification (demo)** (or enter any six digits), then enter the password. No verification email is sent.

| Role | Email | Password |
| --- | --- | --- |
| Firm | admin@acefirm.com | firm123 |
| Branch | bmgr@acefirm.com | branch123 |
| CSR Rep | csr@acefirm.com | csr123 |
| Account Holder | client@acefirm.com | acct123 |

These are the original seed credentials. An imported/custom seed or user edits can change them.

## Commands and verification

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Local Vite server, default port 8443 |
| `pnpm typecheck` | TypeScript validation |
| `pnpm test` | Calculation, scope, user validation, snapshot and deployment mapping tests |
| `pnpm exec playwright install chromium` | One-time browser installation |
| `pnpm test:e2e` | End-to-end browser tests; starts Vite on 127.0.0.1:4173 (CI tests a production build; run `pnpm build` first) |
| `pnpm build` | Type-check and create production `dist/` |
| `pnpm preview --port 8444` | Preview an existing production build locally |
| `pnpm package:demo` | Build and generate both deployment folders under `release/` |
| `pnpm seed:demo <snapshot.json>` | Validate and save a project seed snapshot |
| `pnpm format` | Format project files with oxfmt |

Recommended pre-demo check:

```bash
pnpm test
pnpm test:e2e
pnpm package:demo
pnpm preview --port 8444
```

Browser tests run in isolated browser contexts, without altering your normal browser's demo data. Failed traces and screenshots are written to `test-results/`. Generated outputs are gitignored.

Manual walkthrough:

1. Register a fictional account user. Sign in as firm, open **Users & Approvals → Pending Registrations**, select `ACC-78341`, then approve.
2. Create a settled buy for `ACC-78341`: symbol `DEMO`, quantity `10`, price `25`. Cash decreases by $250 and a position appears. Edit quantity to `20`; the total cash decrease becomes $500. Cancel it to reverse the effect.
3. Sign out and sign in as the approved account user. Check Transactions, Positions, and Balances. Refresh, sign in again, and verify persistence.
4. Assign a Chicago account to Sofia's rep record, sign in as CSR, and verify its account data is visible. Branch login remains limited to its own branch.
5. Switch themes, edit firm info, export a snapshot, and try importing/resetting it after making a backup.

## Deployment packages

Run `pnpm package:demo`. Output:

```text
release/
  netlify/       # Upload the contents as a static Netlify site
  windows-iis/   # Copy the contents to an IIS website root (includes web.config)
  README.md
  BUILD.txt
```

These are ready-to-upload folders, not source-code bundles. Deploy `index.html` and `assets/` together. The browser runs all app logic; no Node process or database is needed on the hosting server. Do not open `index.html` via `file://`; use an HTTP server.

### Netlify

**Manual deployment:**

1. Run `pnpm package:demo` locally.
2. In Netlify, create a site using its manual deploy/upload option and upload `release/netlify/`.
3. Open the assigned HTTPS URL and test the original or custom seed credentials.
4. For updates, rebuild and upload the new `release/netlify/` folder to that same site's deploy area.

**GitHub Actions deployment (develop → qa → main):**

See [CI/CD setup and promotion guide](docs/cicd.md). The repository includes `.github/workflows/netlify.yml`:

- `develop` → `https://develop--mts-backoffice.netlify.app`
- `qa` → `https://qa--mts-backoffice.netlify.app`
- `main` → `https://mts-backoffice.netlify.app`, after successful tests and configured GitHub production-environment approval.

Create GitHub environments `dev`, `qa`, and `production`, configure required reviewers for production, and add `NETLIFY_SITE_ID` and `NETLIFY_AUTH_TOKEN` as environment secrets. Stop independent Netlify Git builds so they cannot bypass the GitHub approval gate. The guide has exact setup steps; credentials and reviewer rules cannot be supplied by the workflow YAML alone.

`netlify.toml` now skips Netlify-hosted Git builds intentionally. GitHub builds and tests the site, then uploads that same build via the Netlify CLI. Manual folder uploads remain supported.

The current app navigates using React state at the site root; it does not require an SPA history rewrite rule. If URL-based routing is added later, add the corresponding fallback configuration.

References: [Netlify Vite deployment](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/), [Netlify dependency management](https://docs.netlify.com/build/configure-builds/manage-dependencies/), [repository deployment](https://docs.netlify.com/start/quickstarts/deploy-from-repository/).

### Hosted Windows Server with IIS

Assumes you can administer an IIS site and copy files to it. If a hosting provider manages IIS, ask them to point a static website at the uploaded folder with `index.html` as the default document.

1. Build locally with `pnpm package:demo`.
2. In Windows Server Manager, enable **Web Server (IIS)** with **Static Content** and **Default Document** under Common HTTP Features. Use IIS Management Console to configure the site. No ASP.NET runtime or URL Rewrite module is needed for this app.
3. Copy the **contents** of `release/windows-iis/` to a dedicated directory such as `C:\inetpub\mts-backoffice`. `index.html`, `assets/`, and `web.config` should be directly inside it.
4. In IIS Manager, add a website whose physical path is that directory. A dedicated application pool using **No Managed Code** is sufficient. Grant the configured anonymous/application-pool identity read access to the directory; write access is unnecessary.
5. Add the appropriate host name and HTTP/HTTPS bindings. Configure your certificate, DNS, and hosting firewall for that site. For a local test binding on port 8080, open `http://localhost:8080` on the server.
6. `web.config` configures `index.html` as the default document and static JSON MIME handling. Open the site and run the manual walkthrough above.
7. To update, replace the site's static files with a newly built package. Keep `index.html` and its hashed assets from the same build together.

For transfer as a zip from PowerShell:

```powershell
Compress-Archive -Path .\release\windows-iis\* -DestinationPath .\backoffice-iis.zip -Force
```

The default build assumes a domain/site root (`/`). To deploy under a virtual directory such as `/backoffice/`, build with that base and then package the existing build:

```bash
pnpm build --base=/backoffice/
node scripts/package-demo.mjs
```

Do not run `pnpm package:demo` immediately afterward: it rebuilds with the default base. Set the IIS application/virtual-directory path to match.

References: [IIS default documents](https://learn.microsoft.com/en-us/troubleshoot/developer/webapps/iis/www-modules-features/configure-default-document-iis), [IIS configuration](https://learn.microsoft.com/en-us/iis/get-started/planning-your-iis-architecture/getting-started-with-configuration-in-iis-7-and-above).

## Architecture and configuration

```text
src/App.tsx                     Provider, login/registration, role-gated navigation
src/context/DataContext.tsx     Shared state, localStorage, mutations, approvals, scope selectors
src/data/mockData.ts            Original Figma demo fixtures
src/data/demoSeed.json          Optional exported scenario (null uses original fixtures)
src/data/seed.ts                Seed selection
src/data/demoModel.ts           Pure calculation, role scope and user validation
src/data/snapshot.ts            Snapshot format validation
src/types.ts                   Domain and UI types
src/components/                Login, administration, account and financial views
src/index.css                  Tailwind import, theme variables, shared styles
public/web.config              Copied into production output for IIS
scripts/                       Seed import and deployment packaging
netlify.toml                   Netlify build/hosting configuration
playwright.config.ts           Browser test configuration
```

Vite environment settings: `PORT` overrides 8443; `FIGMA_DEV_SERVER_HOST` overrides the default bind address `0.0.0.0`; `FIGMA_PUBLIC_URL` changes the asset base for Figma-hosted deployments. For local-only access, use `pnpm dev --host 127.0.0.1`. `.figma/make/deploy` and `deploy-preview` are Figma-specific publishing wrappers; don't use them for Netlify/IIS.

## Troubleshooting

- **node/pnpm not found:** activate mise in the terminal or use `mise exec -- pnpm …`.
- **Port already in use:** open the existing server or choose another port with `--port`.
- **Blank page / assets 404:** serve via HTTP, upload all build files, and check the Vite base matches the hosting path. Leave `FIGMA_PUBLIC_URL` unset outside Figma.
- **IIS 403.14:** verify Default Document is installed and `index.html` is in the site root.
- **IIS 500.19:** the host may lock a section used in `web.config`; configure those settings at the site/server level with the host administrator and remove the conflicting local section. Check IIS's detailed error for the specific section.
- **Demo edits missing on another URL/device:** localStorage is browser/origin specific. Export/import the snapshot or package it as the seed.
- **New deployment still shows old demo data:** browser data is intentionally retained. Export if needed, then use **Reset demo data** to load the newly packaged seed.
- **Lost every usable demo credential:** clear only `ace-backoffice-demo-v1` in browser developer tools → Application/Storage → Local Storage, then reload. This discards that browser's saved scenario and loads the packaged seed.
- **Fonts unavailable offline:** system font fallbacks work; layout may differ slightly.
