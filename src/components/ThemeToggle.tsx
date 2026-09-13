import { useData } from "../context/DataContext"
export default function ThemeToggle({
  floating = false,
}: {
  floating?: boolean
}) {
  const { theme, setTheme } = useData()
  return (
    <div
      style={
        floating
          ? { position: "fixed", right: 16, bottom: 16, zIndex: 90 }
          : { padding: "8px 14px" }
      }
    >
      <button
        className="btn-secondary"
        aria-pressed={theme === "light"}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        style={{ background: "var(--card)", width: "100%" }}
      >
        {theme === "dark" ? "☀ Light theme" : "☾ Dark theme"}
      </button>
    </div>
  )
}
