import type {
  AccountRecord,
  AppUserRecord,
  Balance,
  DemoData,
  Transaction,
  User,
} from "../types.ts"

export const roleTitle = (level: string) =>
  ({
    firm: "Firm Administrator",
    branch: "Branch Manager",
    csr: "Client Services Rep",
    account: "Account Holder",
  })[level] ?? "User"
export const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
export const emailKey = (email: string) => email.trim().toLowerCase()
export function accountScope(data: DemoData, user: User): AccountRecord[] {
  if (user.status !== "active") return []
  return data.accounts.filter(
    (a) =>
      a.firmId === user.firmId &&
      (user.level === "firm" ||
        (user.level === "branch" &&
          !!user.branchId &&
          a.branchId === user.branchId) ||
        (user.level === "csr" &&
          !!user.csrId &&
          a.repId === user.csrId &&
          data.reps.some(
            (r) => r.id === user.csrId && r.status === "active",
          )) ||
        (user.level === "account" &&
          !!user.accountId &&
          a.id === user.accountId)),
  )
}
export function loginUser(data: DemoData, record: AppUserRecord): User {
  const account = data.accounts.find((a) => a.id === record.accountId)
  const rep = data.reps.find((r) => r.id === record.repId)
  const branchId =
    record.level === "account"
      ? account?.branchId
      : record.level === "csr"
        ? rep?.branchId
        : record.branchId
  return {
    ...record,
    firmName: data.firmInfo.name,
    branchId,
    branchName: data.branches.find((b) => b.id === branchId)?.name,
    csrId: record.repId,
    csrName: rep?.name,
    accountName: account?.ownerName,
    lastLogin: "Demo session",
  }
}
export function validateUser(data: DemoData, user: AppUserRecord) {
  if (!user.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email))
    throw new Error("Enter a name and valid email.")
  if (
    data.appUsers.some(
      (u) => u.id !== user.id && emailKey(u.email) === emailKey(user.email),
    )
  )
    throw new Error("That email already has a user.")
  if (!user.password || user.password.length < 6)
    throw new Error("Use a demo password of at least 6 characters.")
  if (
    user.level === "branch" &&
    !data.branches.some((b) => b.id === user.branchId && b.status === "active")
  )
    throw new Error("Select an active branch.")
  if (
    user.level === "csr" &&
    !data.reps.some((r) => r.id === user.repId && r.status === "active")
  )
    throw new Error("Select an active rep.")
  if (
    user.level === "account" &&
    !data.accounts.some((a) => a.id === user.accountId && a.status === "active")
  )
    throw new Error("Select an active account.")
  const old = data.appUsers.find((u) => u.id === user.id)
  if (
    old?.level === "firm" &&
    old.status === "active" &&
    (user.level !== "firm" || user.status !== "active") &&
    !data.appUsers.some(
      (u) => u.id !== user.id && u.level === "firm" && u.status === "active",
    )
  )
    throw new Error("Keep at least one active firm administrator.")
}
export function buildBalances(accounts: AccountRecord[]): Balance[] {
  return accounts.map((a) => ({
    accountId: a.id,
    accountName: a.ownerName,
    branchId: a.branchId,
    branchName: a.branchName,
    firmId: a.firmId,
    cashBalance: a.cashBalance,
    portfolioValue: a.portfolioValue,
    totalEquity: a.totalValue,
    marginBalance: money(a.cashBalance * 0.5),
    buyingPower: money(Math.max(0, a.cashBalance * 2)),
    marginUsed: money(a.portfolioValue * 0.15),
    marginAvailable: money(a.portfolioValue * 0.35),
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    dayPnl: a.dayPnl,
    dayPnlPct: a.dayPnlPct,
    asOf: "Demo calculation",
  }))
}

