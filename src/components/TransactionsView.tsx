import { useState } from 'react';
import type { User, Transaction, TxType, TxStatus } from '../types';
import { canEditData } from '../types';
import { scopedTransactions, scopedAccounts, MOCK_BRANCHES } from '../data/mockData';
import { fmt, TX_STATUS_CLASS, SectionHeader, Toast, ReadOnlyBanner } from './shared';

interface EditModalProps {
  tx: Transaction;
  editable: boolean;
  onClose: () => void;
  onSave: (tx: Transaction) => void;
  onCancel: (id: string) => void;
  onRebill: (id: string) => void;
}

function EditModal({ tx, editable, onClose, onSave, onCancel, onRebill }: EditModalProps) {
  const [draft, setDraft] = useState({ ...tx });
  const canAction = editable;
  const canEdit   = canAction && (tx.status === 'pending' || tx.status === 'failed');
  const canCancel = canAction && (tx.status === 'pending' || tx.status === 'settled');
  const canRebill = canAction && (tx.status === 'cancelled' || tx.status === 'failed');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.65rem', color: 'var(--accent)', marginBottom: 2 }}>{tx.id}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{tx.description}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className={`badge ${TX_STATUS_CLASS[tx.status]}`}>{tx.status}</span>
            {!editable && <span className="badge badge-amber">View Only</span>}
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', fontSize: '1.1rem', cursor: 'pointer', marginLeft: 4 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            {[
              { l: 'Type',   v: draft.type },
              { l: 'Action', v: draft.action },
              ...(draft.symbol ? [{ l: 'Symbol', v: draft.symbol }] : []),
            ].map(f => (
              <div key={f.l}>
                <div style={{ fontSize: '0.58rem', color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-jetbrains)', marginBottom: 3 }}>{f.l}</div>
                <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--foreground)', textTransform: 'uppercase' }}>{f.v}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Account"><input value={draft.accountName} onChange={e => setDraft(d => ({ ...d, accountName: e.target.value }))} disabled={!canEdit} style={!canEdit ? { opacity: 0.5 } : {}} /></Field>
            <Field label="Account ID"><input value={draft.accountId} disabled style={{ opacity: 0.5 }} /></Field>
            {draft.quantity !== undefined && <Field label="Quantity"><input type="number" value={draft.quantity} onChange={e => setDraft(d => ({ ...d, quantity: Number(e.target.value) }))} disabled={!canEdit} style={!canEdit ? { opacity: 0.5 } : {}} /></Field>}
            {draft.price !== undefined && <Field label="Price"><input type="number" step="0.01" value={draft.price} onChange={e => setDraft(d => ({ ...d, price: Number(e.target.value) }))} disabled={!canEdit} style={!canEdit ? { opacity: 0.5 } : {}} /></Field>}
            <Field label="Amount"><input type="number" step="0.01" value={draft.amount} onChange={e => setDraft(d => ({ ...d, amount: Number(e.target.value) }))} disabled={!canEdit} style={!canEdit ? { opacity: 0.5 } : {}} /></Field>
            <Field label="Trade Date"><input type="date" value={draft.tradeDate} onChange={e => setDraft(d => ({ ...d, tradeDate: e.target.value }))} disabled={!canEdit} style={!canEdit ? { opacity: 0.5 } : {}} /></Field>
            <Field label="Settle Date"><input type="date" value={draft.settleDate} onChange={e => setDraft(d => ({ ...d, settleDate: e.target.value }))} disabled={!canEdit} style={!canEdit ? { opacity: 0.5 } : {}} /></Field>
            <Field label="CSR"><input value={draft.csrName} disabled style={{ opacity: 0.5 }} /></Field>
            <Field label="Notes" style={{ gridColumn: '1 / -1' }}>
              <textarea value={draft.notes ?? ''} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} rows={2} disabled={!canEdit} style={!canEdit ? { opacity: 0.5, resize: 'none' } : { resize: 'vertical' }} />
            </Field>
          </div>
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {canRebill && <button className="btn-warn" onClick={() => onRebill(tx.id)}>Rebill</button>}
          {canCancel && <button className="btn-danger" onClick={() => onCancel(tx.id)}>Cancel Transaction</button>}
          {canEdit   && <button className="btn-primary" onClick={() => onSave(draft)}>Save Changes</button>}
          {!canEdit && !canCancel && !canRebill && editable && (
            <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', alignSelf: 'center' }}>No actions for this status.</span>
          )}
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

interface Props { user: User }

export default function TransactionsView({ user }: Props) {
  const [txns, setTxns]             = useState<Transaction[]>(scopedTransactions(user));
  const [filterType, setFilterType] = useState<TxType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TxStatus | 'all'>('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterBranch, setFilterBranch]   = useState('all');
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState<Transaction | null>(null);
  const [toast, setToast]           = useState('');
  const editable = canEditData(user.level);

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

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSave   = (u: Transaction) => { setTxns(ts => ts.map(t => t.id === u.id ? u : t)); setSelected(null); showToast(`${u.id} saved.`); };
  const handleCancel = (id: string)     => { setTxns(ts => ts.map(t => t.id === id ? { ...t, status: 'cancelled' } : t)); setSelected(null); showToast(`${id} cancelled.`); };
  const handleRebill = (id: string)     => { setTxns(ts => ts.map(t => t.id === id ? { ...t, status: 'rebilled' } : t)); setSelected(null); showToast(`${id} rebilled.`); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
        <SectionHeader title="Transactions" sub={`${filtered.length} records`} />
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

      {selected && (
        <EditModal tx={selected} editable={editable} onClose={() => setSelected(null)} onSave={handleSave} onCancel={handleCancel} onRebill={handleRebill} />
      )}
      <Toast message={toast} />
    </div>
  );
}
