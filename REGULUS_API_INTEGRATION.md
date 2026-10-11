# Frontend integration with regulus-main

Original source review: 2026-10-09. Implementation update: 2026-10-10.

Dev API mode is now implemented separately in `src/components/api/ApiApplication.tsx` and
`src/api/regulus.ts`, preserving the demo provider rather than forcing incomplete API fields into
its demo models. It includes account reads/create/rename/delete, dated book views, reviewed vendor
JSON posting, loading/errors, duplicate-submit prevention and uncertain-write handling. Vite supplies
the local proxy; Netlify now uses a server function with a deploy-scoped secret target (2026-10-11). The deploy command no longer combines
`--context` with `--no-build`. See README and docs/cicd.md for commands and release steps.

Live read-only checks confirmed the specified dev server accepts unauthenticated requests for firm 1.
It can return an empty book with `firmId: 0` and blank account ID rather than the inspected source's
404. The client handles this sentinel explicitly. No writes were made to the shared dev API during
implementation. The source-contract discussion below still describes the local regulus-main checkout;
its authentication and missing-book behavior do not exactly match the deployed dev instance.

User-role services, full account-detail editing, friendly financial action/code mappings,
transaction corrections, and production authentication remain backend-dependent work. The tables
below describe the broader integration specification, not a claim that every proposed file was added.

## 1. What needs to change

The UI can be retained, but its data and authentication layers need substantial changes. Today, all business data, credentials, approvals, calculations, and mutations run in the browser through `src/context/DataContext.tsx`. There is no API client. Changing `index.html` or setting an API URL alone will not integrate the application.

The central work is to:

1. Introduce an HTTP client, backend DTOs, and explicit DTO-to-view-model adapters.
2. Replace the demo store with asynchronous account/book loading and API mutations.
3. Replace demo authentication and enforce account permissions on a server.
4. Adapt views to the fields and operations actually available from Regulus.
5. Configure development proxying and production API access.
6. Add backend capabilities for features the current API does not expose.

A useful first milestone is an authenticated account selector with read-only balances, positions, and book activity. Account creation and financial posting can follow once their contracts are accepted. Full parity with every existing screen requires backend development.

## 2. Verified API contract

Paths below are the existing **Regulus** routes. A new backend-for-frontend (BFF) can expose a different browser-facing contract, but that would be new implementation.

| Method and path | Request | Response / implication |
| --- | --- | --- |
| `GET /api/database` | No parameters | Plain text database name. Authenticated connectivity diagnostic; not JSON and not a readiness guarantee. |
| `GET /api/accounts?firmId=1` | Optional integer `firmId` | Array containing only `accountId` and `accountName`. Always supply the authorized firm in this application. |
| `POST /api/account/edit` | Account JSON; `firmId` and `accountId` required | `201` with account DTO. Creates an account master record, not a financial book. |
| `PATCH /api/account/edit?firmId=1&accountId=ABC123` | Changed account fields | `200` with account DTO. Omitted/null values are unchanged; `false` is applied. Identity comes from query parameters. |
| `DELETE /api/account/edit?firmId=1&accountId=ABC123` | Query identity | `200` JSON message and identity. Does not explicitly delete books; database constraints may reject deletion. |
| `GET /api/asset?firmId=1&accountId=ABC123` | Optional `processDate=YYYY-MM-DD` | Vendor asset/book response. Without a date, returns latest book; with a date, looks up that exact dated snapshot. Missing book returns `404`. |
| `POST /api/cash` | Vendor cash request | `200` with updated vendor asset response. |
| `POST /api/trade` | Vendor trade request | `200` with updated vendor asset response. |
| `POST /api/stock` | Vendor stock request | `200` with updated vendor asset response. |

All routes above require HTTP Basic authentication. `SecurityConfig.java` currently creates one configured in-memory user with role `API`, using `API_USERNAME` and `API_PASSWORD`. It is stateless. There is no `/login`, `/logout`, `/me`, token refresh, or four-level user-role API.

Errors normally have the shape `{ "error": "message" }`. Handle `400`, `401`, `403`, `404`, `409`, `415`, and `500`, plus transport failures and unexpected proxy responses. Financial POSTs can return `409` when `processDate` precedes the latest book.

### Which backend sources are authoritative?

