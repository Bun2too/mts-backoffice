import { validateLogo } from "../data/branding";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type {
  AccountRecord,
  AppUserRecord,
  Branch,
  DemoData,
  FirmInfo,
  PendingRegistration,
  Rep,
  Theme,
  Transaction,
  User,
} from "../types"
import {
  accountScope,
  buildBalances,
  emailKey,
  loginUser,
  roleTitle,
  saveTransaction,
  validateUser,
} from "../data/demoModel"
import { createSeed } from "../data/seed"
import { validateSnapshot } from "../data/snapshot"

const STORAGE_KEY = "ace-backoffice-demo-v1"
const THEME_KEY = "ace-backoffice-theme"
function loadData(): { data: DemoData; error: string } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return {
      data: saved ? validateSnapshot(JSON.parse(saved)) : createSeed(),
      error: "",
    }
  } catch {
    return {
      data: createSeed(),
      error:
        "Saved demo data could not be loaded. Seed data is shown; use Reset demo data to replace the saved copy.",
    }
  }
}
function normalize(data: DemoData): DemoData {
  data.accounts.forEach((a) => {
    a.branchName = data.branches.find((b) => b.id === a.branchId)?.name ?? ""
    a.repName = data.reps.find((r) => r.id === a.repId)?.name ?? ""
  })
  data.reps.forEach((r) => {
    r.branchName = data.branches.find((b) => b.id === r.branchId)?.name ?? ""
    r.assignedAccountIds = data.accounts
      .filter((a) => a.repId === r.id)
      .map((a) => a.id)
    r.accountCount = r.assignedAccountIds.length
  })
  data.branches.forEach((b) => {
    b.accountCount = data.accounts.filter((a) => a.branchId === b.id).length
  })
  for (const row of [...data.transactions, ...data.positions]) {
    const a = data.accounts.find((a) => a.id === row.accountId)
    if (a) {
      row.branchId = a.branchId
      row.accountName = a.ownerName
    }
  }
  return data
}
function useDemoStore() {
  const [initial] = useState(loadData)
  const [data, setData] = useState(() => normalize(initial.data))
  const current = useRef(data)
  const [storageError, setStorageError] = useState(initial.error)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [theme, updateTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark"
    } catch {
      return "dark"
    }
  })
  const activeRecord = data.appUsers.find(
    (u) => u.id === sessionId && u.status === "active",
  )
  const user = activeRecord ? loginUser(data, activeRecord) : null
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  useEffect(() => { document.title = `${data.firmInfo.name} — Back Office Demo`; }, [data.firmInfo.name]);
  const setTheme = (t: Theme) => {
    updateTheme(t)
    try {
      localStorage.setItem(THEME_KEY, t)
    } catch {
      setStorageError("Theme could not be saved in this browser.")
    }
  }
  const commit = (next: DemoData) => {
    const normalized = normalize(next)
    // Write before publishing state so callers never report a save that failed.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    } catch {
      throw new Error(
        "Browser storage is unavailable or full. Export your data, then free storage before saving.",
      )
    }
    current.current = normalized
    setData(normalized)
    setStorageError("")
  }
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === THEME_KEY)
        updateTheme(event.newValue === "light" ? "light" : "dark")
      if (event.key !== STORAGE_KEY) return
      try {
        const next = normalize(
          event.newValue
            ? validateSnapshot(JSON.parse(event.newValue))
            : createSeed(),
        )
        current.current = next
        setData(next)
        setStorageError("")
      } catch {
        setStorageError("A change in another tab could not be loaded.")
      }
    }
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [])
  const actor = () => {
    const record = current.current.appUsers.find(
      (u) => u.id === sessionId && u.status === "active",
    )
    if (!record) throw new Error("Sign in with an active user.")
    return loginUser(current.current, record)
  }
  const admin = () => {
    if (actor().level !== "firm")
      throw new Error("Firm administrator access required.")
  }
  const mutate = (fn: (d: DemoData) => void) => {
    const next = structuredClone(current.current)
    fn(next)
    commit(next)
  }
  const saveUser = (input: AppUserRecord, isNew: boolean) => {
    admin()
    mutate((d) => {
      if (isNew && d.appUsers.some((u) => u.id === input.id))
        throw new Error("User ID already exists.")
      const old = d.appUsers.find((u) => u.id === input.id)
      const u = {
        ...input,
        email: emailKey(input.email),
        password: input.password || old?.password,
        firmId: d.firmInfo.id,
      }
      validateUser(d, u)
      d.appUsers = isNew
        ? [...d.appUsers, u]
        : d.appUsers.map((x) => (x.id === u.id ? u : x))
    })
  }
  const saveRep = (rep: Rep, isNew: boolean) => {
    admin()
    mutate((d) => {
      if (
        !rep.id.trim() ||
        !rep.name.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rep.email)
      )
        throw new Error("Enter a rep ID, name and valid email.")
      if (!d.branches.some((b) => b.id === rep.branchId))
        throw new Error("Select a primary branch.")
      if (isNew && d.reps.some((r) => r.id === rep.id))
        throw new Error("Rep ID already exists.")
      if (
        rep.assignedAccountIds?.some(
          (id) => !d.accounts.some((a) => a.id === id),
        )
      )
        throw new Error("An assigned account no longer exists.")
      d.reps = isNew
        ? [...d.reps, rep]
        : d.reps.map((r) => (r.id === rep.id ? rep : r))
      d.accounts.forEach((a) => {
        if (rep.assignedAccountIds?.includes(a.id)) a.repId = rep.id
        else if (a.repId === rep.id) a.repId = ""
      })
    })
  }
  const saveAccount = (account: AccountRecord) => {
    admin()
    mutate((d) => {
      if (
        !account.ownerName.trim() ||
        !d.branches.some((b) => b.id === account.branchId)
      )
        throw new Error("Enter an account owner and select a branch.")
      if (account.repId && !d.reps.some((r) => r.id === account.repId))
        throw new Error("Select an existing rep.")
      const next = {
        ...account,
        totalValue: account.cashBalance + account.portfolioValue,
      }
      d.accounts = d.accounts.some((a) => a.id === account.id)
        ? d.accounts.map((a) => (a.id === account.id ? next : a))
        : [...d.accounts, next]
    })
  }
  const saveBranch = (branch: Branch) => {
    admin()
    mutate((d) => {
      if (!branch.name.trim() || !branch.address.trim())
        throw new Error("Branch name and address are required.")
      d.branches = d.branches.some((b) => b.id === branch.id)
        ? d.branches.map((b) => (b.id === branch.id ? branch : b))
        : [...d.branches, branch]
    })
  }
  return {
    ...data,
    data,
    user,
    theme,
    setTheme,
    storageError,
    signOut: () => setSessionId(null),
    signIn: (email: string, password: string, level: User["level"]) => {
      const record = current.current.appUsers.find(
        (u) => emailKey(u.email) === emailKey(email),
      )
      if (!record || record.password !== password || record.level !== level)
        throw new Error("Email, password or selected role is incorrect.")
      if (record.status !== "active")
        throw new Error("This user is pending approval or suspended.")
      setSessionId(record.id)
    },
    balances: buildBalances(data.accounts),
    addAppUser: (u: AppUserRecord) => saveUser(u, true),
    updateAppUser: (u: AppUserRecord) => saveUser(u, false),
    deleteAppUser: (id: string) => {
      admin()
      mutate((d) => {
        if (id === sessionId)
          throw new Error("You cannot delete your signed-in user.")
        d.appUsers = d.appUsers.filter((u) => u.id !== id)
        if (
          !d.appUsers.some((u) => u.level === "firm" && u.status === "active")
        )
          throw new Error("Keep an active firm administrator.")
      })
    },
    addRegistration: (r: PendingRegistration) =>
      mutate((d) => {
        if (
          !r.name.trim() ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email) ||
          r.password.length < 6
        )
          throw new Error(
            "Enter a name, valid email and password of at least 6 characters.",
          )
        if (
          d.appUsers.some((u) => emailKey(u.email) === emailKey(r.email)) ||
          d.registrations.some(
            (u) =>
              u.status === "pending" && emailKey(u.email) === emailKey(r.email),
          )
        )
          throw new Error("That email already has a user or pending request.")
        d.registrations.unshift({
          ...r,
          email: emailKey(r.email),
          status: "pending",
        })
      }),
    approveRegistration: (
      id: string,
      assignment: { branchId?: string; repId?: string; accountId?: string },
    ) => {
      admin()
      mutate((d) => {
        const r = d.registrations.find(
          (r) => r.id === id && r.status === "pending",
        )
        if (!r) throw new Error("This request has already been reviewed.")
        const u: AppUserRecord = {
          id: `USR-${crypto.randomUUID()}`,
          name: r.name,
          email: r.email,
          phone: r.phone,
          level: r.desiredLevel,
          role: roleTitle(r.desiredLevel),
          firmId: d.firmInfo.id,
          ...assignment,
          password: r.password,
          status: "active",
          createdAt: new Date().toISOString().slice(0, 10),
          approvedBy: actor().id,
        }
        validateUser(d, u)
        d.appUsers.push(u)
        r.status = "approved"
      })
    },
    rejectRegistration: (id: string) => {
      admin()
      mutate((d) => {
        const r = d.registrations.find(
          (r) => r.id === id && r.status === "pending",
        )
        if (r) r.status = "rejected"
      })
    },
    addRep: (r: Rep) => saveRep(r, true),
    updateRep: (r: Rep) => saveRep(r, false),
    deleteRep: (id: string) => {
      admin()
      mutate((d) => {
        if (d.appUsers.some((u) => u.repId === id))
          throw new Error("Reassign linked users before deleting this rep.")
        d.reps = d.reps.filter((r) => r.id !== id)
        d.accounts.forEach((a) => {
          if (a.repId === id) a.repId = ""
        })
      })
    },
    addAccount: saveAccount,
    updateAccount: saveAccount,
    deleteAccount: (id: string) => {
      admin()
      mutate((d) => {
        if (
          d.transactions.some((t) => t.accountId === id) ||
          d.positions.some((p) => p.accountId === id) ||
          d.appUsers.some((u) => u.accountId === id)
        )
          throw new Error(
            "This account has linked data. Close it instead of deleting it.",
          )
        d.accounts = d.accounts.filter((a) => a.id !== id)
      })
    },
    addBranch: saveBranch,
    updateBranch: saveBranch,
    deleteBranch: (id: string) => {
      admin()
      mutate((d) => {
        if (
          d.accounts.some((a) => a.branchId === id) ||
          d.reps.some((r) => r.branchId === id) ||
          d.appUsers.some((u) => u.branchId === id)
        )
          throw new Error(
            "Reassign linked accounts, reps and users before deleting this branch.",
          )
        d.branches = d.branches.filter((b) => b.id !== id)
      })
    },
    updateFirmInfo: (f: FirmInfo) => {
      admin()
      validateLogo(f.logoDataUrl)
      if (!f.name.trim() || !f.address.trim())
        throw new Error("Firm name and address are required.")
      mutate((d) => {
        d.firmInfo = f
      })
    },
    addTransaction: (t: Transaction) =>
      commit(saveTransaction(current.current, actor(), t)),
    updateTransaction: (t: Transaction) =>
      commit(saveTransaction(current.current, actor(), t)),
    updateProfile: (u: User) =>
      mutate((d) => {
        const self = actor()
        const record = d.appUsers.find((r) => r.id === self.id)!
        const next = { ...record, name: u.name, email: u.email, phone: u.phone }
        validateUser(d, next)
        Object.assign(record, next)
      }),
    changePassword: (old: string, next: string) =>
      mutate((d) => {
        const record = d.appUsers.find((r) => r.id === actor().id)!
        if (record.password !== old)
          throw new Error("Current password is incorrect.")
        if (next.length < 8) throw new Error("Use at least 8 characters.")
        record.password = next
      }),
    exportSnapshot: () => {
      admin()
      return JSON.stringify(current.current, null, 2)
    },
    importSnapshot: (text: string) => {
      admin()
      commit(validateSnapshot(JSON.parse(text)))
      setSessionId(null)
    },
    resetDemo: () => {
      admin()
      commit(createSeed())
      setSessionId(null)
    },
  }
}
const Ctx = createContext<ReturnType<typeof useDemoStore> | null>(null)
export function DataProvider({ children }: { children: ReactNode }) {
  const value = useDemoStore()
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useData() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("DataProvider is required")
  return ctx
}
export function useScopedData() {
  const store = useData()
  const scopedAccounts = (user: User) => accountScope(store.data, user)
  const ids = (user: User) => new Set(scopedAccounts(user).map((a) => a.id))
  return {
    ...store,
    scopedAccounts,
    scopedTransactions: (u: User) =>
      store.transactions.filter((t) => ids(u).has(t.accountId)),
    scopedPositions: (u: User) =>
      store.positions.filter((p) => ids(u).has(p.accountId)),
    scopedBalances: (u: User) =>
      store.balances.filter((b) => ids(u).has(b.accountId)),
  }
}
