import type { User, AppView, UserLevel } from '../types';

const LEVEL_COLOR: Record<UserLevel, string> = {
  firm:    '#a78bfa',
  branch:  '#34d399',
  csr:     '#60a5fa',
  account: '#f59e0b',
};

interface NavItem { id: AppView; label: string; icon: string }

const NAV_BY_LEVEL: Record<UserLevel, NavItem[]> = {
  firm: [
    { id: 'dashboard',    label: 'Dashboard',    icon: '▦' },
    { id: 'transactions', label: 'Transactions', icon: '⇄' },
    { id: 'positions',    label: 'Positions',    icon: '◈' },
    { id: 'balances',     label: 'Balances',     icon: '⊞' },
    { id: 'branches',     label: 'Branches',     icon: '⊟' },
    { id: 'accounts',     label: 'Accounts',     icon: '◉' },
    { id: 'profile',      label: 'Profile',      icon: '◎' },
  ],
  branch: [
    { id: 'dashboard',    label: 'Dashboard',    icon: '▦' },
    { id: 'transactions', label: 'Transactions', icon: '⇄' },
    { id: 'positions',    label: 'Positions',    icon: '◈' },
    { id: 'balances',     label: 'Balances',     icon: '⊞' },
    { id: 'accounts',     label: 'Accounts',     icon: '◉' },
    { id: 'profile',      label: 'Profile',      icon: '◎' },
  ],
  csr: [
    { id: 'dashboard',    label: 'Dashboard',    icon: '▦' },
    { id: 'transactions', label: 'Transactions', icon: '⇄' },
    { id: 'positions',    label: 'Positions',    icon: '◈' },
    { id: 'balances',     label: 'Balances',     icon: '⊞' },
    { id: 'profile',      label: 'Profile',      icon: '◎' },
  ],
  account: [
    { id: 'dashboard',    label: 'Dashboard',    icon: '▦' },
    { id: 'transactions', label: 'Transactions', icon: '⇄' },
    { id: 'positions',    label: 'Positions',    icon: '◈' },
    { id: 'balances',     label: 'Balances',     icon: '⊞' },
    { id: 'profile',      label: 'Profile',      icon: '◎' },
  ],
};

const LEVEL_BADGE_LABEL: Record<UserLevel, string> = {
  firm:    'Firm Admin',
  branch:  'Branch Mgr',
  csr:     'CSR Rep',
  account: 'Account',
};

interface Props {
  user: User;
  view: AppView;
  onNav: (v: AppView) => void;
  onLogout: () => void;
}

export default function Sidebar({ user, view, onNav, onLogout }: Props) {
  const levelColor = LEVEL_COLOR[user.level];
  const navItems = NAV_BY_LEVEL[user.level];

  return (
    <div style={{
      width: 220, minWidth: 220,
      background: 'var(--panel)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      {/* Brand */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4 + i * 3, background: 'var(--primary)', borderRadius: 1 }} />)}
          </div>
          <span style={{ fontFamily: 'var(--font-jetbrains)', fontWeight: 600, fontSize: '0.73rem', color: 'var(--foreground)', letterSpacing: '0.06em' }}>
            ACE CAPITAL
          </span>
        </div>
        <div style={{ fontSize: '0.58rem', color: 'var(--muted-foreground)', letterSpacing: '0.14em', fontFamily: 'var(--font-jetbrains)' }}>
          BACK OFFICE SYSTEM
        </div>
      </div>

      {/* User identity */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${levelColor}22, ${levelColor}44)`,
            border: `1px solid ${levelColor}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.68rem', fontWeight: 700, color: levelColor,
          }}>
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              fontSize: '0.58rem', color: levelColor,
              fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.08em', textTransform: 'uppercase',
              background: `${levelColor}15`, padding: '1px 5px', borderRadius: 2, marginTop: 2,
            }}>
              {LEVEL_BADGE_LABEL[user.level]}
            </div>
          </div>
        </div>

        {/* Context breadcrumb */}
        <div style={{ fontSize: '0.62rem', color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 4, height: 4, background: 'var(--muted-foreground)', borderRadius: '50%', display: 'inline-block', opacity: 0.4 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.firmName}</span>
          </div>
          {user.branchName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 8 }}>
              <span style={{ color: 'var(--border)', fontSize: '0.7rem' }}>└</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.branchName}</span>
            </div>
          )}
          {user.accountId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 16 }}>
              <span style={{ color: 'var(--border)', fontSize: '0.7rem' }}>└</span>
              <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.6rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.accountId}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '6px 0', overflowY: 'auto' }}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 14px',
              background: view === item.id ? 'rgba(37,99,235,0.12)' : 'transparent',
              borderTop: 'none', borderBottom: 'none', borderRight: 'none',
              borderLeft: view === item.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: view === item.id ? 'var(--foreground)' : 'var(--muted-foreground)',
              fontSize: '0.76rem',
              fontWeight: view === item.id ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: '0.8rem', width: 16, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
            {item.label}
            {/* Read-only badge for account role */}
            {user.level === 'account' && (item.id === 'transactions' || item.id === 'positions' || item.id === 'balances') && (
              <span style={{ marginLeft: 'auto', fontSize: '0.52rem', color: '#475569', fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                View
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Market status + logout */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gain)' }} />
          <span style={{ fontSize: '0.58rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-jetbrains)' }}>
            NYSE OPEN · 14:32 ET
          </span>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: '100%', padding: '5px', fontSize: '0.7rem',
            color: 'var(--muted-foreground)', background: 'transparent',
            border: '1px solid var(--border)', borderRadius: 3, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = '#ef4444'; el.style.color = '#ef4444'; }}
          onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--muted-foreground)'; }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