Within the backend repository, use:

- `docs/openapi.yaml`: paths and schemas, especially `AccountSummary`, `Account`, `AccountPatch`, `Vendor_cash`, `Vendor_trade`, `Vendor_stock`, and `Vendor_demoAsset`.
- `src/main/java/com/regulus/api/controller/AccountController.java` and `AssetController.java`: active HTTP routes.
- `src/main/java/com/regulus/api/service/AccountService.java`: account mutation behavior.
- `src/main/java/com/regulus/api/service/RegulusBoAssetService.java`: actual financial request processing and book responses.
- `src/main/java/com/regulus/api/config/SecurityConfig.java`: actual authentication configuration.
- `examples/cash-request.json`, `trade-request.json`, `stock-request.json`, and `legacy-asset.json`: example wire payloads.
- `docs/LEGACY-INTEGRATION.md` and `README.DEVELOPMENT.md`: current engine integration and operational limitations.

The preserved local `model/AccountAsset.java`, `model/Trade.java`, `model/Cash.java`, and `model/Stock.java` are **not the financial HTTP contract**. Financial controllers call the vendor engine and return `outDemoJson()`. The original historical README and `docs/original/` must not override the current controllers and contract.

## 3. Feature coverage and gaps

| Current frontend feature | Integration status | Required treatment |
| --- | --- | --- |
| Account selector/list | Supported, minimal fields | Load summaries by authorized firm. |
| Full account management | Partial | Supported write fields differ from the UI; there is no full account-detail GET. Add a detail endpoint or richer list before offering complete edit forms. |
| Balances and positions | Available per account/book | Map vendor fields, preserve account type and snapshot date, and confirm financial semantics. |
| Transaction display | Available as book arrays | Merge `cashes`, `trades`, and `stocks` for the selected book. Do not claim this is a complete historical ledger. |
| Create financial posting | Available with different payloads | Add vendor request adapters and obtain accepted action/code/sign mappings. |
| Edit, cancel, rebill an existing transaction | No dedicated route | Disable initially. Vendor fields such as `cxlrblInd` do not establish a supported reversal workflow by themselves. |
| Pending/failed/settled status workflow | No matching application workflow | Do not map a successful POST automatically to “settled.” Add defined lifecycle support or display book activity with an unavailable status. |
| Firm/branch/CSR/account login and permissions | Missing | Implement identity and server-side authorization, or a BFF with both. |
| Users, registration, approvals, password/profile updates | Missing | Hide/disable these screens in API mode until corresponding services exist. |
| Branch and rep management | Missing CRUD/directory APIs | `account.branch` and `account.rep` are codes, not directory records. Add directories and assignment rules. |
| Firm settings and uploaded branding | Missing persistence API | Use configured read-only branding initially, or implement settings/logo storage. |
| Market ticker and day P&L | No corresponding market-data API | Remove demo numbers in API mode; show unavailable values or integrate a separate accepted source. |
| Snapshot import/export/reset | Browser-demo feature | Disable these controls in API mode. Never replay a demo snapshot as financial POSTs. |

## 4. Authentication and deployment architecture

Recommended production request flow:

```text
React browser UI
    -> same-origin authenticated BFF / application gateway
        -> Regulus /api/* using server-held Basic credentials
            -> SQL Server and vendor engine
```

The BFF is **new work**, not an existing part of either repository. It must authenticate each application user, determine their firm/branch/rep/account scope, and authorize every read and mutation. A transparent proxy that merely adds shared credentials does not solve authorization. Browser role selection and `useScopedData()` filtering cannot protect data downloaded to an unauthorized client.

An alternative is to extend Regulus itself with application-user authentication and resource-level authorization. In either design, return the user identity, permitted scope, and capabilities from a new session/identity contract. Do not invent roles from the shared `API` role.

For a developer-only connectivity spike, the browser can send Basic credentials entered at runtime through a local proxy. Keep them in memory and clear them on sign-out; this still grants the broad permissions of the shared API user and cannot validate production role isolation. Browser sign-out does not revoke shared upstream credentials.

Do not put shared API credentials in `VITE_*`, the source tree, static hosting files, localStorage, or the built JS bundle. For a session-cookie BFF, implement secure cookie handling and CSRF protection for writes. Choose that session contract before implementing login.

