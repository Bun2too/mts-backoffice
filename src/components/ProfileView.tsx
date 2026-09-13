import { useData } from '../context/DataContext';
import { useState } from 'react';
import type { User, UserLevel } from '../types';

interface Props {
  user: User;
  onUpdate: (u: User) => void;
}

const LEVEL_LABEL: Record<UserLevel, string> = {
  firm:    'Firm Administrator',
  branch:  'Branch Manager',
  csr:     'Client Services Rep',
  account: 'Account Holder',
};

const LEVEL_COLOR: Record<UserLevel, string> = {
  firm:    '#a78bfa',
  branch:  '#34d399',
  csr:     '#60a5fa',
  account: '#f59e0b',
};

export default function ProfileView({ user, onUpdate }: Props) {
  const { changePassword } = useData();
  const [draft, setDraft] = useState({ ...user });
  const [editing, setEditing] = useState(false);
  const [pwSection, setPwSection] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSave = () => {
    try { onUpdate(draft); } catch (e) { showToast((e as Error).message); return; }
    setEditing(false);
    showToast('Profile updated successfully.');
  };

  const handleCancel = () => {
    setDraft({ ...user });
    setEditing(false);
  };

  const handlePwSave = () => {
    if (!pw.current) { showToast('Enter your current password.'); return; }
    if (pw.next.length < 8) { showToast('New password must be at least 8 characters.'); return; }
    if (pw.next !== pw.confirm) { showToast('Passwords do not match.'); return; }
    try { changePassword(pw.current, pw.next); } catch (e) { showToast((e as Error).message); return; }
    setPw({ current: '', next: '', confirm: '' });
    setPwSection(false);
    showToast('Password changed successfully.');
  };

  const levelColor = LEVEL_COLOR[user.level];

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 24px' }}>
      <div style={{ maxWidth: 760 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 2px' }}>Profile</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>
              Manage your account and preferences
            </p>
          </div>
          {!editing ? (
            <button className="btn-secondary" onClick={() => setEditing(true)}>Edit Profile</button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" onClick={handleCancel}>Discard</button>
              <button className="btn-primary" onClick={handleSave}>Save Changes</button>
            </div>
          )}
        </div>

        {/* Identity card */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 3, marginBottom: 16 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: `linear-gradient(135deg, ${levelColor}22, ${levelColor}44)`,
              border: `2px solid ${levelColor}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', fontWeight: 700, color: levelColor, flexShrink: 0,
            }}>
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: 2 }}>{draft.name}</div>
              <div style={{ fontSize: '0.72rem', color: levelColor, fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {LEVEL_LABEL[user.level]}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                <InfoChip label={user.id} />
                <InfoChip label={user.firmName} />
                {user.branchName && <InfoChip label={user.branchName} />}
                {user.accountId && <InfoChip label={user.accountId} />}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <StatusBadge status={user.status} />
              <div style={{ marginTop: 6, fontSize: '0.65rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-jetbrains)' }}>
                Last login<br />{user.lastLogin}
              </div>
            </div>
          </div>

          {/* Hierarchy breadcrumb */}
          {user.level !== 'firm' && (
            <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-jetbrains)' }}>Access path:</span>
              {[
                user.firmName,
                user.branchName,
                user.csrName && user.level !== 'account' ? user.csrName : null,
                user.accountId ? `${user.accountId} — ${user.accountName}` : null,
              ].filter(Boolean).map((p, i, arr) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.65rem', color: i === arr.length - 1 ? 'var(--foreground)' : 'var(--muted-foreground)', fontFamily: 'var(--font-jetbrains)' }}>{p}</span>
                  {i < arr.length - 1 && <span style={{ color: 'var(--border)', fontSize: '0.7rem' }}>›</span>}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Editable fields */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 3, marginBottom: 16 }}>
          <SectionHeader>Personal Information</SectionHeader>
          <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Full Name">
              <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} disabled={!editing} />
            </Field>
            <Field label="Role / Title">
              <input value={draft.role} onChange={e => setDraft(d => ({ ...d, role: e.target.value }))} disabled={!editing} />
            </Field>
            <Field label="Email Address">
              <input type="email" value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} disabled={!editing} />
            </Field>
            <Field label="Phone Number">
              <input type="tel" value={draft.phone} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} disabled={!editing} />
            </Field>
          </div>
        </div>

        {/* Read-only hierarchy */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 3, marginBottom: 16 }}>
          <SectionHeader>Account Hierarchy</SectionHeader>
          <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Firm ID">
              <input value={user.firmId} disabled style={{ opacity: 0.5 }} />
            </Field>
            <Field label="Firm Name">
              <input value={user.firmName} disabled style={{ opacity: 0.5 }} />
            </Field>
            {user.branchId && <>
              <Field label="Branch ID">
                <input value={user.branchId} disabled style={{ opacity: 0.5 }} />
              </Field>
              <Field label="Branch Name">
                <input value={user.branchName ?? ''} disabled style={{ opacity: 0.5 }} />
              </Field>
            </>}
            {user.csrId && <>
              <Field label="CSR ID">
                <input value={user.csrId} disabled style={{ opacity: 0.5 }} />
              </Field>
              <Field label="CSR Name">
                <input value={user.csrName ?? ''} disabled style={{ opacity: 0.5 }} />
              </Field>
            </>}
            {user.accountId && <>
              <Field label="Account ID">
                <input value={user.accountId} disabled style={{ opacity: 0.5 }} />
              </Field>
              <Field label="Account Name">
                <input value={user.accountName ?? ''} disabled style={{ opacity: 0.5 }} />
              </Field>
            </>}
          </div>
          <div style={{ padding: '0 20px 12px' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-jetbrains)' }}>
              Hierarchy fields are managed by your firm administrator and cannot be self-edited.
            </p>
          </div>
        </div>

        {/* Security */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 3, marginBottom: 24 }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--foreground)' }}>Security</span>
            <button className="btn-secondary" style={{ fontSize: '0.7rem' }} onClick={() => setPwSection(p => !p)}>
              {pwSection ? 'Cancel' : 'Change Password'}
            </button>
          </div>
          <div style={{ padding: '14px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
              <InfoRow label="User ID" value={user.id} mono />
              <InfoRow label="Access Level" value={LEVEL_LABEL[user.level]} />
              <InfoRow label="Account Status" value={user.status} />
              <InfoRow label="Member Since" value={user.createdAt} mono />
            </div>
            {pwSection && (
              <div style={{ marginTop: 16, padding: '16px', background: 'var(--muted)', borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Field label="Current Password">
                  <input type="password" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} placeholder="••••••••" />
                </Field>
                <Field label="New Password">
                  <input type="password" value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} placeholder="Min. 8 characters" />
                </Field>
                <Field label="Confirm New Password">
                  <input type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" />
                </Field>
                <div>
                  <button className="btn-primary" onClick={handlePwSave} style={{ fontSize: '0.78rem' }}>Update Password</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 200,
          background: 'var(--card)', border: '1px solid var(--gain)',
          borderRadius: 3, padding: '10px 16px', fontSize: '0.78rem',
          color: 'var(--gain)', fontFamily: 'var(--font-jetbrains)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--foreground)' }}>{children}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: '0.62rem', color: 'var(--muted-foreground)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--foreground)', fontFamily: mono ? 'var(--font-jetbrains)' : 'var(--font-inter)' }}>{value}</div>
    </div>
  );
}

function InfoChip({ label }: { label: string }) {
  return (
    <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.6rem', color: 'var(--muted-foreground)', background: 'rgba(30,45,74,0.6)', padding: '2px 6px', borderRadius: 2, border: '1px solid var(--border)' }}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'active' ? 'badge-green' : status === 'suspended' ? 'badge-red' : 'badge-amber';
  return <span className={`badge ${cls}`}>{status}</span>;
}
