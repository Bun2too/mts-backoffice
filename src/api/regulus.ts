export type Row = Record<string, unknown>
export interface AccountSummary {
  accountId: string
  accountName: string
}
export interface Asset {
  account: Row
  processDate: string
  balances: Row[]
  positions: Row[]
  cashes: Row[]
  trades: Row[]
  stocks: Row[]
  actsum: Row
  margin: Row
}
export class ApiError extends Error {
  status: number
  uncertain: boolean
  constructor(message: string, status = 0, uncertain = false) {
    super(message)
    this.status = status
    this.uncertain = uncertain
  }
}
export function record(value: unknown): value is Row {
  return !!value && typeof value === "object" && !Array.isArray(value)
}
export function parseAccounts(value: unknown): AccountSummary[] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (row) =>
        record(row) &&
        typeof row.accountId === "string" &&
        typeof row.accountName === "string",
    )
  ) {
    throw new ApiError("The API returned an invalid account list.")
  }
  return value
}
export function parseAsset(
  value: unknown,
  firmId: number,
  accountId: string,
): Asset | null {
  if (!record(value) || !record(value.account))
    throw new ApiError("The API returned an invalid account book.")
  const arrays = ["balances", "positions", "cashes", "trades", "stocks"]
  if (
    !arrays.every(
      (key) => Array.isArray(value[key]) && value[key].every(record),
    ) ||
    !record(value.actsum) ||
    !record(value.margin) ||
    typeof value.processDate !== "string"
  ) {
    throw new ApiError("The API returned an incomplete account book.")
  }
  // The deployed legacy API returns this sentinel instead of HTTP 404.
  if (
    value.account.firmId === 0 &&
    value.account.accountId === "" &&
    arrays.every((key) => (value[key] as Row[]).length === 0)
  )
    return null
  if (
    value.account.firmId !== firmId ||
    value.account.accountId !== accountId
  ) {
    throw new ApiError("The API returned a book for a different account.")
  }
  return value as unknown as Asset
}
export function validatePosting(
  value: unknown,
  firmId: number,
  accountId: string,
): Row {
  if (
    !record(value) ||
    !record(value.account) ||
    value.account.firmId !== firmId ||
    value.account.accountId !== accountId
  ) {
    throw new Error("Posting account must match the selected firm and account.")
  }
  const date = value.processDate
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  ) {
    throw new Error("A valid processDate (YYYY-MM-DD) is required.")
  }
  return value
}
export function createRegulusClient(base: string, firmId: number) {
  if (!Number.isInteger(firmId) || firmId < 1)
    throw new Error("VITE_REGULUS_FIRM_ID must be a positive integer.")
  async function request(
    path: string,
    init: RequestInit = {},
  ): Promise<unknown> {
    const write = !!init.method && init.method !== "GET"
    const controller = new AbortController()
    const cancel = () => controller.abort()
    init.signal?.addEventListener("abort", cancel, { once: true })
    if (init.signal?.aborted) controller.abort()
    const timeout = setTimeout(cancel, 25000)
    try {
      const response = await fetch(`${base.replace(/\/$/, "")}${path}`, {
        ...init,
        signal: controller.signal,
        cache: "no-store",
        headers: {
          Accept: "application/json",
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...init.headers,
        },
      })
      const text = await response.text()
      let body: unknown
      try {
        body = text ? JSON.parse(text) : null
      } catch {
        throw new ApiError(
          `API returned a non-JSON response (${response.status}). Check the API proxy.`,
          response.status,
          write,
        )
      }
      if (!response.ok)
        throw new ApiError(
          record(body) && typeof body.error === "string"
            ? body.error
            : `API request failed (${response.status}).`,
          response.status,
          write && response.status >= 500,
        )
      return body
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(
        write
          ? "Request interrupted. The write may have completed. Refresh and reconcile before submitting again."
          : "Unable to reach the Regulus API. Retry or check the connection. ",
        0,
        write,
      )
    } finally {
      clearTimeout(timeout)
      init.signal?.removeEventListener("abort", cancel)
    }
  }
  const query = (accountId?: string, processDate?: string) =>
    "?" +
    new URLSearchParams({
      firmId: String(firmId),
      ...(accountId ? { accountId } : {}),
      ...(processDate ? { processDate } : {}),
    })
  return {
    accounts: async (signal?: AbortSignal) =>
      parseAccounts(await request(`/accounts${query()}`, { signal })),
    asset: async (accountId: string, date?: string, signal?: AbortSignal) => {
      try {
        return parseAsset(
          await request(`/asset${query(accountId, date)}`, { signal }),
          firmId,
          accountId,
        )
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    },
    createAccount: (accountId: string, accountName: string) =>
      request("/account/edit", {
        method: "POST",
        body: JSON.stringify({ firmId, accountId, accountName }),
      }),
    renameAccount: (accountId: string, accountName: string) =>
      request(`/account/edit${query(accountId)}`, {
        method: "PATCH",
        body: JSON.stringify({ accountName }),
      }),
    deleteAccount: (accountId: string) =>
      request(`/account/edit${query(accountId)}`, { method: "DELETE" }),
    post: async (
      kind: "cash" | "trade" | "stock",
      accountId: string,
      body: unknown,
    ) => {
      const input = validatePosting(body, firmId, accountId)
      const response = await request(`/${kind}`, {
        method: "POST",
        body: JSON.stringify(input),
      })
      try {
        const asset = parseAsset(response, firmId, accountId)
        if (!asset) throw new Error()
        return asset
      } catch {
        throw new ApiError(
          "Posting was accepted but its book response could not be validated. Refresh and reconcile before submitting again.",
          200,
          true,
        )
      }
    },
  }
}
