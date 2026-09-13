import { useState } from 'react';
import type { AppUserRecord, UserLevel, PendingRegistration } from '../types';
import { useData } from '../context/DataContext';
import { StatusBadge, TH, TD, Toast } from './shared';

const LEVELS: UserLevel[] = ['firm', 'branch', 'csr', 'account'];
const LEVEL_COLOR: Record<UserLevel, string> = { firm: '#a78bfa', branch: '#34d399', csr: '#60a5fa', account: '#f59e0b' };

interface UserModalProps {
  user: AppUserRecord | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (u: AppUserRecord) => void;
  onDelete?: (id: string) => void;
}

const EMPTY_USER: AppUserRecord = {
  id: '', name: '', email: '', phone: '', level: 'account', role: 'Account Holder',
  firmId: 'FIRM-001', status: 'active', createdAt: new Date().toISOString().split('T')[0], password: '',
};

function UserModal({ user, isNew, onClose, onSave, onDelete }: UserModalProps) {
  const { branches, reps, accounts } = useData();
  const [draft, setDraft] = useState<AppUserRecord>(
    isNew ? { ...EMPTY_USER, id: `USR-${Date.now()}` } : { ...user! }
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const f = (key: keyof AppUserRecord) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft(d => ({ ...d, [key]: e.target.value }));

  const handleLevelChange = (level: UserLevel) => {
    const roleMap: Record<UserLevel, string> = { firm: 'Firm Administrator', branch: 'Branch Manager', csr: 'Client Services Rep', account: 'Account Holder' };
    setDraft(d => ({ ...d, level, role: roleMap[level], branchId: '', repId: '', accountId: '' }));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--shadow-modal, rgba(0,0,0,0.7))', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{isNew ? 'New User' : `Edit: ${user!.name}`}</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Role level selector */}
          <div>
            <Lbl>Access Level</Lbl>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginTop: 6 }}>
              {LEVELS.map(l => (
                <button key={l} onClick={() => handleLevelChange(l)} style={{
                  padding: '8px 4px', border: `1px solid ${draft.level === l ? LEVEL_COLOR[l] : 'var(--border)'}`,
                  background: draft.level === l ? `${LEVEL_COLOR[l]}18` : 'transparent',
                  borderRadius: 3, fontSize: '0.68rem', fontWeight: 600, color: draft.level === l ? LEVEL_COLOR[l] : 'var(--muted-foreground)',
                  cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s',
                }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Fld label="Full Name"><input value={draft.name} onChange={f('name')} /></Fld>
            <Fld label="Role / Title"><input value={draft.role} onChange={f('role')} /></Fld>
            <Fld label="Email" style={{ gridColumn: '1 / -1' }}><input type="email" value={draft.email} onChange={f('email')} /></Fld>
            <Fld label="Phone"><input value={draft.phone} onChange={f('phone')} /></Fld>
            <Fld label="Password"><input type="password" value={draft.password ?? ''} onChange={f('password')} placeholder="Leave blank to keep current" /></Fld>
            {(draft.level === 'branch' || draft.level === 'csr' || draft.level === 'account') && (
              <Fld label="Branch">
                <select value={draft.branchId ?? ''} onChange={e => setDraft(d => ({ ...d, branchId: e.target.value, repId: '', accountId: '' }))}>
                  <option value="">— Select Branch —</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Fld>
            )}
            {draft.level === 'csr' && (
              <Fld label="Associated Rep">
                <select value={draft.repId ?? ''} onChange={f('repId')}>
                  <option value="">— Select Rep —</option>
                  {reps.filter(r => !draft.branchId || r.branchId === draft.branchId).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </Fld>
            )}
            {draft.level === 'account' && (
              <Fld label="Account"><select value={draft.accountId ?? ''} onChange={f('accountId')}><option value="">— Select Account —</option>{accounts.filter(a => !draft.branchId || a.branchId === draft.branchId).map(a => <option key={a.id} value={a.id}>{a.id} — {a.ownerName}</option>)}</select></Fld>
            )}
            <Fld label="Status">
              <select value={draft.status} onChange={f('status')}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </Fld>
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
            <button className="btn-primary" onClick={() => onSave(draft)}>{isNew ? 'Create User' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegistrationPanel() {
  const { registrations } = useData();
  const pending = registrations.filter(r => r.status === 'pending');
  return pending.length ? <div>{pending.map(r => <ApprovalCard key={r.id} registration={r} />)}</div> : <p className="demo-note">No pending registration requests.</p>;
}
function ApprovalCard({ registration: r }: { registration: PendingRegistration }) {
  const { branches, reps, accounts, approveRegistration, rejectRegistration } = useData();
  const [branchId, setBranchId] = useState(r.branchId ?? '');
  const [repId, setRepId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [error, setError] = useState('');
  const approve = () => {
    try { approveRegistration(r.id, { branchId, repId, accountId }); }
    catch (e) { setError((e as Error).message); }
  };
  return <section className="approval-card">
    <div className="view-heading"><strong>{r.name}</strong><span className="badge badge-blue">{r.desiredLevel}</span></div>
    <p className="demo-note">{r.email} · {r.phone} · Submitted {r.submittedAt}</p>
    <p>{r.message}</p>
    <div className="form-grid">
      {r.desiredLevel === 'branch' && <label>Assign branch<select value={branchId} onChange={e => setBranchId(e.target.value)}><option value="">Select branch</option>{branches.filter(b => b.status === 'active').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>}
      {r.desiredLevel === 'csr' && <label>Assign representative<select value={repId} onChange={e => setRepId(e.target.value)}><option value="">Select rep</option>{reps.filter(rep => rep.status === 'active').map(rep => <option key={rep.id} value={rep.id}>{rep.name} — {rep.branchName}</option>)}</select></label>}
      {r.desiredLevel === 'account' && <label>Assign account<select value={accountId} onChange={e => setAccountId(e.target.value)}><option value="">Select account</option>{accounts.filter(a => a.status === 'active').map(a => <option key={a.id} value={a.id}>{a.id} — {a.ownerName}</option>)}</select></label>}
    </div>
    {r.desiredLevel === 'firm' && <p className="demo-note">Approval grants full firm administration access.</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="modal-actions"><button className="btn-danger" onClick={() => { try { rejectRegistration(r.id); } catch (e) { setError((e as Error).message); } }}>Reject</button><button className="btn-primary" onClick={approve}>Approve & activate</button></div>
  </section>;
}

function Lbl({ children }: { children: React.ReactNode }) {
  return <span style={{ display: 'block', fontSize: '0.62rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{children}</span>;
}
function Fld({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return <label style={style}><Lbl>{label}</Lbl><div style={{ marginTop: 6 }}>{children}</div></label>;
}

export default function UserManagementView() {
  const { appUsers, addAppUser, updateAppUser, deleteAppUser, registrations } = useData();
  const [modal, setModal] = useState<{ user: AppUserRecord | null; isNew: boolean } | null>(null);
  const [filterLevel, setFilterLevel] = useState<UserLevel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'users' | 'registrations'>('users');
  const [toast, setToast] = useState('');
  const pendingCount = registrations.filter(r => r.status === 'pending').length;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const filtered = appUsers.filter(u => {
    if (filterLevel !== 'all' && u.level !== filterLevel) return false;
    if (filterStatus !== 'all' && u.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSave = (u: AppUserRecord) => {
    try { if (modal?.isNew) addAppUser(u); else updateAppUser(u); } catch (e) { showToast((e as Error).message); return; }
    setModal(null);
    showToast(modal?.isNew ? `User ${u.name} created.` : `User ${u.name} updated.`);
  };
  const handleDelete = (id: string) => {
    try { deleteAppUser(id); } catch (e) { showToast((e as Error).message); return; } setModal(null); showToast('User deleted.');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 2px' }}>Users</h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', margin: 0 }}>{filtered.length} users across all access levels</p>
          </div>
          <button className="btn-primary" onClick={() => setModal({ user: null, isNew: true })}>+ New User</button>
        </div>

        {/* Tab strip */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          {([
            { id: 'users',         label: 'All Users' },
            { id: 'registrations', label: `Pending Registrations${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '7px 16px', border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'transparent',
              color: tab === t.id ? 'var(--foreground)' : 'var(--muted-foreground)',
              fontSize: '0.74rem', fontWeight: tab === t.id ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'users' && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, email, ID…" style={{ flex: '1 1 180px', maxWidth: 240 }} />
            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value as any)} style={{ width: 'auto', minWidth: 140 }}>
              <option value="all">All Levels</option>
              {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
        {tab === 'registrations' ? (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 3 }}>
            <RegistrationPanel />
            {/* Show approved/rejected too */}
            {registrations.filter(r => r.status !== 'pending').length > 0 && (
              <>
                <div style={{ padding: '8px 18px', borderTop: '1px solid var(--border)', fontSize: '0.65rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Resolved
                </div>
                {registrations.filter(r => r.status !== 'pending').map(r => (
                  <div key={r.id} style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, opacity: 0.6 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>{r.name}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>{r.email}</span>
                    <span className={r.status === 'approved' ? 'badge badge-green' : 'badge badge-red'}>{r.status}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <TH>User</TH>
                <TH>Level</TH>
                <TH>Role</TH>
                <TH>Branch / Rep</TH>
                <TH>Status</TH>
                <TH>Last Login</TH>
                <TH>Created</TH>
                <TH></TH>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(30,45,74,0.4)' }} onClick={() => setModal({ user: u, isNew: false })}>
                  <TD>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${LEVEL_COLOR[u.level]}22`, border: `1px solid ${LEVEL_COLOR[u.level]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: LEVEL_COLOR[u.level], flexShrink: 0 }}>
                        {u.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.74rem', fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.6rem', color: 'var(--muted-foreground)' }}>{u.email}</div>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: LEVEL_COLOR[u.level] }}>{u.level}</span>
                  </TD>
                  <TD><span style={{ fontSize: '0.7rem' }}>{u.role}</span></TD>
                  <TD>
                    <div style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>
                      {u.branchId ?? '—'}
                      {u.repId && <span style={{ display: 'block', fontFamily: 'var(--font-jetbrains)', fontSize: '0.58rem' }}>{u.repId}</span>}
                    </div>
                  </TD>
                  <TD><StatusBadge status={u.status} /></TD>
                  <TD><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.62rem', color: 'var(--muted-foreground)' }}>{u.lastLogin ?? '—'}</span></TD>
                  <TD><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.62rem', color: 'var(--muted-foreground)' }}>{u.createdAt}</span></TD>
                  <TD>
                    <button className="btn-secondary" style={{ padding: '3px 10px', fontSize: '0.65rem' }} onClick={e => { e.stopPropagation(); setModal({ user: u, isNew: false }); }}>Edit</button>
                  </TD>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.78rem' }}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && <UserModal user={modal.user} isNew={modal.isNew} onClose={() => setModal(null)} onSave={handleSave} onDelete={handleDelete} />}
      <Toast message={toast} />
    </div>
  );
}
