import { test, expect, type Page } from "@playwright/test"
async function login(
  page: Page,
  role = "Firm",
  email = "admin@acefirm.com",
  password = "firm123",
) {
  await page
    .getByRole("button", { name: role + " ", exact: false })
    .filter({
      hasText:
        role === "Firm"
          ? "Firm-level administrator"
          : role === "Branch"
            ? "Branch manager or supervisor"
            : role === "CSR Rep"
              ? "Client services representative"
              : "Client / account access",
    })
    .click()
  await page.getByPlaceholder("you@example.com").fill(email)
  await page.getByRole("button", { name: "Continue →" }).click()
  await page.getByRole("button", { name: "Skip verification (demo)" }).click()
  await page.locator("input[type=password]").fill(password)
  await page.getByRole("button", { name: "Sign In", exact: true }).click()
  await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible()
}
async function logout(page: Page) {
  await page.getByRole("button", { name: "Sign Out" }).click()
}
async function nav(page: Page, name: string) {
  await page.locator("nav").getByRole("button", { name }).click()
}

test("registration, approval, login, theme persistence, transaction edits and account visibility", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.goto("/")
  await page.getByRole("button", { name: "Light theme" }).click()
  await page.reload()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light")
  await page.getByRole("button", { name: "Request access / Register" }).click()
  await page.getByLabel("Full Name").fill("Demo Client")
  await page.getByLabel("Email Address").fill("demo.client@example.com")
  await page.getByLabel("Demo Password").fill("demopass123")
  await page.getByLabel("Confirm Password").fill("demopass123")
  await page.getByLabel("Phone Number").fill("555-0100")
  await page.getByLabel("Message / Referral Info").fill("Demo account access")
  await page.getByRole("button", { name: "Submit Request" }).click()
  await expect(
    page.getByRole("heading", { name: "Request Submitted" }),
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Back to Sign In", exact: true })
    .click()
  await login(page)
  await nav(page, "Users & Approvals")
  await page.getByRole("button", { name: "Pending Registrations" }).click()
  await page.getByRole("button", { name: "Approve & activate" }).click()
  await expect(page.getByRole("alert")).toContainText("active account")
  await page
    .getByRole("combobox", { name: "Assign account", exact: true })
    .selectOption("ACC-78341")
  await page.getByRole("button", { name: "Approve & activate" }).click()
  await expect(
    page.getByText("No pending registration requests."),
  ).toBeVisible()
  await nav(page, "Transactions")
  await page.getByRole("button", { name: "+ New Transaction" }).click()
  await page.getByLabel("Symbol", { exact: true }).fill("DEMO")
  await page.getByLabel("Quantity", { exact: true }).fill("10")
  await page.getByLabel("Price", { exact: true }).fill("25")
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("settled")
  await page.getByRole("button", { name: "Save & calculate" }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await page.getByRole("row").filter({ hasText: "buy DEMO" }).click()
  await page.getByLabel("Quantity", { exact: true }).fill("20")
  await page.getByRole("button", { name: "Save & calculate" }).click()
  await logout(page)
  await login(page, "Account Holder", "demo.client@example.com", "demopass123")
  await nav(page, "Balances")
  await expect(
    page.getByText("$86,923.18", { exact: true }).first(),
  ).toBeVisible()
  await nav(page, "Positions")
  await expect(page.getByRole("row").filter({ hasText: "DEMO" })).toContainText(
    "20",
  )
  await nav(page, "Transactions")
  await expect(
    page.getByRole("button", { name: "+ New Transaction" }),
  ).toHaveCount(0)
  await expect(
    page.getByRole("row").filter({ hasText: "buy DEMO" }),
  ).toContainText("500.00")
  await page.reload()
  await login(page, "Account Holder", "demo.client@example.com", "demopass123")
  await nav(page, "Balances")
  await expect(
    page.getByText("$86,923.18", { exact: true }).first(),
  ).toBeVisible()
  await page.screenshot({
    path: "test-results/account-light.png",
    fullPage: true,
  })
  expect(errors).toEqual([])
})

test("firm user and rep CRUD, cross-branch assignment, settings and snapshot export", async ({
  page,
}, testInfo) => {
  await page.goto("/")
  await login(page)
  await nav(page, "Users & Approvals")
  await page.getByRole("button", { name: "+ New User" }).click()
  await page.getByLabel("Full Name").fill("New User")
  await page.getByLabel("Email", { exact: true }).fill("new.user@example.com")
  await page.getByLabel("Password", { exact: true }).fill("newpass123")
  await page
    .getByRole("combobox", { name: "Account", exact: true })
    .selectOption("ACC-78342")
  await page.getByRole("button", { name: "Create User", exact: true }).click()
  await expect(
    page.getByRole("row").filter({ hasText: "new.user@example.com" }),
  ).toBeVisible()
  await page
    .getByRole("row")
    .filter({ hasText: "new.user@example.com" })
    .click()
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("suspended")
  await page.getByRole("button", { name: "Save", exact: true }).click()
  await expect(
    page.getByRole("row").filter({ hasText: "new.user@example.com" }),
  ).toContainText("suspended")
  await page
    .getByRole("row")
    .filter({ hasText: "new.user@example.com" })
    .click()
  await page.getByRole("button", { name: "Delete", exact: true }).click()
  await page.getByRole("button", { name: "Yes", exact: true }).click()
  await expect(
    page.getByRole("row").filter({ hasText: "new.user@example.com" }),
  ).toHaveCount(0)
  await nav(page, "Representatives")
  await page.getByRole("button", { name: "+ New Rep" }).click()
  await page.getByLabel("Full Name").fill("Demo Rep")
  await page.getByLabel("Email", { exact: true }).fill("rep@example.com")
  await page
    .getByRole("combobox", { name: "Primary Branch", exact: true })
    .selectOption("BRN-NYC01")
  await page.getByRole("checkbox", { name: /ACC-78350/ }).click()
  await page.getByRole("button", { name: "Create Rep", exact: true }).click()
  await expect(
    page.getByRole("row").filter({ hasText: "Demo Rep" }),
  ).toContainText("ACC-78350")
  await page.getByRole("row").filter({ hasText: "Demo Rep" }).click()
  await page.getByLabel("Full Name").fill("Updated Rep")
  await page.getByRole("button", { name: "Save", exact: true }).click()
  await page.getByRole("row").filter({ hasText: "Updated Rep" }).click()
  await page.getByRole("button", { name: "Delete", exact: true }).click()
  await page.getByRole("button", { name: "Yes", exact: true }).click()
  await expect(
    page.getByRole("row").filter({ hasText: "Updated Rep" }),
  ).toHaveCount(0)
  await nav(page, "Firm Settings")
  await page.getByRole("button", { name: "Edit", exact: true }).click()
  await page.getByLabel("Firm Name", { exact: true }).fill("Demo Capital")
  await page.getByRole("button", { name: "Save Changes", exact: true }).click()
  await expect(page.getByText("DEMO CAPITAL", { exact: true })).toBeVisible()
  const downloaded = page.waitForEvent("download")
  await page.getByRole("button", { name: "Export demo snapshot" }).click()
  const snapshot = await downloaded
  expect(snapshot.suggestedFilename()).toBe("backoffice-demo.json")
  const snapshotPath = testInfo.outputPath("snapshot.json")
  await snapshot.saveAs(snapshotPath)
  await page
    .getByLabel("Import demo snapshot file")
    .setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from("{}"),
    })
  await page.getByRole("button", { name: "Confirm replacement" }).click()
  await expect(page.getByRole("alert")).toContainText("Invalid demo snapshot")
  await page
    .getByRole("button", { name: "Reset demo data", exact: true })
    .click()
  await page.getByRole("button", { name: "Confirm replacement" }).click()
  await login(page)
  await nav(page, "Firm Settings")
  await page.getByLabel("Import demo snapshot file").setInputFiles(snapshotPath)
  await page.getByRole("button", { name: "Confirm replacement" }).click()
  await login(page)
  await nav(page, "Firm Settings")
  await expect(page.getByText("DEMO CAPITAL", { exact: true })).toBeVisible()
  await page.screenshot({ path: "test-results/firm-dark.png", fullPage: true })
})