The inspected backend has no CORS configuration. A Vite development proxy avoids browser cross-origin requests locally. Production needs its own gateway/proxy. If calling a separate API origin directly, add explicit allowed origins, methods, and headers in backend configuration and integrate CORS into `SecurityConfig.java`; authenticated preflight requests must work. Use HTTPS outside local development.

## 5. Frontend files to add

These are proposed file names; they do not exist yet.

| New file | Responsibilities |
| --- | --- |
| `.env.example` | Document public mode/base URL and development proxy target; no credentials. |
| `src/api/config.ts` | Read and validate API mode/base URL; fail clearly on invalid configuration. |
| `src/api/client.ts` | Shared `fetch` wrapper: query encoding, appropriate Accept/Content-Type, authentication transport, abort signal, response validation, typed errors, and text support for `/database`. No automatic financial POST retries. |
| `src/api/regulus.types.ts` | Wire DTOs taken from reviewed OpenAPI. Keep vendor request and response DTOs distinct. |
| `src/api/accounts.ts` | `listAccounts`, `createAccount`, `patchAccount`, `deleteAccount` using the exact existing routes. |
| `src/api/assets.ts` | `getAsset`, `postCash`, `postTrade`, `postStock`; all return validated vendor DTOs. |
| `src/api/adapters.ts` | Explicit mappings to view models, including nullable/unavailable fields and stable composite identities. No replacement accounting engine. |
| `src/context/AuthContext.tsx` | Application session, initial session loading, sign-in/sign-out, server-issued identity/scope, and expiry handling for the chosen new auth contract. |
| `src/context/ApiDataContext.tsx` | API state, per-resource loading/errors, book cache, mutation state, and refresh/invalidation. |
| `src/context/DemoDataContext.tsx` | Optional extraction of the existing store if demo mode must remain supported. |

Native `fetch` is sufficient; no new runtime package is required for transport. If choosing generated OpenAPI types, runtime schema validation, or a query library, add the chosen dependency and update `pnpm-lock.yaml`. TypeScript types alone do not validate JSON from the network.

## 6. Existing frontend files to change

