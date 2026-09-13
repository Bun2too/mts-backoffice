import type { TxStatus } from '../types';

export const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

export const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

export const TX_STATUS_CLASS: Record<TxStatus, string> = {
  settled:   'badge-green',
  pending:   'badge-amber',
  cancelled: 'badge-gray',
  rebilled:  'badge-blue',
  failed:    'badge-red',
};

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    settled: 'badge-green', pending: 'badge-amber', cancelled: 'badge-gray',
    rebilled: 'badge-blue', failed: 'badge-red',
    active: 'badge-green', inactive: 'badge-gray', suspended: 'badge-red', closed: 'badge-red',
  };
  return <span className={`badge ${map[status] ?? 'badge-gray'}`}>{status}</span>;
}

export function PnlCell({ value, pct }: { value: number; pct?: number }) {
  const pos = value >= 0;
  return (
    <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.72rem', color: pos ? 'var(--gain)' : 'var(--loss)', whiteSpace: 'nowrap' }}>
      {pos ? '+' : ''}{fmt(value)}{pct !== undefined ? ` (${fmtPct(pct)})` : ''}
    </span>
  );
}

export function MonoCell({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.72rem', color: 'var(--foreground)' }}>
      {children}
    </span>
  );
}

export function TH({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th style={{ padding: '9px 10px', textAlign: right ? 'right' : 'left', fontSize: '0.6rem', color: 'var(--muted-foreground)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  );
}

export function TD({ children, right, style }: { children: React.ReactNode; right?: boolean; style?: React.CSSProperties }) {
  return (
    <td style={{ padding: '8px 10px', textAlign: right ? 'right' : 'left', ...style }}>
      {children}
    </td>
  );
}

export function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <h1 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{title}</h1>
        {sub && <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>{sub}</span>}
      </div>
    </div>
  );
}

export function GroupBySelect({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 200,
      background: 'var(--card)', border: '1px solid var(--gain)',
      borderRadius: 3, padding: '10px 16px', fontSize: '0.78rem',
      color: 'var(--gain)', fontFamily: 'var(--font-jetbrains)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      ✓ {message}
    </div>
  );
}

export function ReadOnlyBanner() {
  return (
    <div style={{ padding: '7px 14px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 3, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: 'var(--warn)', fontSize: '0.7rem' }}>⚠</span>
      <span style={{ fontSize: '0.7rem', color: 'var(--warn)' }}>
        View only — your account level does not have edit permissions.
      </span>
    </div>
  );
}
