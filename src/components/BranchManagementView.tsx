import { useState } from 'react';
import type { Branch } from '../types';
import { useScopedData } from '../context/DataContext';
import { StatusBadge, TH, TD, SectionHeader, Toast } from './shared';

const EMPTY_BRANCH: Omit<Branch, 'id' | 'createdAt'> = {
  firmId: 'FIRM-001', name: '', city: '', address: '', phone: '',
  managerName: '', managerId: '', status: 'active', accountCount: 0,
};

interface ModalProps {
  branch: Branch | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (b: Branch) => void;
  onDelete: (id: string) => void;
}

function BranchModal({ branch, isNew, onClose, onSave, onDelete }: ModalProps) {
  const [draft, setDraft] = useState<Branch>(
    isNew
      ? { ...EMPTY_BRANCH, id: `BRN-NEW${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] }
      : { ...branch! }
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const f = (key: keyof Branch) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft(d => ({ ...d, [key]: e.target.value }));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, width: '100%', maxWidth: 540 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{isNew ? 'New Branch' : 'Edit Branch'}</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {([
            { key: 'id',          label: 'Branch ID',    readOnly: !isNew },
            { key: 'name',        label: 'Branch Name',  readOnly: false },
            { key: 'city',        label: 'City',         readOnly: false },
            { key: 'phone',       label: 'Phone',        readOnly: false },
            { key: 'managerName', label: 'Manager Name', readOnly: false },
            { key: 'managerId',   label: 'Manager ID',   readOnly: false },
          ] as { key: keyof Branch; label: string; readOnly: boolean }[]).map(field => (
            <div key={field.key}>
              <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{field.label}</label>
              <input value={draft[field.key] as string} onChange={f(field.key)} disabled={field.readOnly} style={field.readOnly ? { opacity: 0.5 } : {}} />
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Address</label>
            <input value={draft.address} onChange={f('address')} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Status</label>
            <select value={draft.status} onChange={f('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          {!isNew && !confirmDelete && (
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
          )}
          {confirmDelete && (
            <>
              <span style={{ fontSize: '0.72rem', color: 'var(--loss)', alignSelf: 'center' }}>Confirm delete?</span>
              <button className="btn-danger" onClick={() => onDelete(draft.id)}>Yes, Delete</button>
              <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={() => onSave(draft)}>
              {isNew ? 'Create Branch' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BranchManagementView() {
  const { branches, updateBranch, deleteBranch } = useScopedData();
  const [modal, setModal] = useState<{ branch: Branch | null; isNew: boolean } | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSave = (b: Branch) => {
    try { updateBranch(b); } catch (e) { showToast((e as Error).message); return; }
    setModal(null);
    showToast(modal?.isNew ? `Branch ${b.name} created.` : `Branch ${b.name} updated.`);
  };

  const handleDelete = (id: string) => {
    try { deleteBranch(id); } catch (e) { showToast((e as Error).message); return; }
    setModal(null);
    showToast('Branch deleted.');
  };

  const active = branches.filter(b => b.status === 'active').length;
  const totalAccounts = branches.reduce((s, b) => s + b.accountCount, 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <SectionHeader title="Branches" sub={`${branches.length} branches · ${active} active`} />
          <button className="btn-primary" onClick={() => setModal({ branch: null, isNew: true })} style={{ flexShrink: 0 }}>
            + New Branch
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {[
            { label: 'Total Branches', value: String(branches.length) },
            { label: 'Active',         value: String(active) },
            { label: 'Total Accounts', value: String(totalAccounts) },
          ].map(t => (
            <div key={t.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 3, padding: '8px 14px', minWidth: 130 }}>
              <div style={{ fontSize: '0.58rem', color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-jetbrains)', marginBottom: 4 }}>{t.label}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-jetbrains)', color: 'var(--foreground)' }}>{t.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <TH>Branch ID</TH>
              <TH>Name</TH>
              <TH>City</TH>
              <TH>Manager</TH>
              <TH>Phone</TH>
              <TH right>Accounts</TH>
              <TH>Status</TH>
              <TH>Created</TH>
              <TH></TH>
            </tr>
          </thead>
          <tbody>
            {branches.map(b => (
              <tr key={b.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(30,45,74,0.4)' }}
                onClick={() => setModal({ branch: b, isNew: false })}>
                <TD><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.65rem', color: 'var(--accent)' }}>{b.id}</span></TD>
                <TD><span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--foreground)' }}>{b.name}</span></TD>
                <TD><span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{b.city}</span></TD>
                <TD><span style={{ fontSize: '0.72rem' }}>{b.managerName}</span></TD>
                <TD><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>{b.phone}</span></TD>
                <TD right><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.78rem', fontWeight: 600 }}>{b.accountCount}</span></TD>
                <TD><StatusBadge status={b.status} /></TD>
                <TD><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>{b.createdAt}</span></TD>
                <TD>
                  <button onClick={e => { e.stopPropagation(); setModal({ branch: b, isNew: false }); }} className="btn-secondary" style={{ padding: '3px 10px', fontSize: '0.65rem' }}>Edit</button>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <BranchModal branch={modal.branch} isNew={modal.isNew} onClose={() => setModal(null)} onSave={handleSave} onDelete={handleDelete} />
      )}
      <Toast message={toast} />
    </div>
  );
}
