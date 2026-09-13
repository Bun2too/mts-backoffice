import { useState } from 'react';
import type { User, Balance, UserLevel } from '../types';
import { canEditData } from '../types';
import { scopedBalances, scopedAccounts, MOCK_BRANCHES } from '../data/mockData';
import { fmt, PnlCell, TH, TD, SectionHeader, GroupBySelect, Toast, ReadOnlyBanner } from './shared';

type GroupBy = 'none' | 'branch';

const GROUP_OPTIONS: Record<UserLevel, { value: GroupBy; label: string }[]> = {
  firm:    [{ value: 'branch', label: 'By Branch' }, { value: 'none', label: 'All Flat' }],
  branch:  [{ value: 'none', label: 'All Flat' }],
  csr:     [{ value: 'none', label: 'All Flat' }],
  account: [{ value: 'none', label: 'All Flat' }],
};

interface EditModalProps { bal: Balance; onClose: () => void; onSave: (b: Balance) => void; }

function EditModal({ bal, onClose, onSave }: EditModalProps) {
  const [draft, setDraft] = useState({ ...bal });
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, width: '100%', maxWidth: 540 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-jetbrains)', marginBottom: 2 }}>{bal.accountId}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{bal.accountName}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {([
            { key: 'cashBalance',        label: 'Cash Balance' },
            { key: 'marginBalance',       label: 'Margin Balance' },
            { key: 'buyingPower',         label: 'Buying Power' },
            { key: 'marginAvailable',     label: 'Margin Available' },
            { key: 'pendingDeposits',     label: 'Pending Deposits' },
            { key: 'pendingWithdrawals',  label: 'Pending Withdrawals' },
          ] as { key: keyof Balance; label: string }[]).map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{f.label}</label>
              <input type="number" step="0.01" value={draft[f.key] as number} onChange={e => setDraft(d => ({ ...d, [f.key]: Number(e.target.value) }))} />
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(draft)}>Save Balance</button>
        </div>
      </div>
    </div>
  );
}

interface Props { user: User }

