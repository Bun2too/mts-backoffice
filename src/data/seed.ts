import {
  MOCK_ACCOUNTS,
  MOCK_BRANCHES,
  MOCK_POSITIONS,
  MOCK_REPS,
  MOCK_TRANSACTIONS,
  MOCK_USERS,
} from "./mockData"
import type { DemoData } from "../types"
import customSeed from "./demoSeed.json"
import { validateSnapshot } from "./snapshot"

export function createSeed(): DemoData {
  if (customSeed !== null) return validateSnapshot(customSeed)
  return structuredClone({
    version: 1,
    accounts: MOCK_ACCOUNTS,
    branches: MOCK_BRANCHES,
    positions: MOCK_POSITIONS,
    reps: MOCK_REPS.map((r) => ({
      ...r,
      assignedAccountIds: MOCK_ACCOUNTS.filter((a) => a.repId === r.id).map(
        (a) => a.id,
      ),
    })),
    transactions: MOCK_TRANSACTIONS,
    appUsers: Object.values(MOCK_USERS).map(({ user, password }) => ({
      ...user,
      repId: user.csrId,
      password,
    })),
    registrations: [],
    firmInfo: {
      id: "FIRM-001",
      name: "Ace Capital Group",
      legalName: "Ace Capital Group LLC",
      address: "1221 Avenue of the Americas",
      city: "New York",
      state: "NY",
      zip: "10020",
      country: "USA",
      phone: "+1 (212) 555-0101",
      email: "info@acefirm.com",
      website: "https://example.com",
      foundedYear: "2018",
      aum: "Demo portfolio",
      crd: "DEMO-001",
      ein: "DEMO",
      licenseType: "Demo broker",
      regulatoryBody: "Demo",
      status: "active",
    },
  })
}
