import { test } from "node:test"
import assert from "node:assert/strict"
import {
  ApiError,
  createRegulusClient,
  parseAccounts,
  parseAsset,
  validatePosting,
} from "../src/api/regulus.ts"
const book = {
  account: { firmId: 1, accountId: "001" },
  processDate: "2026-10-08",
  balances: [],
  positions: [],
  cashes: [],
  trades: [],
  stocks: [],
  actsum: {},
  margin: {},
}
test("accounts retain leading zeroes and invalid lists fail closed", () => {
  assert.equal(
    parseAccounts([{ accountId: "001", accountName: "Test" }])[0].accountId,
    "001",
  )
  assert.throws(() => parseAccounts([{ accountId: 1 }]), /invalid account list/)
})
test("book identity mismatch is rejected; legacy missing-book sentinel is empty", () => {
  assert.equal(parseAsset(book, 1, "001")?.processDate, "2026-10-08")
  assert.throws(() => parseAsset(book, 2, "001"), /different account/)
  assert.equal(
    parseAsset({ ...book, account: { firmId: 0, accountId: "" } }, 1, "001"),
    null,
  )
  assert.throws(
    () => parseAsset({ ...book, positions: [null] }, 1, "001"),
    /incomplete/,
  )
})
test("postings require matching identity and a valid business date", () => {
  assert.doesNotThrow(() => validatePosting(book, 1, "001"))
  assert.throws(() => validatePosting(book, 1, "002"), /match/)
  assert.throws(
    () => validatePosting({ ...book, processDate: "2026-02-30" }, 1, "001"),
    /valid processDate/,
  )
})
test("client encodes query identity, parses errors, and never retries uncertain writes", async () => {
  const original = globalThis.fetch
  const calls: string[] = []
  globalThis.fetch = async (url) => {
    calls.push(String(url))
    return new Response(JSON.stringify({ error: "Conflict" }), { status: 409 })
  }
  const client = createRegulusClient("/api/", 1)
  try {
    await assert.rejects(
      () => client.renameAccount("A&B", "Name"),
      (e: unknown) => e instanceof ApiError && e.status === 409 && !e.uncertain,
    )
    assert.equal(calls[0], "/api/account/edit?firmId=1&accountId=A%26B")
    let count = 0
    globalThis.fetch = async () => {
      count++
      throw new TypeError("network failed")
    }
    await assert.rejects(
      () => client.post("cash", "001", book),
      (e: unknown) => e instanceof ApiError && e.uncertain,
    )
    assert.equal(count, 1)
    globalThis.fetch = async () =>
      new Response("<html>Bad gateway</html>", { status: 502 })
    await assert.rejects(() => client.accounts(), /non-JSON/)
    globalThis.fetch = async () => new Response("{}", { status: 404 })
    assert.equal(await client.asset("001"), null)
  } finally {
    globalThis.fetch = original
  }
})
