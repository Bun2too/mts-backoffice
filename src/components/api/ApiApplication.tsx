import { useEffect, useRef, useState, type FormEvent } from "react"
import {
  ApiError,
  createRegulusClient,
  type AccountSummary,
  type Asset,
  type Row,
} from "../../api/regulus"
import "./api.css"

const firmId = Number(import.meta.env.VITE_REGULUS_FIRM_ID || "1")
const client = createRegulusClient(
  import.meta.env.VITE_API_BASE_URL || "/api",
  firmId,
)
const tabs = [
  "Overview",
  "Balances",
  "Positions",
  "Transactions",
  "Accounts",
] as const
type Tab = typeof tabs[number]
const show = (value: unknown) =>
  typeof value === "number"
    ? value.toLocaleString("en-US", { maximumFractionDigits: 4 })
    : typeof value === "string" && value
      ? value
      : "—"
const message = (error: unknown) =>
  error instanceof Error ? error.message : "Request failed."
function Table({ rows, columns }: {
  rows: Row[]
  columns: [string, string][]
}) {
  return (
    <div className="api-table">
      <table>
        <thead>
          <tr>
            {columns.map(([key, label]) => (
              <th key={key}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(([key]) => (
                <td key={key}>{show(row[key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p>No records in this snapshot.</p>}
    </div>
  )
}

export default function ApiApplication() {
  const [accounts, setAccounts] = useState<AccountSummary[]>([])
  const [accountId, setAccountId] = useState("")
  const [date, setDate] = useState("")
  const [asset, setAsset] = useState<Asset | null>(null)
  const [tab, setTab] = useState<Tab>("Overview")
  const [loading, setLoading] = useState(true)
  const [bookLoading, setBookLoading] = useState(false)
  const [error, setError] = useState("")
  const [bookError, setBookError] = useState("")
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const [notice, setNotice] = useState("")
  const [uncertain, setUncertain] = useState(false)
  const [newId, setNewId] = useState("")
  const [name, setName] = useState("")
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [kind, setKind] = useState<"cash" | "trade" | "stock">("cash")
  const [payload, setPayload] = useState("")
  const [postConfirmed, setPostConfirmed] = useState(false)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("ace-backoffice-theme") || "dark"
    } catch {
      return "dark"
    }
  })
  useEffect(() => {
    document.title = "Regulus — Dev Back Office"
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem("ace-backoffice-theme", theme)
    } catch {
      /* Theme persistence is optional. */
    }
  }, [theme])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError("")
    client
      .accounts(controller.signal)
      .then((rows) => {
        if (controller.signal.aborted) return
        setAccounts(rows)
        setAccountId((old) =>
          rows.some((a) => a.accountId === old)
            ? old
            : rows[0]?.accountId || "",
        )
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setAccounts([])
          setAccountId("")
          setError(message(e))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [revision])
  useEffect(() => {
    const controller = new AbortController()
    setAsset(null)
    setBookError("")
    setBookLoading(!!accountId)
    if (accountId)
      client
        .asset(accountId, date, controller.signal)
        .then((book) => {
          if (!controller.signal.aborted) setAsset(book)
        })
        .catch((e) => {
          if (!controller.signal.aborted) setBookError(message(e))
        })
        .finally(() => {
          if (!controller.signal.aborted) setBookLoading(false)
        })
    return () => controller.abort()
  }, [accountId, date, revision])
  useEffect(() => {
    setDeleteConfirmed(false)
    setPostConfirmed(false)
    setName("")
    setPayload("")
  }, [accountId])
  async function mutate(operation: () => Promise<unknown>, success: string) {
    if (lock.current || uncertain) return
    lock.current = true
    setBusy(true)
    setNotice("")
    try {
      await operation()
      setNotice(success)
      setRevision((r) => r + 1)
      setDeleteConfirmed(false)
      setPostConfirmed(false)
    } catch (e) {
      setNotice(message(e))
      if (e instanceof ApiError && e.uncertain) {
        setUncertain(true)
        setRevision((r) => r + 1)
      }
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  function post(e: FormEvent) {
    e.preventDefault()
    void mutate(async () => {
      const result = await client.post(kind, accountId, JSON.parse(payload))
      setDate(result.processDate)
      setPayload("")
    }, "Posting saved. Account book refreshed.")
  }
  const account = accounts.find((a) => a.accountId === accountId)
  const activity: Row[] = asset
    ? [
        ...asset.cashes.map((row) => ({ ...row, type: "Cash" })),
        ...asset.trades.map((row) => ({ ...row, type: "Trade" })),
        ...asset.stocks.map((row) => ({ ...row, type: "Stock" })),
      ]
    : []
  const metrics: [string, unknown][] = asset
    ? [
        ["Cash balance", asset.actsum.cashBal],
        ["Margin balance", asset.actsum.marginBal],
        ["Total equity", asset.actsum.totalEquity],
        ["Overnight buying power", asset.margin.ovBP],
      ]
    : []
  return (
    <div className="api-shell">
      <aside className="api-sidebar">
        <h2>REGULUS</h2>
        <p>Back Office</p>
        <span className="badge badge-amber">DEV API · FIRM {firmId}</span>
        <nav aria-label="Main navigation">
          {tabs.map((item) => (
            <button
              key={item}
              aria-current={tab === item ? "page" : undefined}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <p className="api-muted">
          Connected dev workspace
          <br />
          No sign-in required
        </p>
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          Switch to {theme === "dark" ? "light" : "dark"} theme
        </button>
      </aside>
      <main className="api-main">
        <header>
          <div>
            <h1>{tab}</h1>
            <p className="api-muted">Regulus account data · Firm {firmId}</p>
          </div>
          <button
            disabled={loading || busy}
            onClick={() => setRevision((r) => r + 1)}
          >
            Refresh
          </button>
        </header>
        <div className="api-filters">
          <label>
            Account
            <select
              disabled={loading || busy}
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              {!accounts.length && <option value="">No accounts</option>}
              {accounts.map((a) => (
                <option key={a.accountId} value={a.accountId}>
                  {a.accountId} — {a.accountName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Book date
            <input
              type="date"
              disabled={busy}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <button disabled={busy || !date} onClick={() => setDate("")}>
            Latest book
          </button>
        </div>
        {loading && <p role="status">Loading accounts…</p>}
        {error && (
          <div role="alert" className="api-alert">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="api-alert">
            {notice}
          </div>
        )}
        {uncertain && (
          <div role="alert" className="api-alert">
            Write outcome is uncertain. Check refreshed data and reconcile the
            request before another write.
            <button
              onClick={() => {
                setUncertain(false)
                setNotice("")
              }}
            >
              I have reconciled the request
            </button>
          </div>
        )}
        {!loading && !error && !accounts.length && (
          <p>No accounts exist for this firm. Create an account in Accounts.</p>
        )}
        {tab !== "Accounts" && (
          <>
            {bookLoading && <p role="status">Loading account book…</p>}
            {bookError && (
              <div role="alert" className="api-alert">
                {bookError}
              </div>
            )}
            {!bookLoading && !bookError && accountId && !asset && (
              <div className="api-panel">
                <h2>No account book</h2>
                <p>
                  No book is available for {accountId}
                  {date ? ` on ${date}` : ""}. Account master records and
                  financial books are stored separately.
                </p>
              </div>
            )}
            {asset && !bookLoading && (
              <>
                <p className="api-muted">
                  {account?.accountName} · As of {asset.processDate} · Values
                  reported by the accounting engine
                </p>
                {(tab === "Overview" || tab === "Balances") && (
                  <div className="api-metrics">
                    {metrics.map(([label, value]) => (
                      <div className="api-panel" key={label}>
                        <span>{label}</span>
                        <strong>{show(value)}</strong>
                      </div>
                    ))}
                  </div>
                )}
                {tab === "Overview" && (
                  <div className="api-panel">
                    <h2>Account snapshot</h2>
                    <p>
                      {asset.positions.length} position rows · {activity.length}{" "}
                      activity records
                    </p>
                    <p>
                      Branch: {show(asset.account.branch)} · Rep:{" "}
                      {show(asset.account.rep)}
                    </p>
                    <p className="api-muted">
                      Day P&amp;L and market quotes are not supplied by this
                      API. This snapshot is not a complete transaction history.
                    </p>
                  </div>
                )}
                {tab === "Balances" && (
                  <Table
                    rows={asset.balances}
                    columns={[
                      ["accountType", "Account type"],
                      ["balance", "Balance"],
                      ["balanceSD", "Settled balance"],
                      ["longMV", "Long market value"],
                      ["shortMV", "Short market value"],
                      ["sma", "SMA"],
                    ]}
                  />
                )}
                {tab === "Positions" && (
                  <Table
                    rows={asset.positions}
                    columns={[
                      ["secId", "Security"],
                      ["secType", "Type"],
                      ["accountType", "Account type"],
                      ["tdQty", "Trade-date qty"],
                      ["sdQty", "Settled qty"],
                      ["unitCost", "Unit cost"],
                      ["marketPrice", "Market price"],
                      ["marketValue", "Market value"],
                      ["unRealized", "Unrealized P&L"],
                    ]}
                  />
                )}
                {tab === "Transactions" && (
                  <Table
                    rows={activity}
                    columns={[
                      ["type", "Type"],
                      ["controlId", "Reference"],
                      ["secId", "Security"],
                      ["qty", "Quantity"],
                      ["price", "Price"],
                      ["amount", "Amount"],
                      ["tradeDate", "Trade date"],
                      ["settleDate", "Settle date"],
                      ["desc1", "Description"],
                    ]}
                  />
                )}
              </>
            )}
          </>
        )}
        {tab === "Accounts" && (
          <>
            <Table
              rows={accounts as unknown as Row[]}
              columns={[
                ["accountId", "Account ID"],
                ["accountName", "Account name"],
              ]}
            />
            <div className="api-panel">
              <h2>Account master</h2>
              <p>
                Only account ID and name are available in the list API. Other
                account fields are preserved.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void mutate(
                    () => client.createAccount(newId.trim(), name.trim()),
                    "Account created.",
                  )
                }}
              >
                <fieldset disabled={busy || uncertain}>
                  <label>
                    New account ID
                    <input
                      required
                      value={newId}
                      onChange={(e) => setNewId(e.target.value)}
                    />
                  </label>
                  <label>
                    Account name
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                  <div className="api-actions">
                    <button
                      type="submit"
                      disabled={!newId.trim() || !name.trim()}
                    >
                      Create account
                    </button>
                    <button
                      type="button"
                      disabled={!accountId || !name.trim()}
                      onClick={() =>
                        void mutate(
                          () => client.renameAccount(accountId, name.trim()),
                          "Account name updated.",
                        )
                      }
                    >
                      Rename selected account
                    </button>
                  </div>
                </fieldset>
              </form>
              <fieldset disabled={busy || uncertain || !accountId}>
                <label className="api-check">
                  <input
                    type="checkbox"
                    checked={deleteConfirmed}
                    onChange={(e) => setDeleteConfirmed(e.target.checked)}
                  />
                  Delete account master {accountId}; this does not delete its
                  financial books
                </label>
                <button
                  disabled={!deleteConfirmed}
                  onClick={() =>
                    void mutate(
                      () => client.deleteAccount(accountId),
                      "Account master deleted.",
                    )
                  }
                >
                  Delete selected account
                </button>
              </fieldset>
            </div>
          </>
        )}
        {tab === "Transactions" && accountId && (
          <details className="api-panel">
            <summary>Submit a dev financial posting</summary>
            <p>
              Submit an approved Regulus vendor JSON payload. This posts to the
              dev accounting engine. Existing transaction edits, cancellations
              and rebills are not supported here.
            </p>
            <form onSubmit={post}>
              <fieldset disabled={busy || uncertain}>
                <label>
                  Posting type
                  <select
                    value={kind}
                    onChange={(e) => {
                      setKind(e.target.value as typeof kind)
                      setPostConfirmed(false)
                    }}
                  >
                    <option value="cash">Cash</option>
                    <option value="trade">Trade</option>
                    <option value="stock">Stock</option>
                  </select>
                </label>
                <label>
                  Vendor request JSON
                  <textarea
                    required
                    rows={12}
                    spellCheck={false}
                    value={payload}
                    onChange={(e) => {
                      setPayload(e.target.value)
                      setPostConfirmed(false)
                    }}
                    placeholder={`{"account":{"firmId":${firmId},"accountId":"${accountId}"},"processDate":"YYYY-MM-DD", ...}`}
                  />
                </label>
                <p className="api-muted">
                  Use the backend request examples with approved amounts, signs
                  and business codes. Requests are never automatically retried.
                </p>
                <label className="api-check">
                  <input
                    type="checkbox"
                    checked={postConfirmed}
                    onChange={(e) => setPostConfirmed(e.target.checked)}
                  />
                  I reviewed this posting for account {accountId}
                </label>
                <button disabled={!postConfirmed || !payload.trim()}>
                  {busy ? "Submitting…" : "Submit posting"}
                </button>
              </fieldset>
            </form>
          </details>
        )}
        <footer className="api-muted">
          Dev API access has no user-role restrictions. User approvals,
          branch/rep management and firm settings require backend endpoints.
        </footer>
      </main>
    </div>
  )
}
