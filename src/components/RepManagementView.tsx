import { useState } from 'react';
import type { Rep } from '../types';
import { useData } from '../context/DataContext';
import { StatusBadge, TH, TD, Toast } from './shared';

interface RepModalProps {
  rep: Rep | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (r: Rep) => void;
  onDelete?: (id: string) => void;
}

const EMPTY_REP: Rep = {
  id: '', firmId: 'FIRM-001', branchId: '', branchName: '',
  name: '', email: '', phone: '', status: 'active', accountCount: 0, assignedAccountIds: [],
};

function RepModal({ rep, isNew, onClose, onSave, onDelete }: RepModalProps) {
  const { branches, accounts } = useData();
  const [draft, setDraft] = useState<Rep>(
    isNew ? { ...EMPTY_REP, id: `REP-${crypto.randomUUID()}` } : { ...rep! }
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleBranchChange = (branchId: string) => {
    const br = branches.find(b => b.id === branchId);
    setDraft(d => ({ ...d, branchId, branchName: br?.name ?? '' }));
  };

  const toggleAccount = (accountId: string) => {
    const ids = draft.assignedAccountIds ?? [];
    const next = ids.includes(accountId) ? ids.filter(id => id !== accountId) : [...ids, accountId];
    setDraft(d => ({ ...d, assignedAccountIds: next, accountCount: next.length }));
  };

  const branchAccounts = accounts.filter(a => a.branchId === draft.branchId);
  const allFirmAccounts = accounts;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--shadow-modal, rgba(0,0,0,0.7))', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{isNew ? 'New Rep' : `Edit: ${rep!.name}`}</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '18px 20px' }}>
          {/* Identity */}
          <SectionLabel>Rep Information</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <Fld label="Rep ID"><input value={draft.id} onChange={e => setDraft(d => ({ ...d, id: e.target.value }))} disabled={!isNew} style={!isNew ? { opacity: 0.5 } : {}} /></Fld>
            <Fld label="Full Name"><input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} /></Fld>
            <Fld label="Email"><input type="email" value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} /></Fld>
            <Fld label="Phone"><input value={draft.phone} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} /></Fld>
            <Fld label="Primary Branch">
              <select value={draft.branchId} onChange={e => handleBranchChange(e.target.value)}>
                <option value="">— Select Branch —</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Fld>
            <Fld label="Status">
              <select value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value as any }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Fld>
          </div>

          {/* Account assignment — reps can span branches at firm level */}
          <button className="btn-secondary" style={{ marginBottom: 12 }} disabled={!draft.branchId} onClick={() => setDraft(d => ({ ...d, assignedAccountIds: Array.from(new Set([...(d.assignedAccountIds ?? []), ...branchAccounts.map(a => a.id)])) }))}>Assign all accounts in primary branch</button>
          <SectionLabel>Assigned Accounts ({draft.assignedAccountIds?.length ?? 0})</SectionLabel>
          <p style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)', marginBottom: 10 }}>
            Select accounts across branches, or add every current account in the primary branch. Selecting an account reassigns its primary rep; a primary branch alone does not grant account access.
          </p>
          <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 3 }}>
            {allFirmAccounts.map(a => {
              const assigned = (draft.assignedAccountIds ?? []).includes(a.id);
              return (
                <div key={a.id} role="checkbox" aria-checked={assigned} aria-label={`${a.id} ${a.ownerName}`} tabIndex={0} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleAccount(a.id); } }} onClick={() => toggleAccount(a.id)} style={{
                  padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10,
                  borderBottom: '1px solid rgba(30,45,74,0.3)', cursor: 'pointer',
                  background: assigned ? 'rgba(37,99,235,0.06)' : 'transparent',
                  transition: 'background 0.15s',
                }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: 2,
                    border: `1px solid ${assigned ? 'var(--primary)' : 'var(--border)'}`,
                    background: assigned ? 'var(--primary)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {assigned && <span style={{ color: '#fff', fontSize: '0.6rem', lineHeight: 1 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.73rem', fontWeight: assigned ? 600 : 400 }}>{a.ownerName}</span>
                    <span style={{ marginLeft: 8, fontFamily: 'var(--font-jetbrains)', fontSize: '0.6rem', color: 'var(--muted-foreground)' }}>{a.id}</span>
                  </div>
                  <span style={{ fontSize: '0.62rem', color: 'var(--muted-foreground)' }}>{a.branchName}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          {!isNew && !confirmDelete && <button className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>}
          {confirmDelete && <>
            <span style={{ fontSize: '0.72rem', color: 'var(--loss)', alignSelf: 'center' }}>Confirm?</span>
            <button className="btn-danger" onClick={() => onDelete?.(draft.id)}>Yes</button>
            <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>No</button>
          </>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={() => onSave(draft)}>{isNew ? 'Create Rep' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>{children}</div>;
}
function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return <label><span style={{ display: 'block', fontSize: '0.62rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</span>{children}</label>;
}

export default function RepManagementView() {
  const { reps, addRep, updateRep, deleteRep } = useData();
  const [modal, setModal] = useState<{ rep: Rep | null; isNew: boolean } | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const filtered = reps.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
  });

  const handleSave = (r: Rep) => {
    try { if (modal?.isNew) addRep(r); else updateRep(r); } catch (e) { showToast((e as Error).message); return; }
    setModal(null);
    showToast(modal?.isNew ? `Rep ${r.name} created.` : `Rep ${r.name} updated.`);
  };
  const handleDelete = (id: string) => { try { deleteRep(id); } catch (e) { showToast((e as Error).message); return; } setModal(null); showToast('Rep deleted.'); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 2px' }}>Reps</h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', margin: 0 }}>{reps.length} registered representatives</p>
          </div>
          <button className="btn-primary" onClick={() => setModal({ rep: null, isNew: true })}>+ New Rep</button>
        </div>
        <div style={{ marginBottom: 12 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, ID…" style={{ maxWidth: 280 }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <TH>Rep</TH>
              <TH>Primary Branch</TH>
              <TH right>Accounts</TH>
              <TH>Status</TH>
              <TH>Assigned Account IDs</TH>
              <TH></TH>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(30,45,74,0.4)' }} onClick={() => setModal({ rep: r, isNew: false })}>
                <TD>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{r.name}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.6rem', color: 'var(--accent)' }}>{r.id}</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)' }}>{r.email}</span>
                  </div>
                </TD>
                <TD><span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>{r.branchName || '—'}</span></TD>
                <TD right><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.78rem', fontWeight: 600 }}>{r.accountCount}</span></TD>
                <TD><StatusBadge status={r.status} /></TD>
                <TD>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 280 }}>
                    {(r.assignedAccountIds ?? []).slice(0, 4).map(id => (
                      <span key={id} style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.58rem', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', color: 'var(--accent)', padding: '1px 5px', borderRadius: 2 }}>{id}</span>
                    ))}
                    {(r.assignedAccountIds ?? []).length > 4 && (
                      <span style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)' }}>+{(r.assignedAccountIds ?? []).length - 4}</span>
                    )}
                  </div>
                </TD>
                <TD>
                  <button className="btn-secondary" style={{ padding: '3px 10px', fontSize: '0.65rem' }} onClick={e => { e.stopPropagation(); setModal({ rep: r, isNew: false }); }}>Edit</button>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <RepModal rep={modal.rep} isNew={modal.isNew} onClose={() => setModal(null)} onSave={handleSave} onDelete={handleDelete} />}
      <Toast message={toast} />
    </div>
  );
}
