import { useState } from 'react';
import type { User, Transaction, TxType, TxStatus } from '../types';
import { useScopedData } from '../context/DataContext';
import TransactionEditor from './TransactionEditor';
import { fmt, TX_STATUS_CLASS, SectionHeader, ReadOnlyBanner } from './shared';

interface Props { user: User }

export default function TransactionsView({ user }: Props) {
  const { scopedTransactions, scopedAccounts, branches: MOCK_BRANCHES } = useScopedData();
  const txns = scopedTransactions(user);
  const [creating, setCreating] = useState(false);
  const [filterType, setFilterType] = useState<TxType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TxStatus | 'all'>('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterBranch, setFilterBranch]   = useState('all');
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState<Transaction | null>(null);
  const editable = ['firm', 'branch'].includes(user.level);

  const accounts = scopedAccounts(user);

  const filtered = txns.filter(t => {
    if (filterType    !== 'all' && t.type      !== filterType)    return false;
    if (filterStatus  !== 'all' && t.status    !== filterStatus)  return false;
    if (filterAccount !== 'all' && t.accountId !== filterAccount) return false;
    if (filterBranch  !== 'all' && t.branchId  !== filterBranch)  return false;
    if (search) {
      const q = search.toLowerCase();
      return t.id.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.symbol ?? '').toLowerCase().includes(q) || t.accountId.toLowerCase().includes(q);
    }
    return true;
  });



  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
        <div className="view-heading"><SectionHeader title="Transactions" sub={`${filtered.length} records`} />{editable && <button className="btn-primary" disabled={!accounts.length} onClick={() => setCreating(true)}>+ New Transaction</button>}</div>
        <p className="demo-note">Settled edits recalculate account balances and positions. Changes are saved in this browser.</p>
        {!editable && <ReadOnlyBanner />}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ID, symbol, description…" style={{ flex: '1 1 180px', maxWidth: 260 }} />
          {user.level === 'firm' && (
            <select value={filterBranch} onChange={e => { setFilterBranch(e.target.value); setFilterAccount('all'); }} style={{ width: 'auto', minWidth: 160 }}>
              <option value="all">All Branches</option>
              {MOCK_BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
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
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} style={{ width: 'auto', minWidth: 140 }}>
            <option value="all">All Statuses</option>
            {['settled','pending','cancelled','rebilled','failed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        {/* Type tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {(['all', 'trade', 'cash', 'stock'] as const).map(t => (
            <button key={t} onClick={() => setFilterType(t)} style={{
              padding: '7px 16px', border: 'none',
              borderBottom: filterType === t ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'transparent', color: filterType === t ? 'var(--foreground)' : 'var(--muted-foreground)',
              fontSize: '0.74rem', fontWeight: filterType === t ? 600 : 400,
              cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s',
            }}>{t === 'all' ? 'All' : t}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--background)', zIndex: 10 }}>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Tx ID','Type','Description','Symbol','Qty','Price','Amount','Trade Date','Status',
                ...(user.level !== 'account' ? ['Account'] : []),
                ...(user.level === 'firm' ? ['Branch'] : []),
                'CSR'].map(h => (
                <th key={h} style={{ padding: '9px 10px', textAlign: h === 'Qty' || h === 'Price' || h === 'Amount' ? 'right' : 'left', fontSize: '0.58rem', color: 'var(--muted-foreground)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="table-row-hover" onClick={() => setSelected(t)} style={{ borderBottom: '1px solid rgba(30,45,74,0.4)' }}>
                <td style={{ padding: '8px 10px', fontFamily: 'var(--font-jetbrains)', fontSize: '0.62rem', color: 'var(--accent)', whiteSpace: 'nowrap' }}>{t.id}</td>
                <td style={{ padding: '8px 10px', fontFamily: 'var(--font-jetbrains)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>{t.type}</td>
                <td style={{ padding: '8px 10px', fontSize: '0.72rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                <td style={{ padding: '8px 10px', fontFamily: 'var(--font-jetbrains)', fontSize: '0.72rem', fontWeight: 600 }}>{t.symbol ?? '—'}</td>
                <td style={{ padding: '8px 10px', fontFamily: 'var(--font-jetbrains)', fontSize: '0.7rem', color: 'var(--muted-foreground)', textAlign: 'right' }}>{t.quantity?.toLocaleString() ?? '—'}</td>
                <td style={{ padding: '8px 10px', fontFamily: 'var(--font-jetbrains)', fontSize: '0.7rem', color: 'var(--muted-foreground)', textAlign: 'right' }}>{t.price ? fmt(t.price) : '—'}</td>
                <td style={{ padding: '8px 10px', fontFamily: 'var(--font-jetbrains)', fontSize: '0.72rem', fontWeight: 600, textAlign: 'right', color: (t.action === 'sell' || t.action === 'withdrawal') ? 'var(--loss)' : 'var(--gain)', whiteSpace: 'nowrap' }}>
                  {(t.action === 'sell' || t.action === 'withdrawal') ? '−' : '+'}{fmt(t.amount)}
                </td>
                <td style={{ padding: '8px 10px', fontFamily: 'var(--font-jetbrains)', fontSize: '0.62rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{t.tradeDate}</td>
                <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}><span className={`badge ${TX_STATUS_CLASS[t.status]}`}>{t.status}</span></td>
                {user.level !== 'account' && (
                  <td style={{ padding: '8px 10px', fontSize: '0.65rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                    <div>{t.accountId}</div>
                    <div style={{ fontSize: '0.58rem' }}>{t.accountName}</div>
                  </td>
                )}
                {user.level === 'firm' && (
                  <td style={{ padding: '8px 10px', fontSize: '0.62rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{t.branchId}</td>
                )}
                <td style={{ padding: '8px 10px', fontSize: '0.68rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{t.csrName}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={12} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.78rem' }}>No transactions match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(selected || creating) && <TransactionEditor transaction={selected} user={user} onClose={() => { setSelected(null); setCreating(false); }} />}
    </div>
  );
}
