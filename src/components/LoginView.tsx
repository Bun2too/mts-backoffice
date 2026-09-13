import FirmLogo from './FirmLogo';
import { useState, useEffect, useRef } from 'react';
import type { UserLevel, User } from '../types';
import { useData } from '../context/DataContext';

interface Props {
  onRegister: () => void;
  onLogin: () => void;
}

type Step = 'role' | 'identity' | 'verify' | 'credential';

const ROLES: { value: UserLevel; label: string; desc: string; icon: string; color: string }[] = [
  { value: 'firm',    label: 'Firm',         desc: 'Firm-level administrator',       icon: '▪▪▪', color: '#a78bfa' },
  { value: 'branch',  label: 'Branch',        desc: 'Branch manager or supervisor',   icon: '▪▪',  color: '#34d399' },
  { value: 'csr',     label: 'CSR Rep',       desc: 'Client services representative', icon: '▪',   color: '#60a5fa' },
  { value: 'account', label: 'Account Holder',desc: 'Client / account access',        icon: '◎',   color: '#f59e0b' },
];

const STEP_LABELS: Step[] = ['role', 'identity', 'verify', 'credential'];
const STEP_NAMES: Record<Step, string> = {
  role:       'Select Role',
  identity:   'Identify',
  verify:     'Verify',
  credential: 'Authenticate',
};