| File | Specific changes |
| --- | --- |
| `src/context/DataContext.tsx` | Highest-impact change. Replace or extract `useDemoStore`. Define an explicit context interface instead of `ReturnType<typeof useDemoStore>`. Separate session and theme from business data. Replace synchronous mutation methods with promises. Replace localStorage business persistence and demo calculations with API state. Refactor `useScopedData` so server-authorized scope is primary. |
| `src/types.ts` | Separate view types from API DTOs. Introduce numeric backend firm identity and composite account keys. Allow unavailable financial/profile fields rather than requiring fabricated values. Add explicit capabilities and loading/error types. Keep password-bearing demo types out of API user state. |
| `src/App.tsx` | Compose auth/data providers, handle session bootstrap and API errors, and gate navigation by actual capabilities. Replace the fixed `MARKETS` data and `DEMO` indicator appropriately. Hide registration when unsupported. |
| `src/components/LoginView.tsx` | Remove dependence on downloaded `appUsers`, local password comparisons, arbitrary six-digit verification, and “Skip verification (demo)” in API mode. Await real authentication and show errors. User role must come from the server. |
| `src/components/RegistrationView.tsx` | Disable in API mode initially; later await a new registration endpoint. Do not store passwords in the business-data snapshot. |
| `src/components/AccountManagementView.tsx` | Await create/PATCH/delete; distinguish create from update. Use backend account codes. Remove unsupported editable fields or persist them through an extended contract. Require a detail read before full editing; do not infer missing branch/rep from defaults. |
| `src/components/TransactionsView.tsx` | Read mapped book activity; add account/date selection, loading/error states, and valid filters. Replace the browser-save/recalculation message. Do not expose unsupported status, CSR, edit, cancel, or rebill behavior. |
| `src/components/TransactionEditor.tsx` | Create vendor posting drafts separate from displayed transaction rows. Add process date, account type, currency, and required business fields. Dispatch new postings by type, await success, prevent duplicate submissions, and refresh the book. Existing transaction editing stays disabled pending a defined backend workflow. Stock submission requires a new form; it is currently view-only. |
| `src/components/PositionsView.tsx` | Render mapped vendor positions; support nullable metrics and account-type/lot distinctions. Stop expecting mock day-change and description fields to always exist. |
| `src/components/BalancesView.tsx` | Use backend balances/summary/margin fields with accepted labels; remove illustrative ratios and show unavailable metrics explicitly. |
| `src/components/Dashboard.tsx` | Aggregate only loaded, authorized, date/currency-compatible data. Show partial coverage when some account books fail or are absent. Do not treat missing books or unavailable P&L as zero. |
| `src/components/BranchManagementView.tsx`, `RepManagementView.tsx`, `UserManagementView.tsx` | Capability-gate until APIs exist; then replace all local CRUD/approval methods with awaited calls. Rep assignment can require multiple account changes and needs a server-side transactional workflow for atomic behavior. |
| `src/components/ProfileView.tsx` | Gate profile/password changes until an identity service supports them; await updates and avoid demo password logic. |
| `src/components/FirmSettingsView.tsx`, `FirmBrandingEditor.tsx`, `FirmLogo.tsx` | Provide configured branding fallback; gate editing until settings/logo persistence exists. Logo validation can remain a UI utility. |
| `src/components/Sidebar.tsx` | Hide unavailable navigation and demo tools using capabilities; retain server-derived scope labels. |
| `src/components/DemoDataTools.tsx` | Render only in explicit demo mode. |
| `src/components/shared.tsx` | Format null/unavailable amounts as “—”; handle unknown statuses and asynchronous state consistently. |
| `src/data/demoModel.ts`, `seed.ts`, `mockData.ts`, `demoSeed.json`, `snapshot.ts` | Keep isolated for demo/tests or remove from API runtime. Never run `saveTransaction` or `buildBalances` against live books. |
| `vite.config.ts` | Add development API proxy while preserving the existing React, Tailwind, Figma plugins, asset base, and server settings. |
| `src/vite-env.d.ts` | Add types for the public Vite variables. |
| `.github/workflows/netlify.yml` | Supply public integration configuration during the build and run API-mode browser coverage. Keep upstream credentials exclusively in the server deployment. |
| `netlify.toml`, `public/web.config` | Configure the chosen production gateway routing where appropriate. Current configuration serves static files and has no API proxy. IIS proxying requires additional server support/configuration. |
| `scripts/package-demo.mjs`, `scripts/netlify-deploy.mjs`, `docs/cicd.md`, `README.md` | Document/package the API deployment separately from a standalone demo and verify gateway reachability. A static upload cannot provision a BFF or SQL Server connectivity. |
| `package.json`, `tests/`, `playwright.config.ts` | Wire new contract/adapter/client tests and API-mode browser tests; retain demo tests if retaining demo mode. |

`index.html`, `src/main.tsx`, `.mise.toml`, and the Tailwind setup need no integration-specific changes for the proposed provider architecture. `src/index.css` only needs changes if adding new state presentation. Static metadata remains configurable through `.figma/make/site.json`; the current provider also sets a demo document title, which should become mode-aware.

## 7. DTO and field mapping specification

### Account identity and account editing

Use `(firmId, accountId)` as the identity throughout caches, requests, and React state. Backend `firmId` is an integer; current demo IDs such as string firm identifiers must not be coerced blindly with `Number()`. Obtain the real firm from authorized server context. Preserve `accountId` as a string, including leading zeroes.

Always request accounts for a specific authorized firm. The unfiltered summary endpoint omits firm identity and can return ambiguous account IDs across firms.

| Frontend field | Backend mapping / limitation |
| --- | --- |
| `AccountRecord.id` | `accountId` |
| `ownerName` | `accountName` for display; confirm whether this represents owner or account title. |
| `branchId`, `repId` | `branch`, `rep` on full account DTOs; absent from list summaries. |
| `branchName`, `repName` | No directories supplied by current API. |
| `type` | Candidate `accountCat`; the UI enum and backend business codes need an agreed mapping. |
| `email`, `phone`, `status`, `openedAt` | Not exposed by current account DTO. Hide, mark unavailable, or extend backend storage/contract. |
| Financial totals | Load from account book, not account master response. |
| Additional editable backend fields | `correspondent`, `marginable`, `aggregate`, `taxlotMethod`; expose only with valid options/rules. |

