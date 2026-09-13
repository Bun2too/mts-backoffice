import { useState } from 'react';
import type { AppView } from './types';
import LoginView from './components/LoginView';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TransactionsView from './components/TransactionsView';
import PositionsView from './components/PositionsView';
import BalancesView from './components/BalancesView';
import BranchManagementView from './components/BranchManagementView';
import AccountManagementView from './components/AccountManagementView';
import ProfileView from './components/ProfileView';
import UserManagementView from './components/UserManagementView';
import RepManagementView from './components/RepManagementView';
import FirmSettingsView from './components/FirmSettingsView';
import RegistrationView from './components/RegistrationView';
import ThemeToggle from './components/ThemeToggle';
import { DataProvider, useData } from './context/DataContext';

const MARKETS = [
  { label: 'S&P 500', value: '5,841.23', up: true,  chg: '+0.38%' },
  { label: 'NASDAQ',  value: '18,204.10',up: true,  chg: '+0.51%' },
  { label: 'DOW',     value: '43,118.44',up: false, chg: '-0.12%' },
];

export default function App() { return <DataProvider><Application /></DataProvider>; }

function Application() {
  const { user, signOut, updateProfile, storageError } = useData();
  const [register, setRegister] = useState(false);
  const [view, setView] = useState<AppView>('dashboard');

  if (!user) {
    return <><ThemeToggle floating />{storageError && <div role="alert" className="demo-alert">{storageError}</div>}{register ? <RegistrationView onBack={() => setRegister(false)} /> : <LoginView onLogin={() => setView('dashboard')} onRegister={() => setRegister(true)} />}</>;
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <Sidebar user={user} view={view} onNav={setView} onLogout={() => { signOut(); setView('dashboard'); }} />

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
        {storageError && <div role="alert" className="demo-alert">{storageError}</div>}
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
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'America/New_York' })} ET
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gain)' }} />
              <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.58rem', color: 'var(--muted-foreground)' }}>DEMO</span>
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
          {view === 'accounts' && ['firm', 'branch'].includes(user.level) && <AccountManagementView user={user} />}
          {view === 'users' && user.level === 'firm' && <UserManagementView />}
          {view === 'reps' && user.level === 'firm' && <RepManagementView />}
          {view === 'firm-settings' && user.level === 'firm' && <FirmSettingsView />}
          {view === 'profile' && <ProfileView user={user} onUpdate={updateProfile} />}
        </div>
      </main>
    </div>
  );
}