function ProgressBar({ step }: { step: Step }) {
  const idx = STEP_LABELS.indexOf(step);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {STEP_LABELS.map((s, i) => {
        const done    = i < idx;
        const current = i === idx;
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEP_LABELS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                border: `1px solid ${done ? '#10b981' : current ? '#2563eb' : 'var(--border)'}`,
                background: done ? '#10b981' : current ? 'rgba(37,99,235,0.15)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6rem', fontFamily: 'var(--font-jetbrains)',
                color: done ? '#fff' : current ? '#60a5fa' : 'var(--muted-foreground)',
                transition: 'all 0.3s',
                flexShrink: 0,
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.55rem', color: current ? 'var(--foreground)' : 'var(--muted-foreground)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-jetbrains)', whiteSpace: 'nowrap' }}>
                {STEP_NAMES[s]}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: done ? '#10b981' : 'var(--border)', margin: '0 6px', marginBottom: 16, transition: 'background 0.4s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Step 1: Role Selection ─────────────────────────────────────── */
function RoleStep({ onSelect }: { onSelect: (r: UserLevel) => void }) {
  const [hovered, setHovered] = useState<UserLevel | null>(null);
  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--foreground)' }}>Select your role</h2>
      <p style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', margin: '0 0 20px' }}>
        Choose the access level that matches your account type.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ROLES.map(r => (
          <button
            key={r.value}
            onClick={() => onSelect(r.value)}
            onMouseEnter={() => setHovered(r.value)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 16px', border: 'none', borderRadius: 3,
              background: hovered === r.value ? `${r.color}12` : 'rgba(255,255,255,0.02)',
              outline: hovered === r.value ? `1px solid ${r.color}44` : '1px solid var(--border)',
              cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `${r.color}18`, border: `1px solid ${r.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', color: r.color, flexShrink: 0,
              fontFamily: 'var(--font-jetbrains)',
            }}>
              {r.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: 2 }}>{r.label}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)' }}>{r.desc}</div>
            </div>
            <span style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem', transition: 'color 0.15s', ...(hovered === r.value ? { color: r.color } : {}) }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 2: Identity / Email ───────────────────────────────────── */
function IdentityStep({
  role, email, setEmail, onNext, onBack, loading, error,
}: {
  role: UserLevel; email: string; setEmail: (v: string) => void;
  onNext: () => void; onBack: () => void; loading: boolean; error: string;
}) {
  const r = ROLES.find(x => x.value === role)!;
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <form onSubmit={e => { e.preventDefault(); onNext(); }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
        <span style={{ fontSize: '0.65rem', color: r.color, fontFamily: 'var(--font-jetbrains)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{r.label}</span>
      </div>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--foreground)' }}>Enter your email</h2>
      <p style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', margin: '0 0 20px' }}>
        We'll look up your demo account. Verification is simulated.
      </p>

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          Email Address
        </label>
        <input
          ref={inputRef}
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="username"
        />
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}

      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button type="button" className="btn-secondary" onClick={onBack} style={{ flex: '0 0 auto' }}>← Back</button>
        <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Looking up…' : 'Continue →'}
        </button>
      </div>

      <HintBox>
        <strong>Demo accounts:</strong> admin@acefirm.com (firm) · bmgr@acefirm.com (branch) · csr@acefirm.com (csr) · client@acefirm.com (account)
      </HintBox>
    </form>
  );
}

/* ── Step 3: Verification ───────────────────────────────────────── */
function VerifyStep({
  email, onNext, onBack, onSkip,
}: {
  email: string; onNext: (code: string) => void; onBack: () => void; onSkip: () => void;
}) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [sent, setSent] = useState(true);
  const [resendTimer, setResendTimer] = useState(30);
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));
  const inputRef0 = useRef<HTMLInputElement>(null);

  useEffect(() => { refs[0].current?.focus(); }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleDigit = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val.slice(-1);
    setCode(next);
    if (val && i < 5) refs[i + 1].current?.focus();
    if (next.every(d => d) && next.join('').length === 6) {
      onNext(next.join(''));
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) refs[i - 1].current?.focus();
  };

  const handleResend = () => { setSent(true); setResendTimer(30); setCode(['', '', '', '', '', '']); refs[0].current?.focus(); };

  const masked = email.replace(/(.{2})(.+)(@.+)/, (_, a, _b, c) => `${a}${'•'.repeat(4)}${c}`);

  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--foreground)' }}>Verify your identity</h2>
      <p style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', margin: '0 0 4px' }}>
        Demo verification for <span style={{ color: 'var(--foreground)', fontFamily: 'var(--font-jetbrains)' }}>{masked}</span>
      </p>
      <p style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)', margin: '0 0 24px' }}>No email is sent. Enter any six digits or use Skip for Demo.</p>

      {/* OTP inputs */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
        {code.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            style={{
              width: 42, height: 48, textAlign: 'center',
              fontFamily: 'var(--font-jetbrains)', fontSize: '1.1rem', fontWeight: 600,
              border: `1px solid ${d ? 'var(--primary)' : 'var(--border)'}`,
              background: d ? 'rgba(37,99,235,0.08)' : 'var(--panel)',
              borderRadius: 3, color: 'var(--foreground)',
              outline: 'none', transition: 'all 0.15s',
            }}
          />
        ))}
      </div>

      {/* Resend */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        {resendTimer > 0 ? (
          <span style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-jetbrains)' }}>
            Resend in {resendTimer}s
          </span>
        ) : (
          <button onClick={handleResend} style={{ background: 'none', border: 'none', fontSize: '0.68rem', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-jetbrains)' }}>
            Resend code
          </button>
        )}
      </div>

      {/* Future auth methods placeholder */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginBottom: 16 }}>
        <div style={{ fontSize: '0.62rem', color: 'var(--muted-foreground)', textAlign: 'center', letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'var(--font-jetbrains)', textTransform: 'uppercase' }}>
          or verify with
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['🔑 Passkey', '⚙ Authenticator App'].map(label => (
            <button key={label} disabled style={{
              flex: 1, padding: '8px', fontSize: '0.7rem',
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 3, color: '#334155', cursor: 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              {label} <span style={{ fontSize: '0.55rem', color: '#334155', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Soon</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn-secondary" onClick={onBack} style={{ flex: '0 0 auto' }}>← Back</button>
        <button type="button" className="btn-secondary" onClick={onSkip} style={{ flex: 1, color: 'var(--accent)', borderColor: 'rgba(14,165,233,0.3)' }}>
          Skip verification (demo)
        </button>
      </div>
    </div>
  );
}

/* ── Step 4: Password / Credential ─────────────────────────────── */
function CredentialStep({
  role, email, onBack, onLogin, loading, error,
}: {
  role: UserLevel; email: string; onBack: () => void;
  onLogin: (pw: string) => void; loading: boolean; error: string;
}) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const r = ROLES.find(x => x.value === role)!;

  return (
    <form onSubmit={e => { e.preventDefault(); onLogin(pw); }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
        <span style={{ fontSize: '0.65rem', color: r.color, fontFamily: 'var(--font-jetbrains)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{r.label}</span>
      </div>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--foreground)' }}>Enter your password</h2>
      <div style={{ marginBottom: 20, padding: '8px 12px', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${r.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', color: r.color, flexShrink: 0 }}>
          {email.slice(0, 1).toUpperCase()}
        </div>
        <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.7rem', color: 'var(--foreground)' }}>{email}</span>
        <button type="button" onClick={onBack} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '0.65rem', color: 'var(--muted-foreground)', cursor: 'pointer' }}>
          Change
        </button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          Password
        </label>
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            type={show ? 'text' : 'password'}
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            style={{ paddingRight: 40 }}
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}
          >
            {show ? '🙈' : '👁'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button type="button" style={{ background: 'none', border: 'none', fontSize: '0.68rem', color: 'var(--accent)', cursor: 'pointer' }}>
          Forgot password?
        </button>
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}

      <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '10px', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.03em', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Authenticating…' : 'Sign In'}
      </button>

      {/* Future: social / passkey */}
      <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <div style={{ fontSize: '0.62rem', color: 'var(--muted-foreground)', textAlign: 'center', letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'var(--font-jetbrains)', textTransform: 'uppercase' }}>
          or sign in with
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['🔑 Passkey', '🔵 SSO / SAML'].map(label => (
            <button key={label} disabled style={{
              flex: 1, padding: '8px', fontSize: '0.7rem',
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 3, color: '#334155', cursor: 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              {label} <span style={{ fontSize: '0.55rem', color: '#334155', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Soon</span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────── */
function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 3, padding: '8px 12px', fontSize: '0.72rem', color: '#ef4444', marginBottom: 12 }}>
      {children}
    </div>
  );
}
function HintBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 16, padding: '8px 12px', background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.12)', borderRadius: 3 }}>
      <p style={{ fontSize: '0.62rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-jetbrains)', margin: 0, lineHeight: 1.6 }}>
        <span style={{ color: 'var(--accent)' }}>DEMO </span>{children}
      </p>
    </div>
  );
}

/* ── Main LoginView ──────────────────────────────────────────────── */
export default function LoginView({ onLogin, onRegister }: Props) {
  const { appUsers, signIn, firmInfo } = useData();
  const [step, setStep]   = useState<Step>('role');
  const [role, setRole]   = useState<UserLevel | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (r: UserLevel) => {
    setRole(r);
    setError('');
    setStep('identity');
  };

  const handleIdentityNext = () => {
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    // Simulate account lookup
    setTimeout(() => {
      setLoading(false);
      const record = appUsers.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (!record) { setError('No account found for this email address.'); return; }
      if (record.level !== role) { setError(`This account is registered as a ${record.level}-level user, not ${role}.`); return; }
      if (record.status !== 'active') { setError('This user is pending approval or suspended.'); return; }
      setStep('verify');
    }, 700);
  };

  const handleVerified = () => { setStep('credential'); };

  const handleLogin = (pw: string) => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      const record = appUsers.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      try {
        signIn(email, pw, role!);
        onLogin();
      } catch (e) { setError((e as Error).message); }
      setLoading(false);
    }, 600);
  };

  const goBack = () => {
    setError('');
    if (step === 'identity')   { setStep('role'); }
    if (step === 'verify')     { setStep('identity'); }
    if (step === 'credential') { setStep('verify'); }
  };

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
      {/* Top bar */}
      <div style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FirmLogo size={24} />
          <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.65rem', color: 'var(--muted-foreground)', letterSpacing: '0.12em' }}>
            {firmInfo.name.toUpperCase()} — BACK OFFICE DEMO
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.6rem', color: 'var(--muted-foreground)' }}>
          {new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false })} ET
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 2 }}>
              <FirmLogo size={36} />
              <span style={{ fontFamily: 'var(--font-jetbrains)', fontWeight: 600, fontSize: '1.05rem', color: 'var(--foreground)', letterSpacing: '0.05em' }}>
                {firmInfo.name.toUpperCase()}
              </span>
            </div>
            <p style={{ fontSize: '0.62rem', color: 'var(--muted-foreground)', letterSpacing: '0.18em', fontFamily: 'var(--font-jetbrains)', margin: 0 }}>
              BACK OFFICE PORTAL
            </p>
          </div>

          {/* Card */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, padding: '24px' }}>
            <ProgressBar step={step} />
            {step === 'role' && <button className="btn-secondary" style={{ width: '100%', marginBottom: 18 }} onClick={onRegister}>Request access / Register</button>}

            {step === 'role' && (
              <RoleStep onSelect={handleRoleSelect} />
            )}
            {step === 'identity' && role && (
              <IdentityStep
                role={role} email={email} setEmail={setEmail}
                onNext={handleIdentityNext} onBack={goBack}
                loading={loading} error={error}
              />
            )}
            {step === 'verify' && role && (
              <VerifyStep
                email={email}
                onNext={() => handleVerified()}
                onBack={goBack}
                onSkip={() => handleVerified()}
              />
            )}
            {step === 'credential' && role && (
              <CredentialStep
                role={role} email={email}
                onBack={() => setStep('identity')}
                onLogin={handleLogin}
                loading={loading} error={error}
              />
            )}
          </div>

          <p style={{ marginTop: 18, textAlign: 'center', fontSize: '0.6rem', color: 'var(--muted-foreground)', letterSpacing: '0.06em' }}>
            FINRA/SIPC Member · SEC Registered · © 2026 Ace Capital Group
          </p>
        </div>
      </div>
    </div>
  );
}
