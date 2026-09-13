import { useState } from "react"
import type { Transaction, TxAction, TxStatus, User } from "../types"
import { useScopedData } from "../context/DataContext"
import { fmt } from "./shared"

export default function TransactionEditor({
  transaction,
  user,
  onClose,
}: {
  transaction: Transaction | null
  user: User
  onClose: () => void
}) {
  const { scopedAccounts, addTransaction, updateTransaction } = useScopedData()
  const accounts = scopedAccounts(user)
  const [draft, setDraft] = useState<Transaction>(
    () =>
      transaction ?? {
        id: `TXN-${crypto.randomUUID()}`,
        type: "trade",
        action: "buy",
        symbol: "",
        description: "",
        quantity: 1,
        price: 1,
        amount: 1,
        status: "pending",
        accountId: accounts[0]?.id ?? "",
        accountName: "",
        branchId: "",
        firmId: user.firmId,
        tradeDate: new Date().toISOString().slice(0, 10),
        settleDate: new Date().toISOString().slice(0, 10),
        csrId: "",
        csrName: "",
        notes: "",
      },
  )
  const [error, setError] = useState("")
  const editable =
    ["firm", "branch"].includes(user.level) && draft.type !== "stock"
  const trade = draft.type === "trade"
  const amount = trade
    ? (draft.quantity ?? 0) * (draft.price ?? 0)
    : draft.amount
  const save = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const tx = {
        ...draft,
        description:
          draft.description.trim() ||
          `${draft.action} ${trade ? draft.symbol : "cash"}`,
      }
      if (transaction) updateTransaction(tx)
      else addTransaction(tx)
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <div
      className="modal-backdrop"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose()
      }}
    >
      <section
        className="demo-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-title"
      >
        <div className="modal-heading">
          <h2 id="transaction-title">
            {transaction ? "Transaction details" : "New transaction"}
          </h2>
          <button
            aria-label="Close transaction"
            className="btn-secondary"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <form onSubmit={save}>
          <p className="demo-note">
            {editable
              ? "Save as settled to calculate account cash and positions immediately. Pending transactions have no financial effect."
              : "View only. Historical stock transfers are not calculated in this demo."}
          </p>
          <fieldset disabled={!editable} className="form-grid">
            <label>
              Account
              <select
                autoFocus
                required
                value={draft.accountId}
                onChange={(e) =>
                  setDraft({ ...draft, accountId: e.target.value })
                }
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.ownerName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Type
              <select
                value={draft.type}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    type: e.target.value as "trade" | "cash",
                    action: e.target.value === "trade" ? "buy" : "deposit",
                  })
                }
              >
                <option value="trade">Trade</option>
                <option value="cash">Cash</option>
                {draft.type === "stock" && (
                  <option value="stock">Stock transfer</option>
                )}
              </select>
            </label>
            <label>
              Action
              <select
                value={draft.action}
                onChange={(e) =>
                  setDraft({ ...draft, action: e.target.value as TxAction })
                }
              >
                {(trade
                  ? ["buy", "sell"]
                  : draft.type === "stock"
                    ? ["transfer"]
                    : ["deposit", "withdrawal", "dividend"]
                ).map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={draft.status}
                onChange={(e) =>
                  setDraft({ ...draft, status: e.target.value as TxStatus })
                }
              >
                {["pending", "settled", "cancelled", "failed", "rebilled"].map(
                  (s) => (
                    <option key={s}>{s}</option>
                  ),
                )}
              </select>
            </label>
            {trade && (
              <>
                <label>
                  Symbol
                  <input
                    required
                    value={draft.symbol ?? ""}
                    maxLength={16}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        symbol: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </label>
                <label>
                  Quantity
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={draft.quantity ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, quantity: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Price
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={draft.price ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, price: Number(e.target.value) })
                    }
                  />
                </label>
              </>
            )}
            {!trade && (
              <label>
                Amount
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={draft.amount}
                  onChange={(e) =>
                    setDraft({ ...draft, amount: Number(e.target.value) })
                  }
                />
              </label>
            )}
            <label>
              Trade date
              <input
                required
                type="date"
                value={draft.tradeDate}
                onChange={(e) =>
                  setDraft({ ...draft, tradeDate: e.target.value })
                }
              />
            </label>
            <label>
              Settlement date
              <input
                required
                type="date"
                min={draft.tradeDate}
                value={draft.settleDate}
                onChange={(e) =>
                  setDraft({ ...draft, settleDate: e.target.value })
                }
              />
            </label>
            <label className="full-width">
              Description
              <input
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </label>
            <label className="full-width">
              Notes
              <textarea
                rows={2}
                value={draft.notes ?? ""}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </label>
          </fieldset>
          <p className="calculation-preview">
            Transaction amount <strong>{fmt(amount)}</strong>
          </p>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
            {editable && (
              <button type="submit" className="btn-primary">
                Save & calculate
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}
