import { validateLogo } from "./branding.ts";
import type { DemoData } from "../types.ts"

// Validate imported/local data before replacing the working demo. No executable code is imported.
export function validateSnapshot(value: unknown): DemoData {
  const fail = () => {
    throw new Error(
      "Invalid demo snapshot. Export a version 1 snapshot from this app.",
    )
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail()
  const data = value as Record<string, unknown>
  if (data.version !== 1) return fail()
  const schemas = {
    accounts: [
      "id firmId branchId branchName repId repName ownerName email phone type status openedAt",
      "cashBalance portfolioValue totalValue dayPnl dayPnlPct",
    ],
    branches: [
      "id firmId name city address phone managerName managerId status createdAt",
      "accountCount",
    ],
    reps: [
      "id firmId branchId branchName name email phone status",
      "accountCount",
    ],
    appUsers: [
      "id name email phone level role firmId status createdAt password",
      "",
    ],
    registrations: [
      "id name email phone desiredLevel password message submittedAt status",
      "",
    ],
    positions: [
      "id accountId accountName branchId firmId symbol description assetClass lastUpdated",
      "quantity avgCost currentPrice marketValue unrealizedPnl unrealizedPnlPct dayChange dayChangePct",
    ],
    transactions: [
      "id type action description status accountId accountName branchId firmId tradeDate settleDate csrId csrName",
      "amount",
    ],
  }
  for (const [key, [strings, numbers]] of Object.entries(schemas)) {
    const rows = data[key]
    if (!Array.isArray(rows) || rows.length > 10000) return fail()
    const ids = new Set()
    for (const row of rows) {
      if (
        !row ||
        typeof row !== "object" ||
        strings.split(" ").some((k) => typeof row[k] !== "string") ||
        numbers
          .split(" ")
          .filter(Boolean)
          .some(
            (k) => typeof row[k] !== "number" || !Number.isFinite(row[k]),
          ) ||
        !row.id ||
        ids.has(row.id)
      )
        return fail()
      ids.add(row.id)
      for (const k of [
        "branchId",
        "repId",
        "accountId",
        "symbol",
        "notes",
        "approvedBy",
      ])
        if (row[k] !== undefined && typeof row[k] !== "string") return fail()
      for (const k of ["quantity", "price"])
        if (
          row[k] !== undefined &&
          (typeof row[k] !== "number" || !Number.isFinite(row[k]))
        )
          return fail()
      if (
        row.assignedAccountIds !== undefined &&
        (!Array.isArray(row.assignedAccountIds) ||
          row.assignedAccountIds.some((id: unknown) => typeof id !== "string"))
      )
        return fail()
    }
  }
  const firm = data.firmInfo as Record<string, unknown>
  if (
    !firm ||
    "id name legalName address city state zip country phone email website foundedYear aum crd ein licenseType regulatoryBody status"
      .split(" ")
      .some((k) => typeof firm[k] !== "string")
  )
    return fail()
  validateLogo(firm.logoDataUrl)
  const d = data as unknown as DemoData
  const levels = ["firm", "branch", "csr", "account"]
  if (
    d.appUsers.some(
      (u) =>
        !levels.includes(u.level) ||
        !["active", "pending", "suspended"].includes(u.status),
    ) ||
    !d.appUsers.some((u) => u.level === "firm" && u.status === "active")
  )
    return fail()
  if (
    new Set(d.appUsers.map((u) => u.email.trim().toLowerCase())).size !==
    d.appUsers.length
  )
    return fail()
  if (
    d.registrations.some(
      (r) =>
        !levels.includes(r.desiredLevel) ||
        !["pending", "approved", "rejected"].includes(r.status),
    )
  )
    return fail()
  if (
    d.accounts.some(
      (a) =>
        !d.branches.some((b) => b.id === a.branchId) ||
        (a.repId && !d.reps.some((r) => r.id === a.repId)),
    )
  )
    return fail()
  if (d.reps.some((r) => !d.branches.some((b) => b.id === r.branchId)))
    return fail()
  if (
    d.transactions.some(
      (t) =>
        !d.accounts.some((a) => a.id === t.accountId) ||
        !["trade", "cash", "stock"].includes(t.type) ||
        ![
          "buy",
          "sell",
          "deposit",
          "withdrawal",
          "transfer",
          "dividend",
        ].includes(t.action) ||
        !["settled", "pending", "cancelled", "failed", "rebilled"].includes(
          t.status,
        ),
    )
  )
    return fail()
  if (d.positions.some((p) => !d.accounts.some((a) => a.id === p.accountId)))
    return fail()
  return structuredClone(d)
}
