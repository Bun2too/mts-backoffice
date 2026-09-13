import { useState } from 'react';
import type { AccountRecord, User, UserLevel } from '../types';
import { MOCK_ACCOUNTS, MOCK_BRANCHES, MOCK_REPS, scopedAccounts } from '../data/mockData';
import { fmt, StatusBadge, PnlCell, TH, TD, SectionHeader, Toast } from './shared';

const ACCOUNT_TYPES = ['individual', 'joint', 'trust', 'ira', 'corporate'] as const;

interface ModalProps {
  account: AccountRecord | null;
  isNew: boolean;
  userLevel: UserLevel;
  onClose: () => void;
  onSave: (a: AccountRecord) => void;
  onDelete?: (id: string) => void;
}

const EMPTY: AccountRecord = {
  id: '', firmId: 'FIRM-001', branchId: 'BRN-NYC01', branchName: 'New York — Midtown',
  repId: 'REP-001', repName: 'Sofia Nakamura', ownerName: '', email: '', phone: '',
  type: 'individual', status: 'active', openedAt: new Date().toISOString().split('T')[0],
  cashBalance: 0, portfolioValue: 0, totalValue: 0, dayPnl: 0, dayPnlPct: 0,
};

function AccountModal({ account, isNew, userLevel, onClose, onSave, onDelete }: ModalProps) {
  const [draft, setDraft] = useState<AccountRecord>(
    isNew ? { ...EMPTY, id: `ACC-${Date.now().toString().slice(-5)}` } : { ...account! }
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const canManage = userLevel === 'firm';

  const f = (key: keyof AccountRecord) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft(d => ({ ...d, [key]: e.target.value }));

  const handleBranchChange = (branchId: string) => {
    const br = MOCK_BRANCHES.find(b => b.id === branchId);
    setDraft(d => ({ ...d, branchId, branchName: br?.name ?? '' }));
  };

  const handleRepChange = (repId: string) => {
    const rep = MOCK_REPS.find(r => r.id === repId);
    setDraft(d => ({ ...d, repId, repName: rep?.name ?? '' }));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{isNew ? 'New Account' : 'Edit Account'}</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '18px 20px' }}>
          {/* Identification */}
          <div style={{ marginBottom: 16 }}>
            <SectionLabel>Identification</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Account ID">
                <input value={draft.id} onChange={f('id')} disabled={!isNew} style={!isNew ? { opacity: 0.5 } : {}} />
              </Field>
              <Field label="Owner Name">
                <input value={draft.ownerName} onChange={f('ownerName')} />
              </Field>
              <Field label="Email">
                <input type="email" value={draft.email} onChange={f('email')} />
              </Field>
              <Field label="Phone">
                <input type="tel" value={draft.phone} onChange={f('phone')} />
              </Field>
              <Field label="Account Type">
                <select value={draft.type} onChange={f('type')}>
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={draft.status} onChange={f('status')}>
                  {['active','suspended','pending','closed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Hierarchy — only firm can change branch/rep */}
          <div style={{ marginBottom: 16 }}>
            <SectionLabel>Hierarchy Assignment</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Branch">
                {canManage ? (
                  <select value={draft.branchId} onChange={e => handleBranchChange(e.target.value)}>
                    {MOCK_BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                ) : (
                  <input value={draft.branchName} disabled style={{ opacity: 0.5 }} />
                )}
              </Field>
              <Field label="Assigned Rep">
                {canManage ? (
                  <select value={draft.repId} onChange={e => handleRepChange(e.target.value)}>
                    {MOCK_REPS.filter(r => r.branchId === draft.branchId || true).map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.branchName})</option>
                    ))}
                  </select>
                ) : (
                  <input value={draft.repName} disabled style={{ opacity: 0.5 }} />
                )}
              </Field>
            </div>
            {!canManage && (
              <p style={{ fontSize: '0.62rem', color: 'var(--muted-foreground)', marginTop: 8, fontFamily: 'var(--font-jetbrains)' }}>
                Branch and rep assignment is managed by firm administrators.
              </p>
            )}
          </div>
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          {canManage && !isNew && !confirmDelete && (
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
          )}
          {confirmDelete && (
            <>
              <span style={{ fontSize: '0.72rem', color: 'var(--loss)', alignSelf: 'center' }}>Confirm delete?</span>
              <button className="btn-danger" onClick={() => onDelete?.(draft.id)}>Yes, Delete</button>
              <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={() => onSave(draft)}>
              {isNew ? 'Create Account' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>{children}</div>;
}

interface Props { user: User }

export default function AccountManagementView({ user }: Props) {
  const [accounts, setAccounts] = useState<AccountRecord[]>(scopedAccounts(user));
  const [modal, setModal] = useState<{ account: AccountRecord | null; isNew: boolean } | null>(null);
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const isFirm = user.level === 'firm';

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const filtered = accounts.filter(a => {
    if (filterBranch !== 'all' && a.branchId !== filterBranch) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.id.toLowerCase().includes(q) || a.ownerName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    }
    return true;
  });

  const totalValue = filtered.reduce((s, a) => s + a.totalValue, 0);

  const handleSave = (a: AccountRecord) => {
    setAccounts(as => as.some(x => x.id === a.id) ? as.map(x => x.id === a.id ? a : x) : [...as, a]);
    setModal(null);
    showToast(modal?.isNew ? `Account ${a.id} created.` : `Account ${a.id} updated.`);
  };

  const handleDelete = (id: string) => {
    setAccounts(as => as.filter(a => a.id !== id));
    setModal(null);
    showToast('Account deleted.');
  };

  const branches = MOCK_BRANCHES.filter(b => accounts.some(a => a.branchId === b.id));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <SectionHeader title="Accounts" sub={`${filtered.length} accounts · ${fmt(totalValue)} AUM`} />
          {isFirm && (
            <button className="btn-primary" onClick={() => setModal({ account: null, isNew: true })} style={{ flexShrink: 0 }}>
              + New Account
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ID, name, email…" style={{ flex: '1 1 180px', maxWidth: 260 }} />
          {isFirm && (
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
              <option value="all">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
            <option value="all">All Statuses</option>
            {['active','suspended','pending','closed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <TH>Account</TH>
              <TH>Type</TH>
              {isFirm && <TH>Branch</TH>}
              <TH>Rep</TH>
              <TH right>Cash</TH>
              <TH right>Portfolio</TH>
              <TH right>Total Value</TH>
              <TH right>Day P&L</TH>
              <TH>Status</TH>
              <TH>Opened</TH>
              <TH></TH>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(30,45,74,0.4)' }}
                onClick={() => setModal({ account: a, isNew: false })}>
                <TD>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)' }}>{a.ownerName}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.6rem', color: 'var(--accent)' }}>{a.id}</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)' }}>{a.email}</span>
                  </div>
                </TD>
                <TD><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)' }}>{a.type}</span></TD>
                {isFirm && <TD><span style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)' }}>{a.branchName}</span></TD>}
                <TD><span style={{ fontSize: '0.7rem' }}>{a.repName}</span></TD>
                <TD right><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.7rem' }}>{fmt(a.cashBalance)}</span></TD>
                <TD right><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.7rem' }}>{fmt(a.portfolioValue)}</span></TD>
                <TD right><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.72rem', fontWeight: 600 }}>{fmt(a.totalValue)}</span></TD>
                <TD right><PnlCell value={a.dayPnl} pct={a.dayPnlPct} /></TD>
                <TD><StatusBadge status={a.status} /></TD>
                <TD><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.62rem', color: 'var(--muted-foreground)' }}>{a.openedAt}</span></TD>
                <TD>
                  <button onClick={e => { e.stopPropagation(); setModal({ account: a, isNew: false }); }} className="btn-secondary" style={{ padding: '3px 10px', fontSize: '0.65rem' }}>
                    {isFirm ? 'Edit' : 'View'}
                  </button>
                </TD>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={12} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.78rem' }}>No accounts match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <AccountModal
          account={modal.account} isNew={modal.isNew} userLevel={user.level}
          onClose={() => setModal(null)} onSave={handleSave} onDelete={handleDelete}
        />
      )}
      <Toast message={toast} />
    </div>
  );
}
