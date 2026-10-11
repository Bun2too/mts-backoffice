import { test, expect } from "@playwright/test"
const account = { accountId: "001", accountName: "API Account" }
const book = {
  account: { firmId: 1, accountId: "001", branch: "B1", rep: "R1" },
  processDate: "2026-10-08",
  actsum: { cashBal: 150, marginBal: 0, totalEquity: 550 },
  margin: { ovBP: 300 },
  balances: [{ accountType: 1, balance: 150 }],
  positions: [{ secId: "NVDA", tdQty: 2, marketValue: 400 }],
  cashes: [{ controlId: "C1", amount: 150, desc1: "API deposit" }],
  trades: [],
  stocks: [],
}
test("API reads, date queries, account writes, postings and persistence use the server", async ({
  page,
}) => {
  const rows = [account]
  const writes: {
    method: string
    body: unknown
  }[] = []
  await page.route("**/api/**", async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    expect(url.pathname).not.toContain("/api/api/")
    if (req.method() !== "GET") {
      const body = req.postDataJSON()
      writes.push({ method: req.method(), body })
      if (url.pathname === "/api/account/edit") {
        rows.push({ accountId: body.accountId, accountName: body.accountName })
        return route.fulfill({ json: body, status: 201 })
      }
      return route.fulfill({ json: book })
    }
    expect(url.searchParams.get("firmId")).toBe("1")
    return route.fulfill({
      json: url.pathname === "/api/accounts" ? rows : book,
    })
  })
  await page.goto("/")
  await expect(page.getByText("API Account · As of")).toBeVisible()
  await expect(page.getByText("550", { exact: true })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Users & Approvals" }),
  ).toHaveCount(0)
  await page.getByRole("button", { name: "Positions", exact: true }).click()
  await expect(page.getByRole("cell", { name: "NVDA" })).toBeVisible()
  const dated = page.waitForRequest((req) =>
    req.url().includes("processDate=2026-10-07"),
  )
  await page.getByLabel("Book date").fill("2026-10-07")
  await dated
  await page.getByRole("button", { name: "Accounts", exact: true }).click()
  await page.getByLabel("New account ID").fill("002")
  await page.getByLabel("Account name", { exact: true }).fill("Created via API")
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click()
  await expect(
    page.getByRole("cell", { name: "Created via API" }),
  ).toBeVisible()
  expect(writes[0]).toEqual({
    method: "POST",
    body: { firmId: 1, accountId: "002", accountName: "Created via API" },
  })
  await page.getByRole("button", { name: "Transactions", exact: true }).click()
  await page
    .getByText("Submit a dev financial posting", { exact: true })
    .click()
  await page
    .getByLabel("Vendor request JSON")
    .fill(
      JSON.stringify({
        account: book.account,
        processDate: "2026-10-08",
        amount: 100,
      }),
    )
  await page.getByLabel("I reviewed this posting").check()
  await page
    .getByRole("button", { name: "Submit posting", exact: true })
    .click()
  await expect(page.getByRole("status")).toContainText("Posting saved")
  expect(writes).toHaveLength(2)
  await page.reload()
  await expect(
    page.getByRole("combobox", { name: "Account", exact: true }),
  ).toContainText("002 — Created via API")
  expect(
    await page.evaluate(() => localStorage.getItem("ace-backoffice-demo-v1")),
  ).toBeNull()
})
test("legacy missing books and HTTP errors never fall back to demo values", async ({
  page,
}) => {
  await page.route("**/api/accounts?*", (route) =>
    route.fulfill({ json: [account] }),
  )
  await page.route("**/api/asset?*", (route) =>
    route.fulfill({
      json: {
        ...book,
        account: { firmId: 0, accountId: "" },
        balances: [],
        positions: [],
        cashes: [],
      },
    }),
  )
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "No account book" }),
  ).toBeVisible()
  await page.route("**/api/asset?*", (route) =>
    route.fulfill({ status: 401, json: { error: "Authentication required" } }),
  )
  await page.getByRole("button", { name: "Refresh", exact: true }).click()
  await expect(page.getByRole("alert")).toContainText("Authentication required")
  await expect(page.getByText("550", { exact: true })).toHaveCount(0)
})
test("uncertain posting is not retried and blocks further writes", async ({
  page,
}) => {
  let posts = 0
  await page.route("**/api/**", (route) => {
    if (route.request().method() === "POST") {
      posts++
      return route.abort("failed")
    }
    return route.fulfill({
      json: route.request().url().includes("/accounts?") ? [account] : book,
    })
  })
  await page.goto("/")
  await expect(page.getByText("API Account · As of")).toBeVisible()
  await page.getByRole("button", { name: "Transactions", exact: true }).click()
  await page
    .getByText("Submit a dev financial posting", { exact: true })
    .click()
  await page
    .getByLabel("Vendor request JSON")
    .fill(JSON.stringify({ account: book.account, processDate: "2026-10-08" }))
  await page.getByLabel("I reviewed this posting").check()
  await page
    .getByRole("button", { name: "Submit posting", exact: true })
    .click()
  await expect(page.getByRole("alert")).toContainText(
    "Write outcome is uncertain",
  )
  await expect(
    page.getByRole("button", { name: "Submit posting", exact: true }),
  ).toBeDisabled()
  expect(posts).toBe(1)
})

test('renaming and deleting use PATCH and DELETE without replacing missing account metadata', async ({ page }) => {
  let rows = [{ ...account }];
  const methods: string[] = [];
  await page.route('**/api/**', route => {
    const req = route.request(); const url = new URL(req.url());
    if (url.pathname === '/api/account/edit') {
      expect(url.searchParams.get('accountId')).toBe('001'); methods.push(req.method());
      if (req.method() === 'PATCH') { expect(req.postDataJSON()).toEqual({ accountName: 'Renamed' }); rows[0].accountName = 'Renamed'; }
      if (req.method() === 'DELETE') rows = [];
      return route.fulfill({ json: { message: 'Saved' } });
    }
    return route.fulfill({ json: url.pathname === '/api/accounts' ? rows : book });
  });
  await page.goto('/'); await expect(page.getByText('API Account · As of')).toBeVisible();
  await page.getByRole('button', { name: 'Accounts', exact: true }).click();
  await page.getByLabel('Account name', { exact: true }).fill('Renamed');
  await page.getByRole('button', { name: 'Rename selected account' }).click();
  await expect(page.getByRole('cell', { name: 'Renamed' })).toBeVisible();
  await page.getByLabel('Delete account master').check();
  await page.getByRole('button', { name: 'Delete selected account' }).click();
  await expect(page.getByText('No accounts exist for this firm.')).toBeVisible();
  expect(methods).toEqual(['PATCH', 'DELETE']);
});
