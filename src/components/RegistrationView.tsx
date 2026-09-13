import FirmLogo from './FirmLogo';
import { useState } from 'react';
import type { UserLevel, PendingRegistration } from '../types';
import { useData } from '../context/DataContext';

const ROLES: { value: UserLevel; label: string; desc: string }[] = [
  { value: 'firm', label: 'Firm Administrator', desc: 'Request firm-wide administration access' },
  { value: 'branch',  label: 'Branch Manager',        desc: 'Manage accounts within a branch' },
  { value: 'csr',     label: 'Client Services Rep',   desc: 'Service assigned client accounts' },
  { value: 'account', label: 'Account Holder',        desc: 'Access your own trading account' },
];

interface Props { onBack: () => void }

export default function RegistrationView({ onBack }: Props) {
  const { addRegistration, branches, firmInfo } = useData();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', desiredLevel: 'account' as UserLevel,
    branchId: '', message: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(d => ({ ...d, [key]: e.target.value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (form.password.length < 6) errs.password = 'Use at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.name.trim())  errs.name  = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (!form.message.trim()) errs.message = 'Please include a brief message';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const reg: PendingRegistration = {
      id: `REG-${Date.now()}`,
      password: form.password, name: form.name, email: form.email, phone: form.phone,
      desiredLevel: form.desiredLevel, branchId: form.branchId || undefined,
      message: form.message, submittedAt: new Date().toLocaleString(), status: 'pending',
    };
    try { addRegistration(reg); } catch (e) { setErrors({ submit: (e as Error).message }); return; }
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
        <TopBar firmInfo={firmInfo} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', margin: '0 auto 16px' }}>✓</div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px' }}>Request Submitted</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: '0 0 20px', lineHeight: 1.6 }}>
              Your access request has been submitted to {firmInfo.name} for review. A firm administrator can approve this request in Users & Approvals in this browser. Then sign in using your chosen password. No email is sent in this demo.
            </p>
            <button className="btn-primary" onClick={onBack} style={{ width: '100%', padding: '10px' }}>Back to Sign In</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
      <TopBar firmInfo={firmInfo} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 2 }}>
              <FirmLogo size={36} />
              <span style={{ fontFamily: 'var(--font-jetbrains)', fontWeight: 600, fontSize: '1.05rem', letterSpacing: '0.05em' }}>{firmInfo.name.toUpperCase()}</span>
            </div>
            <p style={{ fontSize: '0.62rem', color: 'var(--muted-foreground)', letterSpacing: '0.18em', fontFamily: 'var(--font-jetbrains)', margin: 0 }}>ACCESS REQUEST</p>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 2px' }}>Request Portal Access</h2>
              <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', margin: 0 }}>
                Submit your details for firm administrator review. Use demo details only; access starts after approval in this browser.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Desired role */}
              <div>
                <Lbl>Requested Access Level</Lbl>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                  {ROLES.map(r => (
                    <label key={r.value} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                      border: `1px solid ${form.desiredLevel === r.value ? 'var(--primary)' : 'var(--border)'}`,
                      background: form.desiredLevel === r.value ? 'rgba(37,99,235,0.06)' : 'transparent',
                      borderRadius: 3, cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      <input type="radio" name="level" value={r.value} checked={form.desiredLevel === r.value}
                        onChange={e => setForm(d => ({ ...d, desiredLevel: e.target.value as UserLevel }))}
                        style={{ width: 'auto', accentColor: 'var(--primary)' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.76rem', fontWeight: 600 }}>{r.label}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>{r.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <Fld label="Full Name" error={errors.name}>
                <input value={form.name} onChange={f('name')} placeholder="Jane Smith" />
              </Fld>
              <Fld label="Email Address" error={errors.email}>
                <input type="email" value={form.email} onChange={f('email')} placeholder="jane@example.com" />
              </Fld>
              <Fld label="Demo Password" error={errors.password}><input type="password" autoComplete="new-password" value={form.password} onChange={f('password')} /></Fld>
              <Fld label="Confirm Password" error={errors.confirmPassword}><input type="password" autoComplete="new-password" value={form.confirmPassword} onChange={f('confirmPassword')} /></Fld>
              {errors.submit && <p role="alert" className="form-error">{errors.submit}</p>}
              <Fld label="Phone Number" error={errors.phone}>
                <input type="tel" value={form.phone} onChange={f('phone')} placeholder="+1 (555) 000-0000" />
              </Fld>
              {form.desiredLevel !== 'firm' && (
                <Fld label="Preferred Branch (optional)">
                  <select value={form.branchId} onChange={f('branchId')}>
                    <option value="">— No preference —</option>
                    {branches.filter(b => b.status === 'active').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </Fld>
              )}
              <Fld label="Message / Referral Info" error={errors.message}>
                <textarea value={form.message} onChange={f('message')} rows={3} placeholder="Please describe your relationship with the firm, referral, or reason for access request…" style={{ resize: 'vertical' }} />
              </Fld>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button type="button" className="btn-secondary" onClick={onBack}>← Back to Sign In</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px' }}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopBar({ firmInfo }: { firmInfo: { name: string } }) {
  return (
    <div style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <FirmLogo size={24} />
        <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.65rem', color: 'var(--muted-foreground)', letterSpacing: '0.1em' }}>
          {firmInfo.name.toUpperCase()} — BACK OFFICE SYSTEM
        </span>
      </div>
    </div>
  );
}

function Lbl({ children }: { children: React.ReactNode }) {
  return <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{children}</span>;
}
function Fld({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label>
      <Lbl>{label}</Lbl>
      <div style={{ marginTop: 6 }}>{children}</div>
      {error && <div style={{ fontSize: '0.65rem', color: 'var(--loss)', marginTop: 4 }}>{error}</div>}
    </label>
  );
}