Example supported account creation:

```json
{
  "firmId": 1,
  "accountId": "ABC123",
  "accountName": "Example Account",
  "marginable": false
}
```

Build PATCH bodies from explicitly changed, supported fields. Omitting a field preserves it; `null` does not clear it. Disable editing identity on existing accounts. Account creation and book creation are separate: show “No book for this account/date” on asset `404`, rather than a generic empty portfolio or a seeded balance.

### Financial reads

The actual response has `account`, `processDate`, `balances[]`, `positions[]`, `actsum`, `margin`, `tradesum`, `cashes[]`, `trades[]`, `stocks[]`, and other vendor arrays. It is not the local Java `AccountAsset` shape with a top-level `cashBalance` and a positions map.

These are mapping candidates requiring acceptance against representative vendor output:

| UI concept | Candidate vendor source | Required decision |
| --- | --- | --- |
| Account identity and codes | `account.firmId/accountId/branch/rep` | Master data and snapshot codes may differ; decide which governs display. Authorization must remain server-side. |
| As-of date | `processDate` | Business date, not a live quote timestamp. |
| Cash, margin balance, equity | `actsum.cashBal`, `actsum.marginBal`, `actsum.totalEquity` | Preserve engine sign conventions; do not reapply demo formulas. |
| Buying power | `margin.ovBP` or `margin.dtBP` | Overnight and intraday are different; choose and label explicitly. |
| Position symbol/type | `positions[].secId`, `secType` | Confirm security-code mapping; unknown types remain unknown. |
| Position quantity | `tdQty` versus `sdQty` | Trade-date and settled quantities differ. Keep both if useful. |
| Price, cost, value, unrealized | `marketPrice`, `unitCost`, `marketValue`, `unRealized` | Confirm basis, freshness, and engine conventions. Do not infer percent P&L without a defined denominator. |
| Transactions | `cashes`, `trades`, `stocks` with parent account/date | Snapshot activity is not a paginated all-time ledger. |
| Transaction reference | `controlId` | Not proven unique or an idempotency key. Do not rely on it alone as a React key or update identity. |

There is no direct accepted mapping for all existing fields such as pending deposits, pending withdrawals, day P&L, margin used/available, CSR names, and transaction status. Make view-model fields nullable or remove corresponding columns. Do not populate missing numbers with zero.

Position rows may repeat a symbol across account types or lots. Use a response-scoped composite row identity that prevents collisions; a row index can disambiguate immutable snapshot display, but is not an update key. Use the same caution for transaction references across accounts, dates, and types.

Keep dates as date-only strings when the API uses business dates, avoiding timezone conversion. Preserve server-calculated values; use an agreed decimal representation for any client-side monetary validation/aggregation rather than treating JS floating-point calculations as authoritative accounting. Do not add incompatible currencies or mix book dates silently.

### Financial writes

Do not send the current `Transaction` object directly. Vendor requests use nested `account`, `processDate`, and vendor field names. For example, the backend's supplied cash example is:

```json
{
  "account": {
    "firmId": 1,
    "accountId": "ABC123",
    "correspondent": "",
    "branch": "",
    "rep": ""
  },
  "accountType": 1,
  "processDate": "2026-10-08",
  "tradeDate": "2026-10-08",
  "settleDate": "2026-10-08",
  "asofDate": "2026-10-08",
  "currency": "USD",
  "amount": 100.0,
  "amountCurr": 100.0,
  "entryCode": "DEPO",
  "subSource": "DEPOSIT",
  "desc1": "test",
  "controlId": "CASH001"
}
```

This is a local test example, not a template to reuse for every cash action. The trade/stock examples additionally use fields such as `secType`, `secId`, `qty`, `qtyCurr`, `qtyOrig`, `price`, `amountCurr`, and `amountOrig`; stock includes `location`.

Implement separate draft-to-request adapters for each supported action. Before enabling writes, get accepted examples for buys/sells, deposits/withdrawals/dividends, stock receipts/deliveries, account types, signs, fees, dates, and correction codes. Do not infer these rules from field names or the demo enum. Do not confuse vendor numeric `accountType` with frontend individual/joint/IRA account categories.

