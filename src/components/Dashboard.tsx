import type { User } from '../types';
import { canEditData } from '../types';
import { scopedTransactions, scopedAccounts, scopedPositions, scopedBalances, MOCK_BRANCHES } from '../data/mockData';
import { fmt, StatusBadge } from './shared';

const STATUS_CLASS: Record<string, string> = {
  settled: 'badge-green', pending: 'badge-amber', cancelled: 'badge-gray', rebilled: 'badge-blue', failed: 'badge-red',
};

interface Props { user: User }

export default function Dashboard({ user }: Props) {
  const txns   = scopedTransactions(user);
  const accts  = scopedAccounts(user);
  const pos    = scopedPositions(user);
  const bals   = scopedBalances(user);

  const totalEquity = bals.reduce((s, b) => s + b.totalEquity, 0);
  const totalCash   = bals.reduce((s, b) => s + b.cashBalance, 0);
  const totalMV     = pos.reduce((s, p) => s + p.marketValue, 0);
  const totalPnl    = bals.reduce((s, b) => s + b.dayPnl, 0);

  const statusCounts = txns.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  const stats = buildStats(user, { totalEquity, totalCash, totalMV, totalPnl, accts, pos, bals });
  const recent = txns.slice(0, 6);

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '18px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 2 }}>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Dashboard</h1>
          <ContextLabel user={user} />
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', margin: 0 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {!canEditData(user.level) && <span style={{ marginLeft: 10, color: 'var(--warn)', fontSize: '0.65rem' }}>● View-only access</span>}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 3, padding: '12px 14px' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'var(--font-jetbrains)' }}>{s.label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-jetbrains)', color: 'var(--foreground)', marginBottom: 3 }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: '0.66rem', fontFamily: 'var(--font-jetbrains)', color: s.up === undefined ? 'var(--muted-foreground)' : s.up ? 'var(--gain)' : 'var(--loss)' }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
        {/* Recent transactions table */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 3 }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>Recent Transactions</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-jetbrains)' }}>{txns.length} total</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['ID', 'Description', ...(user.level !== 'account' ? ['Account'] : []), 'Amount', 'Date', 'Status'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: '0.58rem', color: 'var(--muted-foreground)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(t => (
                  <tr key={t.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(30,45,74,0.4)' }}>
                    <td style={{ padding: '7px 10px', fontFamily: 'var(--font-jetbrains)', fontSize: '0.6rem', color: 'var(--accent)', whiteSpace: 'nowrap' }}>{t.id}</td>
                    <td style={{ padding: '7px 10px', fontSize: '0.71rem', color: 'var(--foreground)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                    {user.level !== 'account' && (
                      <td style={{ padding: '7px 10px', fontSize: '0.66rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{t.accountId}</td>
                    )}
                    <td style={{ padding: '7px 10px', fontFamily: 'var(--font-jetbrains)', fontSize: '0.69rem', color: (t.action === 'sell' || t.action === 'withdrawal') ? 'var(--loss)' : 'var(--gain)', whiteSpace: 'nowrap' }}>
                      {(t.action === 'sell' || t.action === 'withdrawal') ? '−' : '+'}{fmt(t.amount)}
                    </td>
                    <td style={{ padding: '7px 10px', fontFamily: 'var(--font-jetbrains)', fontSize: '0.62rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{t.tradeDate}</td>
                    <td style={{ padding: '7px 10px' }}><span className={`badge ${STATUS_CLASS[t.status]}`}>{t.status}</span></td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>No transactions in scope.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Tx status summary */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 3 }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>Tx Status</span>
            </div>
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(statusCounts).map(([s, n]) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <StatusBadge status={s} />
                  <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.8rem', fontWeight: 600 }}>{n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Role scope summary */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 3 }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>Scope</span>
            </div>
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {user.level === 'firm' && (
                <>
                  <ScopeRow label="Branches" value={String(MOCK_BRANCHES.length)} />
                  <ScopeRow label="Accounts" value={String(accts.length)} />
                </>
              )}
              {user.level === 'branch' && <ScopeRow label="Accounts" value={String(accts.length)} />}
              {user.level === 'csr' && <ScopeRow label="Accounts" value={String(accts.length)} />}
              <ScopeRow label="Positions" value={String(pos.length)} />
              <ScopeRow label="Transactions" value={String(txns.length)} />
              <ScopeRow label="Permissions" value={canEditData(user.level) ? 'Read / Write' : 'Read Only'} highlight={!canEditData(user.level)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScopeRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.72rem', fontWeight: 600, color: highlight ? 'var(--warn)' : 'var(--foreground)' }}>{value}</span>
    </div>
  );
}

function ContextLabel({ user }: { user: User }) {
  if (user.level === 'firm')    return <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.62rem', color: 'var(--muted-foreground)' }}>Firm-wide · {user.firmName}</span>;
  if (user.level === 'branch')  return <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.62rem', color: 'var(--muted-foreground)' }}>{user.branchName}</span>;
  if (user.level === 'csr')     return <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.62rem', color: 'var(--muted-foreground)' }}>Rep: {user.csrName}</span>;
  if (user.level === 'account') return <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.62rem', color: 'var(--muted-foreground)' }}>{user.accountId} · {user.accountName}</span>;
  return null;
}

interface StatsInput {
  totalEquity: number; totalCash: number; totalMV: number; totalPnl: number;
  accts: ReturnType<typeof scopedAccounts>; pos: ReturnType<typeof scopedPositions>;
  bals: ReturnType<typeof scopedBalances>;
}

function buildStats(user: User, d: StatsInput) {
  const base = [
    { label: 'Total Equity',    value: fmt(d.totalEquity),   sub: undefined,             up: undefined },
    { label: 'Cash Balance',    value: fmt(d.totalCash),      sub: undefined,             up: undefined },
    { label: 'Portfolio Value', value: fmt(d.totalMV),        sub: undefined,             up: undefined },
    { label: "Day P&L",         value: (d.totalPnl >= 0 ? '+' : '') + fmt(d.totalPnl), sub: 'vs. prior close', up: d.totalPnl >= 0 },
  ];
  if (user.level === 'firm')   return [{ label: 'Accounts', value: String(d.accts.length), sub: 'across all branches', up: undefined }, ...base];
  if (user.level === 'branch') return [{ label: 'Accounts', value: String(d.accts.length), sub: 'in this branch',       up: undefined }, ...base];
  if (user.level === 'csr')    return [{ label: 'Accounts', value: String(d.accts.length), sub: 'assigned to you',      up: undefined }, ...base];
  return base;
}