// Seed balances already include historical trades. Apply ONLY the net change from an edit.
// Pending, failed, cancelled and rebilled rows have no financial effect until settled.
function effect(t?: Transaction) {
  const settled = t?.status === "settled"
  const shares =
    settled && t?.type === "trade"
      ? (t.action === "buy" ? 1 : -1) * (t.quantity ?? 0)
      : 0
  const cash =
    !settled || !t
      ? 0
      : (["buy", "withdrawal"].includes(t.action) ? -1 : 1) * t.amount
  return {
    shares,
    cash: t?.type === "stock" ? 0 : cash,
    cost: shares * (t?.price ?? 0),
  }
}
export function saveTransaction(
  data: DemoData,
  user: User,
  input: Transaction,
): DemoData {
  if (user.status !== "active" || !["firm", "branch"].includes(user.level))
    throw new Error("Only firm and branch users can edit transactions.")
  const allowed = accountScope(data, user)
  const account = allowed.find((a) => a.id === input.accountId)
  const old = data.transactions.find((t) => t.id === input.id)
  if (!account || (old && !allowed.some((a) => a.id === old.accountId)))
    throw new Error("Account is outside your access scope.")
  if (old && old.type === "stock")
    throw new Error("Historical stock transfers are view only in this demo.")
  if (input.type === "trade" && !["buy", "sell"].includes(input.action))
    throw new Error("Choose buy or sell for a trade.")
  if (
    input.type === "cash" &&
    !["deposit", "withdrawal", "dividend"].includes(input.action)
  )
    throw new Error("Choose deposit, withdrawal or dividend.")
  if (!["trade", "cash"].includes(input.type))
    throw new Error("Create a trade or cash transaction.")
  if (
    !["pending", "settled", "cancelled", "rebilled", "failed"].includes(
      input.status,
    )
  )
    throw new Error("Invalid transaction status.")
  if (
    input.type === "trade" &&
    (!input.symbol?.trim() ||
      !Number.isFinite(input.quantity) ||
      input.quantity! <= 0 ||
      !Number.isFinite(input.price) ||
      input.price! <= 0)
  )
    throw new Error("Enter a symbol, positive quantity and positive price.")
  const amount = money(
    input.type === "trade" ? input.quantity! * input.price! : input.amount,
  )
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error("Amount must be greater than zero.")
  const validDate = (s: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    Number.isFinite(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s
  if (
    !validDate(input.tradeDate) ||
    !validDate(input.settleDate) ||
    input.settleDate < input.tradeDate
  )
    throw new Error("Settlement date must be on or after the trade date.")
  const tx = {
    ...input,
    amount,
    symbol: input.symbol?.trim().toUpperCase(),
    accountName: account.ownerName,
    branchId: account.branchId,
    firmId: account.firmId,
    csrId: account.repId,
    csrName: account.repName,
  }
  const next = structuredClone(data)
  const changes = new Map<string, {
    accountId: string
    symbol: string
    shares: number
    cost: number
    price: number
  }>()
  for (const [t, sign] of [
    [old, -1],
    [tx, 1],
  ] as const) {
    if (!t) continue
    const e = effect(t)
    const a = next.accounts.find((a) => a.id === t.accountId)!
    a.cashBalance = money(a.cashBalance + sign * e.cash)
    if (t.type !== "trade") continue
    const key = `${t.accountId}:${t.symbol}`
    const delta = changes.get(key) ?? {
      accountId: t.accountId,
      symbol: t.symbol!,
      shares: 0,
      cost: 0,
      price: t.price!,
    }
    delta.shares += sign * e.shares
    delta.cost += sign * e.cost
    delta.price = t.price!
    changes.set(key, delta)
  }
  for (const change of changes.values()) {
    if (!change.shares && !change.cost) continue
    const a = next.accounts.find((a) => a.id === change.accountId)!
    let p = next.positions.find(
      (p) => p.accountId === a.id && p.symbol === change.symbol,
    )
    if (!p) {
      p = {
        id: `POS-${tx.id}-${a.id}-${change.symbol}`,
        accountId: a.id,
        accountName: a.ownerName,
        branchId: a.branchId,
        firmId: a.firmId,
        symbol: change.symbol,
        description: change.symbol,
        assetClass: "equity",
        quantity: 0,
        avgCost: 0,
        currentPrice: change.price,
        marketValue: 0,
        unrealizedPnl: 0,
        unrealizedPnlPct: 0,
        dayChange: 0,
        dayChangePct: 0,
        lastUpdated: "",
      }
      next.positions.push(p)
    }
    const quantity = money(p.quantity + change.shares)
    if (quantity < 0)
      throw new Error(
        `Insufficient ${p.symbol} shares. This demo does not support short positions.`,
      )
    const oldValue = p.marketValue
    // Simplified book cost; seed lots are illustrative, not a reconciled ledger.
    const cost = Math.max(0, p.quantity * p.avgCost + change.cost)
    p.quantity = quantity
    p.avgCost = quantity ? money(cost / quantity) : 0
    p.marketValue = money(quantity * p.currentPrice)
    p.unrealizedPnl = money(p.marketValue - quantity * p.avgCost)
    p.unrealizedPnlPct = cost ? money((p.unrealizedPnl / cost) * 100) : 0
    p.lastUpdated = "Demo calculation"
    a.portfolioValue = money(a.portfolioValue + p.marketValue - oldValue)
  }
  next.positions = next.positions.filter((p) => p.quantity !== 0)
  next.accounts.forEach((a) => {
    a.totalValue = money(a.cashBalance + a.portfolioValue)
  })
  next.transactions = old
    ? next.transactions.map((t) => (t.id === tx.id ? tx : t))
    : [tx, ...next.transactions]
  return next
}
