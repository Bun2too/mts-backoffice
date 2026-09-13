import { useState } from 'react';
import type { User, Position, UserLevel } from '../types';
import { canEditData } from '../types';
import { scopedPositions, scopedAccounts, MOCK_BRANCHES } from '../data/mockData';
import { fmt, fmtPct, StatusBadge, TH, TD, SectionHeader, GroupBySelect, Toast, ReadOnlyBanner, PnlCell } from './shared';

interface EditModalProps {
  pos: Position;
  onClose: () => void;
  onSave: (p: Position) => void;
}

function EditModal({ pos, onClose, onSave }: EditModalProps) {
  const [draft, setDraft] = useState({ ...pos });
  const marketValue = draft.quantity * draft.currentPrice;
  const unrealizedPnl = (draft.currentPrice - draft.avgCost) * draft.quantity;
  const unrealizedPnlPct = draft.avgCost > 0 ? ((draft.currentPrice - draft.avgCost) / draft.avgCost) * 100 : 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, width: '100%', maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)' }}>{pos.symbol}</span>
            <span style={{ marginLeft: 10, fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{pos.description}</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { label: 'Account', value: draft.accountName, readOnly: true },
            { label: 'Asset Class', value: draft.assetClass, readOnly: true },
          ].map(f => (
            <div key={f.label}>
              <Label>{f.label}</Label>
              <input value={f.value} disabled style={{ marginTop: 6, opacity: 0.5 }} />
            </div>
          ))}
          <div>
            <Label>Quantity</Label>
            <input type="number" value={draft.quantity} onChange={e => setDraft(d => ({ ...d, quantity: Number(e.target.value) }))} style={{ marginTop: 6 }} />
          </div>
          <div>
            <Label>Avg Cost</Label>
            <input type="number" step="0.01" value={draft.avgCost} onChange={e => setDraft(d => ({ ...d, avgCost: Number(e.target.value) }))} style={{ marginTop: 6 }} />
          </div>
          <div>
            <Label>Current Price</Label>
            <input type="number" step="0.01" value={draft.currentPrice} onChange={e => setDraft(d => ({ ...d, currentPrice: Number(e.target.value) }))} style={{ marginTop: 6 }} />
          </div>
          <div>
            <Label>Market Value (calculated)</Label>
            <input value={fmt(marketValue)} disabled style={{ marginTop: 6, opacity: 0.5, fontFamily: 'var(--font-jetbrains)' }} />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <Label>Unrealized P&amp;L</Label>
              <div style={{ marginTop: 8, fontFamily: 'var(--font-jetbrains)', fontSize: '0.85rem', fontWeight: 600, color: unrealizedPnl >= 0 ? 'var(--gain)' : 'var(--loss)' }}>
                {unrealizedPnl >= 0 ? '+' : ''}{fmt(unrealizedPnl)} ({fmtPct(unrealizedPnlPct)})
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave({ ...draft, marketValue, unrealizedPnl, unrealizedPnlPct })}>Save Position</button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{children}</label>;
}

type GroupBy = 'none' | 'branch' | 'account';

const GROUP_OPTIONS: Record<UserLevel, { value: GroupBy; label: string }[]> = {
  firm:    [{ value: 'branch', label: 'By Branch' }, { value: 'account', label: 'By Account' }, { value: 'none', label: 'All Flat' }],
  branch:  [{ value: 'account', label: 'By Account' }, { value: 'none', label: 'All Flat' }],
  csr:     [{ value: 'account', label: 'By Account' }, { value: 'none', label: 'All Flat' }],
  account: [{ value: 'none', label: 'All Flat' }],
};

interface Props { user: User }

export default function PositionsView({ user }: Props) {
  const [positions, setPositions] = useState<Position[]>(scopedPositions(user));
  const [groupBy, setGroupBy] = useState<GroupBy>(GROUP_OPTIONS[user.level][0].value);
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Position | null>(null);
  const [toast, setToast] = useState('');
  const editable = canEditData(user.level);

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

  const handleSave = (updated: Position) => {
    setPositions(ps => ps.map(p => p.id === updated.id ? updated : p));
    setSelected(null);
    setToast(`${updated.symbol} position updated.`);
    setTimeout(() => setToast(''), 3000);
  };

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
        {!editable && <ReadOnlyBanner />}

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
                    {editable && <TH></TH>}
                  </tr>
                </thead>
              )}
              <tbody>
                {group.rows.map(p => (
                  <tr key={p.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(30,45,74,0.4)' }}
                    onClick={() => editable && setSelected(p)}>
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
                    {editable && (
                      <TD>
                        <button onClick={e => { e.stopPropagation(); setSelected(p); }} className="btn-secondary" style={{ padding: '3px 10px', fontSize: '0.65rem' }}>Edit</button>
                      </TD>
                    )}
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

      {selected && editable && <EditModal pos={selected} onClose={() => setSelected(null)} onSave={handleSave} />}
      <Toast message={toast} />
    </div>
  );
}
