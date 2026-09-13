import { test } from "node:test"
import assert from "node:assert/strict"
import type { DemoData, Transaction, User } from "../src/types.ts"
import {
  MOCK_ACCOUNTS,
  MOCK_BRANCHES,
  MOCK_POSITIONS,
  MOCK_REPS,
  MOCK_TRANSACTIONS,
  MOCK_USERS,
} from "../src/data/mockData.ts"
import {
  accountScope,
  buildBalances,
  saveTransaction,
  validateUser,
} from "../src/data/demoModel.ts"
import { validateSnapshot } from "../src/data/snapshot.ts"

const firm = MOCK_USERS["admin@acefirm.com"].user
const branch = MOCK_USERS["bmgr@acefirm.com"].user
function seed(): DemoData {
  return structuredClone({
    version: 1,
    accounts: MOCK_ACCOUNTS,
    branches: MOCK_BRANCHES,
    positions: MOCK_POSITIONS,
    reps: MOCK_REPS,
    transactions: MOCK_TRANSACTIONS,
    appUsers: Object.values(MOCK_USERS).map(({ user, password }) => ({
      ...user,
      password,
      repId: user.csrId,
    })),
    registrations: [],
    firmInfo: {
      id: firm.firmId,
      name: firm.firmName,
      legalName: "Demo",
      address: "Demo",
      city: "Demo",
      state: "Demo",
      zip: "Demo",
      country: "Demo",
      phone: "Demo",
      email: "demo@example.com",
      website: "",
      foundedYear: "2020",
      aum: "Demo",
      crd: "Demo",
      ein: "Demo",
      licenseType: "Demo",
      regulatoryBody: "Demo",
      status: "active",
    },
  })
}
function trade(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "NEW-TRADE",
    type: "trade",
    action: "buy",
    symbol: "TEST",
    description: "Demo trade",
    quantity: 10,
    price: 20,
    amount: 200,
    status: "settled",
    accountId: "ACC-78341",
    accountName: "",
    branchId: "",
    firmId: firm.firmId,
    tradeDate: "2026-09-12",
    settleDate: "2026-09-14",
    csrId: "",
    csrName: "",
    ...overrides,
  }
}
test("settled create, edit, repeated save, cancel and resettle reconcile cash and positions", () => {
  const before = seed()
  const base = before.accounts[0]
  let d = saveTransaction(before, firm, trade())
  assert.equal(d.accounts[0].cashBalance, base.cashBalance - 200)
  assert.equal(d.accounts[0].portfolioValue, base.portfolioValue + 200)
  assert.equal(d.positions.find((p) => p.symbol === "TEST")?.quantity, 10)
  d = saveTransaction(d, firm, trade({ quantity: 20 }))
  assert.equal(d.accounts[0].cashBalance, base.cashBalance - 400)
  assert.equal(d.transactions[0].amount, 400)
  const saved = structuredClone(d)
  d = saveTransaction(d, firm, d.transactions[0])
  assert.deepEqual(d, saved)
  d = saveTransaction(d, firm, { ...d.transactions[0], status: "cancelled" })
  assert.equal(d.accounts[0].cashBalance, base.cashBalance)
  assert.equal(d.accounts[0].portfolioValue, base.portfolioValue)
  assert.equal(d.positions.filter((p) => p.symbol === "TEST").length, 0)
  d = saveTransaction(d, firm, { ...d.transactions[0], status: "settled" })
  assert.equal(d.accounts[0].cashBalance, base.cashBalance - 400)
  assert.deepEqual(before, seed(), "input must remain unchanged")
})
test("pending trade, cash edits and moved account apply only net effects", () => {
  const before = seed()
  let d = saveTransaction(before, branch, trade({ status: "pending" }))
  assert.deepEqual(d.accounts, before.accounts)
  d = saveTransaction(d, firm, trade({ accountId: "ACC-78350" }))
  assert.equal(d.accounts[0].cashBalance, before.accounts[0].cashBalance)
  assert.equal(d.accounts[4].cashBalance, before.accounts[4].cashBalance - 200)
  d = saveTransaction(
    d,
    firm,
    trade({ type: "cash", action: "deposit", amount: 1000 }),
  )
  assert.equal(d.accounts[4].cashBalance, before.accounts[4].cashBalance)
  assert.equal(d.accounts[0].cashBalance, before.accounts[0].cashBalance + 1000)
  assert.equal(
    buildBalances(d.accounts)[0].totalEquity,
    d.accounts[0].totalValue,
  )
})
test("seed transaction unchanged does not replay historical balance effects", () => {
  const d = seed()
  assert.deepEqual(saveTransaction(d, firm, d.transactions[0]), d)
})
test("reject out-of-scope writes, invalid numbers, invalid dates and overselling", () => {
  const d = seed()
  assert.throws(
    () => saveTransaction(d, branch, trade({ accountId: "ACC-78350" })),
    /scope/,
  )
  assert.throws(
    () => saveTransaction(d, MOCK_USERS["client@acefirm.com"].user, trade()),
    /Only firm/,
  )
  assert.throws(
    () => saveTransaction(d, firm, trade({ quantity: NaN })),
    /positive/,
  )
  assert.throws(
    () => saveTransaction(d, firm, trade({ settleDate: "2020-01-01" })),
    /date/,
  )
  assert.throws(
    () => saveTransaction(d, firm, trade({ action: "sell" })),
    /Insufficient/,
  )
})
test("rep visibility follows current account assignments across branches", () => {
  const d = seed()
  const rep = MOCK_USERS["csr@acefirm.com"].user
  d.accounts[4].repId = "REP-001"
  d.accounts[0].repId = "REP-003"
  const visible = accountScope(d, rep).map((a) => a.id)
  assert.ok(visible.includes("ACC-78350"))
  assert.ok(!visible.includes("ACC-78341"))
  assert.equal(accountScope(d, { ...rep, csrId: undefined }).length, 0)
  assert.equal(accountScope(d, { ...rep, status: "suspended" }).length, 0)
  assert.equal(accountScope(d, { ...firm, firmId: "another-firm" }).length, 0)
})
test("user validation blocks duplicate emails, missing scope and removing the last firm admin", () => {
  const d = seed()
  const u = { ...d.appUsers[0], id: "NEW" }
  assert.throws(() => validateUser(d, u), /email/)
  assert.throws(
    () => validateUser(d, { ...u, email: "new@example.com", level: "account" }),
    /account/,
  )
  assert.throws(
    () => validateUser(d, { ...d.appUsers[0], status: "suspended" }),
    /administrator/,
  )
})
test("snapshot round trip and malformed data rejection", () => {
  const d = seed()
  assert.deepEqual(
    validateSnapshot(JSON.parse(JSON.stringify(d))),
    JSON.parse(JSON.stringify(d)),
  )
  assert.throws(() => validateSnapshot({ ...d, version: 99 }), /Invalid/)
  assert.throws(
    () => validateSnapshot({ ...d, accounts: [{ id: "bad" }] }),
    /Invalid/,
  )
  assert.throws(() => validateSnapshot({ ...d, appUsers: [] }), /Invalid/)
  assert.throws(
    () =>
      validateSnapshot({
        ...d,
        reps: d.reps.map((r) => ({ ...r, assignedAccountIds: 42 })),
      }),
    /Invalid/,
  )
})