After a successful POST, install the returned asset response for that account/date and invalidate related summaries; refetch as necessary. Do not also execute `saveTransaction()` or `buildBalances()`. Forward process dates can roll books forward. Earlier dates return a conflict instead of editing history.

The API has no guaranteed idempotency or automatic deduplication. Disable submit while a request is in flight. If a network timeout leaves the result uncertain, show an unknown outcome, inspect refreshed book activity, and require reconciliation before resubmission. A client-generated `controlId` alone does not make retry safe. Reliable replay/status checks require backend idempotency support.

## 8. Data-loading and mutation behavior

1. Resolve the authenticated user and permitted scope before loading business data.
2. Fetch authorized account summaries. Fetch a selected account book on demand, keyed by firm, account, and requested date/latest.
3. For aggregate views, fetch only authorized accounts with bounded concurrency. Track each book's loading/error/missing state. A future batch summary endpoint is preferable for large firms.
4. Abort or discard stale responses when account/date/user changes. Clear caches and sensitive state on sign-out; prevent an old request from restoring them.
5. Distinguish initial loading, no accounts, missing book, failed request, stale data, and partial aggregates. Never fall back to demo seeds after an API error.
6. Convert every mutation call site to `async`/`await`; keep forms open until success and retain entered data on failure. Synchronous `try/catch` will not catch an unawaited rejected promise.
7. Keep safe preferences such as theme in localStorage. Business data and passwords must no longer be persisted through the demo snapshot mechanism in API mode.

Use an explicit interface such as `createAccount(input): Promise<AccountDto>` and `postCash(input): Promise<VendorAssetDto>`. Avoid pretending that unsupported methods such as `approveRegistration` or `updateTransaction` are successful no-ops; expose capability flags and reject unsupported programmatic calls.

## 9. Environment and proxy configuration

Proposed public/development configuration:

```dotenv
VITE_DATA_MODE=api
VITE_API_BASE_URL=/api
REGULUS_PROXY_TARGET=http://127.0.0.1:8080
```

`REGULUS_PROXY_TARGET` is consumed by Vite on the development server, not browser code. It can point directly to local Regulus for a restricted spike, or to a local BFF that implements the browser contract. Adjust ports to the actual service. A production firm identity should come from authorized session context, not an editable environment value.

Example additions to the existing `vite.config.ts` callback:

```ts
// Add loadEnv to the existing Vite import, use the existing { mode }
// callback argument, and merge this into the existing server configuration.
const env = loadEnv(mode, process.cwd(), '');

// Inside server:
proxy: {
  '/api': {
    target: env.REGULUS_PROXY_TARGET || 'http://127.0.0.1:8080',
    changeOrigin: true,
  },
},
```

Keep `/api` in the forwarded path: Regulus already expects it. Do not define or expose the entire loaded environment in the client bundle. Use `/api` as the client base and `/accounts`, `/asset`, etc. as service-relative paths to avoid `/api/api/...`. Construct query strings with `URLSearchParams`.

The existing frontend normally runs on HTTP port `8443`; Regulus defaults to `8080`. The frontend dev server is already running in the supplied environment; configuration changes may require a restart, not a second competing server. For a new local API instance, the backend documents:

```sh
cd {regulus_api_home}/regulus-main
./gradlew bootRun --args='--spring.profiles.active=local'
```

This requires the backend's documented JDK 8 setup and uses disposable H2 data. Its local-only credentials are `developer` / `local-only-password`. Use `GET /api/database` and `GET /api/accounts?firmId=1` to check connectivity; seed account master records and books separately in that disposable environment when testing writes.

Vite's proxy does not ship in `dist/` and is not supplied by static `vite preview` hosting. Configure a real production gateway. If using the existing Netlify host, the gateway must be reachable from that hosting environment; a developer's `localhost:8080` cannot serve deployed users. For IIS, provision reverse-proxy capability or a separate BFF deployment rather than assuming the current static `web.config` is enough.

`VITE_*` values are build-time public configuration. In `.github/workflows/netlify.yml`, the build occurs in `verify`, while environment selection currently occurs in `deploy`. Setting variables only in the deploy job will not alter an already-built bundle. Prefer a stable same-origin `/api` across environments; otherwise explicitly select non-secret build variables in the build job or implement validated runtime public configuration. Keep the tested-artifact deployment behavior.

