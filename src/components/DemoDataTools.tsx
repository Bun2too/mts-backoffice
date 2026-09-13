import { useRef, useState } from "react"
import { useData } from "../context/DataContext"

export default function DemoDataTools() {
  const { exportSnapshot, importSnapshot, resetDemo } = useData()
  const [error, setError] = useState("")
  const [pending, setPending] = useState<string | null>(null)
  const [reset, setReset] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const download = () => {
    try {
      const url = URL.createObjectURL(
        new Blob([exportSnapshot()], { type: "application/json" }),
      )
      const a = document.createElement("a")
      a.href = url
      a.download = "backoffice-demo.json"
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <section
      className="approval-card"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        marginBottom: 24,
      }}
    >
      <h2 style={{ fontWeight: 600 }}>Demo data</h2>
      <p className="demo-note">
        Changes are saved in this browser. Export a snapshot to reuse a scenario
        elsewhere. Snapshots include demo passwords; use fictional data only.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn-secondary" onClick={download}>
          Export demo snapshot
        </button>
        <button className="btn-secondary" onClick={() => file.current?.click()}>
          Import demo snapshot
        </button>
        <button className="btn-danger" onClick={() => setReset(true)}>
          Reset demo data
        </button>
        <input
          ref={file}
          type="file" aria-label="Import demo snapshot file"
          accept=".json,application/json"
          hidden
          onChange={async (e) => {
            const selected = e.target.files?.[0]
            e.target.value = ""
            if (!selected) return
            if (selected.size > 5_000_000) {
              setError("Choose a snapshot smaller than 5 MB.")
              return
            }
            try {
              setPending(await selected.text())
              setError("")
            } catch {
              setError("The file could not be read.")
            }
          }}
        />
      </div>
      {(pending !== null || reset) && (
        <div className="demo-note">
          <p>
            {reset
              ? "Reset this browser to the packaged seed?"
              : "Replace this browser’s demo data with the imported snapshot?"}{" "}
            This replaces current changes and signs you out. Export first to
            keep a copy.
          </p>
          <div className="modal-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                setPending(null)
                setReset(false)
              }}
            >
              Keep current data
            </button>
            <button
              className="btn-danger"
              onClick={() => {
                try {
                  if (reset) resetDemo()
                  else importSnapshot(pending!)
                } catch (e) {
                  setError((e as Error).message)
                  setPending(null)
                  setReset(false)
                }
              }}
            >
              Confirm replacement
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </section>
  )
}
