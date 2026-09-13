import { useState } from 'react';
import type { User, AppView } from './types';
import LoginView from './components/LoginView';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TransactionsView from './components/TransactionsView';
import PositionsView from './components/PositionsView';
import BalancesView from './components/BalancesView';
import BranchManagementView from './components/BranchManagementView';
import AccountManagementView from './components/AccountManagementView';
import ProfileView from './components/ProfileView';

const MARKETS = [
  { label: 'S&P 500', value: '5,841.23', up: true,  chg: '+0.38%' },
  { label: 'NASDAQ',  value: '18,204.10',up: true,  chg: '+0.51%' },
  { label: 'DOW',     value: '43,118.44',up: false, chg: '-0.12%' },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>('dashboard');

  if (!user) {
    return <LoginView onLogin={u => { setUser(u); setView('dashboard'); }} />;
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <Sidebar user={user} view={view} onNav={setView} onLogout={() => setUser(null)} />

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
        {/* Market ticker bar */}
        <div style={{ height: 30, flexShrink: 0, background: 'var(--panel)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px' }}>
          <div style={{ display: 'flex', gap: 18 }}>
            {MARKETS.map(m => (
              <div key={m.label} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.58rem', color: 'var(--muted-foreground)' }}>{m.label}</span>
                <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.64rem', fontWeight: 600, color: 'var(--foreground)' }}>{m.value}</span>
                <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.58rem', color: m.up ? 'var(--gain)' : 'var(--loss)' }}>{m.chg}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.58rem', color: 'var(--muted-foreground)' }}>
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} ET
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gain)' }} />
              <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.58rem', color: 'var(--muted-foreground)' }}>LIVE</span>
            </div>
          </div>
        </div>

        {/* View content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {view === 'dashboard'    && <Dashboard user={user} />}
          {view === 'transactions' && <TransactionsView user={user} />}
          {view === 'positions'    && <PositionsView user={user} />}
          {view === 'balances'     && <BalancesView user={user} />}
          {view === 'branches'     && user.level === 'firm' && <BranchManagementView />}
          {view === 'accounts'     && <AccountManagementView user={user} />}
          {view === 'profile'      && <ProfileView user={user} onUpdate={u => setUser(u)} />}
        </div>
      </main>
    </div>
  );
}