## 10. Backend additions needed for full application coverage

All paths here are relative to {regulus_api_home}/regulus-main`; these changes are proposed, not already available.

| Area | Files / location | Required implementation |
| --- | --- | --- |
| Identity and permissions | `config/SecurityConfig.java` plus new identity controllers/services under `src/main/java/com/regulus/api/` (or separate BFF) | Application users, sessions/tokens, server-side role and resource scope; enforce on every route, including financial account identity. |
| Complete account reads | `controller/AccountController.java`, `service/AccountService.java`, `repository/AccountRepository.java`, account DTOs | Expose full authorized account details or an enriched list. The repository already has `findByFirmAndAccount`, but it is not exposed as a GET route. |
| Account metadata/lifecycle | Account DTOs, service, repository, database migrations | Persist supported UI metadata and define close versus delete behavior; do not rely on frontend-only linked-data checks. |
| Branch/rep/user/registration/firm settings | New controllers/services/repositories and migrations | Explicit schemas, directory reads, CRUD, approval workflows, assignments, profile/password operations, and branding persistence. Existing `UserRepository` does not provide these HTTP features. |
| Financial correction/retry workflows | `controller/AssetController.java`, `service/RegulusBoAssetService.java`, persistence support | Accepted cancel/rebill commands, durable transaction identity, audit actor, idempotency and outcome lookup. Do not implement edits as uncontrolled repeat POSTs. |
| Historical/reporting views | New query services/controllers and repository methods | Date-range activity, pagination/filtering, stable transaction identifiers, authorized batch balances, and documented currency/as-of semantics. |
| Cross-origin access, if selected | `config/SecurityConfig.java` and a new CORS configuration | Explicit origins, headers/methods, and valid preflight handling. |
| Contract and regression coverage | `docs/openapi.yaml`, `src/test/java/com/regulus/api/` | Document and test each added endpoint, scope rejection, payload mapping, and mutation behavior. |

An account master and a financial book are independently managed in the current implementation. In particular, financial processing does not establish application-user authorization or require an account master lookup in the service. Add the desired consistency and permission checks on the server; a frontend dropdown is insufficient.

## 11. Suggested implementation order and acceptance checks

### Phase 1 — contract and read-only connectivity

- Choose BFF versus Regulus-native identity, and document allowed scope/capabilities.
- Add configuration, proxy, client, DTOs, and validated read adapters.
- Implement account selection and book/date reads. Show missing books and unsupported values honestly.
- Hide unsupported management screens and all demo financial figures in API mode.
- Confirm account IDs with leading zeroes/special characters, multiple firms, date-specific reads, `401/403`, missing books, and malformed responses.

### Phase 2 — account and posting workflows

- Add full account reads before complete account editing.
- Implement supported account create/PATCH/delete with awaited UI handlers and refresh.
- Accept vendor financial mappings using owner-supplied cases, then enable only those posting actions.
- Test conflict/error paths, process-date rollover, no duplicate submissions, uncertain timeouts, and returned-book rendering without frontend recalculation.

### Phase 3 — complete management and deployment

- Implement the missing backend workflows and add their frontend screens incrementally.
- Verify server-side denial for another firm's/account's data using crafted requests, not only hidden navigation.
- Configure development, QA, and production gateways and session behavior; test the actual hosted build.

Proposed frontend tests: `tests/api-client.test.ts`, `tests/api-adapters.test.ts`, and `tests/browser/api.spec.ts`. Use reviewed fixtures for contract tests and intercepted browser responses for deterministic UI tests; additionally exercise a disposable local backend for cross-repository integration. The current `pnpm test` script names test files explicitly, so add new unit-test files to that script. Keep `tests/model.test.ts` and `tests/browser/demo.spec.ts` tied to demo mode if that mode remains.

After implementation, run:

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Also run relevant backend tests and accepted vendor/SQL Server integration cases when backend code changes. Existing H2/vendor tests demonstrate basic posting and persistence, but do not certify every sign convention, financial result, concurrency scenario, or live SQL Server schema.

Completion means API-mode reads and saves survive reload through the backend, unsupported features are clearly gated, no demo balances or credentials are used, all role scope is enforced server-side, and the deployed frontend reaches the intended environment through its configured gateway.
