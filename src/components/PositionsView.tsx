import { useState } from 'react';
import type { User, Position, UserLevel } from '../types';
import { useScopedData } from '../context/DataContext';
import { fmt, fmtPct, StatusBadge, TH, TD, SectionHeader, GroupBySelect, PnlCell } from './shared';

type GroupBy = 'none' | 'branch' | 'account';

const GROUP_OPTIONS: Record<UserLevel, { value: GroupBy; label: string }[]> = {
  firm:    [{ value: 'branch', label: 'By Branch' }, { value: 'account', label: 'By Account' }, { value: 'none', label: 'All Flat' }],
  branch:  [{ value: 'account', label: 'By Account' }, { value: 'none', label: 'All Flat' }],
  csr:     [{ value: 'account', label: 'By Account' }, { value: 'none', label: 'All Flat' }],
  account: [{ value: 'none', label: 'All Flat' }],
};

interface Props { user: User }

export default function PositionsView({ user }: Props) {
  const { scopedPositions, scopedAccounts, branches: MOCK_BRANCHES } = useScopedData();
  const positions = scopedPositions(user);
  const [groupBy, setGroupBy] = useState<GroupBy>(GROUP_OPTIONS[user.level][0].value);
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [search, setSearch] = useState('');

  const accounts = scopedAccounts(user);
  const branches = user.level === 'firm' ? MOCK_BRANCHES : [];

  const filtered = positions.filter(p => {
    if (filterBranch !== 'all' && p.branchId !== filterBranch) return false;
    if (filterAccount !== 'all' && p.accountId !== filterAccount) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.symbol.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  const totalMV = filtered.reduce((s, p) => s + p.marketValue, 0);
  const totalPnl = filtered.reduce((s, p) => s + p.unrealizedPnl, 0);


  // Group the rows
  const groups: { key: string; label: string; sub?: string; rows: Position[] }[] = [];
  if (groupBy === 'branch') {
    const byBranch = new Map<string, Position[]>();
    filtered.forEach(p => { if (!byBranch.has(p.branchId)) byBranch.set(p.branchId, []); byBranch.get(p.branchId)!.push(p); });
    byBranch.forEach((rows, bid) => {
      const br = MOCK_BRANCHES.find(b => b.id === bid);
      groups.push({ key: bid, label: br?.name ?? bid, rows });
    });
  } else if (groupBy === 'account') {
    const byAcct = new Map<string, Position[]>();
    filtered.forEach(p => { if (!byAcct.has(p.accountId)) byAcct.set(p.accountId, []); byAcct.get(p.accountId)!.push(p); });
    byAcct.forEach((rows, aid) => {
      const acct = accounts.find(a => a.id === aid);
      groups.push({ key: aid, label: acct?.ownerName ?? aid, sub: aid, rows });
    });
  } else {
    groups.push({ key: 'all', label: '', rows: filtered });
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
        <SectionHeader title="Positions" sub={`${filtered.length} holdings · MV ${fmt(totalMV)}`} />
        <p className="demo-note">Calculated from demo transactions. Firm and branch users can make adjustments in Transactions.</p>

        {/* Summary tiles */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { label: 'Market Value', value: fmt(totalMV), plain: true },
            { label: 'Unrealized P&L', value: (totalPnl >= 0 ? '+' : '') + fmt(totalPnl), pos: totalPnl >= 0 },
            { label: 'Positions', value: String(filtered.length), plain: true },
          ].map(t => (
            <div key={t.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 3, padding: '8px 14px', minWidth: 140 }}>
              <div style={{ fontSize: '0.58rem', color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-jetbrains)', marginBottom: 4 }}>{t.label}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-jetbrains)', color: t.plain ? 'var(--foreground)' : t.pos ? 'var(--gain)' : 'var(--loss)' }}>{t.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Symbol or name…" style={{ flex: '1 1 160px', maxWidth: 220 }} />
          {user.level === 'firm' && (
            <select value={filterBranch} onChange={e => { setFilterBranch(e.target.value); setFilterAccount('all'); }} style={{ width: 'auto', minWidth: 160 }}>
              <option value="all">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          {user.level !== 'account' && (
            <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)} style={{ width: 'auto', minWidth: 180 }}>
              <option value="all">All Accounts</option>
              {accounts.filter(a => filterBranch === 'all' || a.branchId === filterBranch).map(a => (
                <option key={a.id} value={a.id}>{a.id} — {a.ownerName}</option>
              ))}
            </select>
          )}
          <GroupBySelect label="Group:" value={groupBy} options={GROUP_OPTIONS[user.level]} onChange={v => setGroupBy(v as GroupBy)} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
        {groups.map(group => (
          <div key={group.key} style={{ marginBottom: groupBy !== 'none' ? 20 : 0 }}>
            {groupBy !== 'none' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0 6px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--foreground)' }}>{group.label}</span>
                {group.sub && <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.6rem', color: 'var(--muted-foreground)' }}>{group.sub}</span>}
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-jetbrains)', fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>
                  {group.rows.length} positions · {fmt(group.rows.reduce((s, r) => s + r.marketValue, 0))}
                </span>
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              {(groupBy === 'none' || group === groups[0]) && (
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <TH>Symbol</TH>
                    <TH>Description</TH>
                    {user.level !== 'account' && <TH>Account</TH>}
                    <TH right>Qty</TH>
                    <TH right>Avg Cost</TH>
                    <TH right>Price</TH>
                    <TH right>Mkt Value</TH>
                    <TH right>Unrealized P&L</TH>
                    <TH right>Day Chg</TH>
                    <TH>Class</TH>
                  </tr>
                </thead>
              )}
              <tbody>
                {group.rows.map(p => (
                  <tr key={p.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(30,45,74,0.4)' }}>
                    <TD><span style={{ fontFamily: 'var(--font-jetbrains)', fontWeight: 700, fontSize: '0.78rem', color: 'var(--accent)' }}>{p.symbol}</span></TD>
                    <TD><span style={{ fontSize: '0.73rem', color: 'var(--foreground)' }}>{p.description}</span></TD>
                    {user.level !== 'account' && (
                      <TD>
                        <div style={{ fontSize: '0.65rem', color: 'var(--foreground)' }}>{p.accountName}</div>
                        <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.58rem', color: 'var(--muted-foreground)' }}>{p.accountId}</div>
                      </TD>
                    )}
                    <TD right><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.72rem' }}>{p.quantity.toLocaleString()}</span></TD>
                    <TD right><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{fmt(p.avgCost)}</span></TD>
                    <TD right><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.72rem' }}>{fmt(p.currentPrice)}</span></TD>
                    <TD right><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.72rem', fontWeight: 600 }}>{fmt(p.marketValue)}</span></TD>
                    <TD right><PnlCell value={p.unrealizedPnl} pct={p.unrealizedPnlPct} /></TD>
                    <TD right><PnlCell value={p.dayChange} pct={p.dayChangePct} /></TD>
                    <TD><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)' }}>{p.assetClass.replace('_', ' ')}</span></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.78rem' }}>No positions match the current filters.</div>
        )}
      </div>
    </div>
  );
}