export default function BalancesView({ user }: Props) {
  const [balances, setBalances] = useState<Balance[]>(scopedBalances(user));
  const [groupBy, setGroupBy] = useState<GroupBy>(GROUP_OPTIONS[user.level][0].value);
  const [filterBranch, setFilterBranch] = useState('all');
  const [selected, setSelected] = useState<Balance | null>(null);
  const [toast, setToast] = useState('');
  const editable = canEditData(user.level);

  const filtered = balances.filter(b => filterBranch === 'all' || b.branchId === filterBranch);

  const totalCash = filtered.reduce((s, b) => s + b.cashBalance, 0);
  const totalPortfolio = filtered.reduce((s, b) => s + b.portfolioValue, 0);
  const totalEquity = filtered.reduce((s, b) => s + b.totalEquity, 0);
  const totalDayPnl = filtered.reduce((s, b) => s + b.dayPnl, 0);

  const handleSave = (updated: Balance) => {
    setBalances(bs => bs.map(b => b.accountId === updated.accountId ? updated : b));
    setSelected(null);
    setToast(`Balance for ${updated.accountName} updated.`);
    setTimeout(() => setToast(''), 3000);
  };

  const branches = MOCK_BRANCHES.filter(b => balances.some(bal => bal.branchId === b.id));

  const groups: { key: string; label: string; rows: Balance[] }[] =
    groupBy === 'branch'
      ? Array.from(new Set(filtered.map(b => b.branchId))).map(bid => ({
          key: bid,
          label: MOCK_BRANCHES.find(b => b.id === bid)?.name ?? bid,
          rows: filtered.filter(b => b.branchId === bid),
        }))
      : [{ key: 'all', label: '', rows: filtered }];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
        <SectionHeader title="Balances" sub={`${filtered.length} accounts`} />
        {!editable && <ReadOnlyBanner />}

        {/* Aggregate tiles */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Cash',      value: fmt(totalCash),      plain: true },
            { label: 'Portfolio Value', value: fmt(totalPortfolio),  plain: true },
            { label: 'Total Equity',    value: fmt(totalEquity),     plain: true },
            { label: "Day P&L",         value: (totalDayPnl >= 0 ? '+' : '') + fmt(totalDayPnl), pos: totalDayPnl >= 0 },
          ].map(t => (
            <div key={t.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 3, padding: '8px 14px', minWidth: 160 }}>
              <div style={{ fontSize: '0.58rem', color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-jetbrains)', marginBottom: 4 }}>{t.label}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-jetbrains)', color: t.plain ? 'var(--foreground)' : t.pos ? 'var(--gain)' : 'var(--loss)' }}>{t.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
          {user.level === 'firm' && (
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
              <option value="all">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          {user.level === 'firm' && (
            <GroupBySelect label="Group:" value={groupBy} options={GROUP_OPTIONS[user.level]} onChange={v => setGroupBy(v as GroupBy)} />
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
        {groups.map(group => (
          <div key={group.key} style={{ marginBottom: groupBy !== 'none' ? 20 : 0 }}>
            {groupBy !== 'none' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0 6px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--foreground)' }}>{group.label}</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-jetbrains)', fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>
                  {group.rows.length} accounts · {fmt(group.rows.reduce((s, r) => s + r.totalEquity, 0))} equity
                </span>
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              {(groupBy === 'none' || group === groups[0]) && (
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <TH>Account</TH>
                    {user.level === 'firm' && <TH>Branch</TH>}
                    <TH right>Cash Balance</TH>
                    <TH right>Portfolio Value</TH>
                    <TH right>Total Equity</TH>
                    <TH right>Buying Power</TH>
                    <TH right>Margin Used</TH>
                    <TH right>Pending Dep.</TH>
                    <TH right>Pending W/D</TH>
                    <TH right>Day P&L</TH>
                    {editable && <TH></TH>}
                  </tr>
                </thead>
              )}
              <tbody>
                {group.rows.map(b => (
                  <tr key={b.accountId} className="table-row-hover" style={{ borderBottom: '1px solid rgba(30,45,74,0.4)' }}
                    onClick={() => editable && setSelected(b)}>
                    <TD>
                      <div style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--foreground)' }}>{b.accountName}</div>
                      <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.58rem', color: 'var(--muted-foreground)' }}>{b.accountId}</div>
                    </TD>
                    {user.level === 'firm' && (
                      <TD><span style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)' }}>{b.branchName}</span></TD>
                    )}
                    <TD right><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.72rem' }}>{fmt(b.cashBalance)}</span></TD>
                    <TD right><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.72rem' }}>{fmt(b.portfolioValue)}</span></TD>
                    <TD right><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.72rem', fontWeight: 600 }}>{fmt(b.totalEquity)}</span></TD>
                    <TD right><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.72rem', color: 'var(--accent)' }}>{fmt(b.buyingPower)}</span></TD>
                    <TD right><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.72rem', color: 'var(--warn)' }}>{fmt(b.marginUsed)}</span></TD>
                    <TD right><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.72rem', color: 'var(--gain)' }}>{fmt(b.pendingDeposits)}</span></TD>
                    <TD right><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.72rem', color: 'var(--loss)' }}>{fmt(b.pendingWithdrawals)}</span></TD>
                    <TD right><PnlCell value={b.dayPnl} pct={b.dayPnlPct} /></TD>
                    {editable && (
                      <TD>
                        <button onClick={e => { e.stopPropagation(); setSelected(b); }} className="btn-secondary" style={{ padding: '3px 10px', fontSize: '0.65rem' }}>Edit</button>
                      </TD>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {selected && editable && <EditModal bal={selected} onClose={() => setSelected(null)} onSave={handleSave} />}
      <Toast message={toast} />
    </div>
  );
}