test("branch creation is scoped and settled trades can be cancelled", async ({
  page,
}) => {
  await page.goto("/")
  await login(page, "Branch", "bmgr@acefirm.com", "branch123")
  await expect(
    page.locator("nav").getByRole("button", { name: "Users & Approvals" }),
  ).toHaveCount(0)
  await nav(page, "Transactions")
  await page.getByRole("button", { name: "+ New Transaction" }).click()
  await expect(
    page
      .getByRole("combobox", { name: "Account", exact: true })
      .locator("option"),
  ).toHaveCount(4)
  await page
    .getByRole("combobox", { name: "Type", exact: true })
    .selectOption("cash")
  await page.getByLabel("Amount", { exact: true }).fill("100")
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("settled")
  await page
    .getByLabel("Description", { exact: true })
    .fill("Branch demo deposit")
  await page.getByRole("button", { name: "Save & calculate" }).click()
  await page.getByRole("row").filter({ hasText: "Branch demo deposit" }).click()
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("cancelled")
  await page.getByRole("button", { name: "Save & calculate" }).click()
  await expect(
    page.getByRole("row").filter({ hasText: "Branch demo deposit" }),
  ).toContainText("cancelled")
})

test('firm branding saves across login, registration, refresh and snapshots; discard and reset work', async ({ page }, testInfo) => {
  await page.goto('/'); await login(page);
  await nav(page, 'Firm Settings');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Firm Name', { exact: true }).fill('Northstar Financial');
  await page.getByLabel('Upload firm logo').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') });
  await expect(page.getByRole('button', { name: 'Use default logo' })).toBeVisible();
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(page).toHaveTitle('Northstar Financial — Back Office Demo');
  await expect(page.getByRole('img', { name: 'Northstar Financial logo', exact: true }).first()).toBeVisible();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export demo snapshot' }).click();
  const path = testInfo.outputPath('branding.json'); await (await downloaded).saveAs(path);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByRole('button', { name: 'Use default logo' }).click();
  await page.getByRole('button', { name: 'Discard', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Northstar Financial logo', exact: true }).first()).toBeVisible();
  await logout(page);
  await expect(page.getByRole('img', { name: 'Northstar Financial logo', exact: true })).toHaveCount(2);
  await page.reload();
  await expect(page.getByRole('img', { name: 'Northstar Financial logo', exact: true })).toHaveCount(2);
  await page.getByRole('button', { name: 'Request access / Register' }).click();
  await expect(page.getByRole('img', { name: 'Northstar Financial logo', exact: true })).toHaveCount(2);
  await page.getByRole('button', { name: 'Back to Sign In' }).click();
  await login(page); await nav(page, 'Firm Settings');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByRole('button', { name: 'Use default logo' }).click();
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Northstar Financial logo', exact: true })).toHaveCount(0);
  await page.getByLabel('Import demo snapshot file').setInputFiles(path);
  await page.getByRole('button', { name: 'Confirm replacement' }).click();
  await expect(page.getByRole('img', { name: 'Northstar Financial logo', exact: true })).toHaveCount(2);
  await login(page); await nav(page, 'Firm Settings');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Upload firm logo').setInputFiles({ name: 'invalid.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') });
  await expect(page.getByRole('alert')).toContainText('PNG, JPEG or WebP');
});
