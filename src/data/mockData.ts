import type { User, Branch, Rep, AccountRecord, Position, Balance, Transaction } from '../types';

// ── Firm ─────────────────────────────────────────────────────────────────────

export const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@acefirm.com': {
    password: 'firm123',
    user: {
      id: 'USR-F001', level: 'firm',
      firmId: 'FIRM-001', firmName: 'Ace Capital Group',
      email: 'admin@acefirm.com', phone: '+1 (212) 555-0101',
      name: 'Margaret Thornton', role: 'Firm Administrator',
      status: 'active', lastLogin: '2026-09-10 08:42:11', createdAt: '2021-03-15',
    },
  },
  'bmgr@acefirm.com': {
    password: 'branch123',
    user: {
      id: 'USR-B001', level: 'branch',
      firmId: 'FIRM-001', firmName: 'Ace Capital Group',
      branchId: 'BRN-NYC01', branchName: 'New York — Midtown',
      email: 'bmgr@acefirm.com', phone: '+1 (212) 555-0202',
      name: 'Daniel Reyes', role: 'Branch Manager',
      status: 'active', lastLogin: '2026-09-10 09:15:44', createdAt: '2022-01-08',
    },
  },
  'csr@acefirm.com': {
    password: 'csr123',
    user: {
      id: 'USR-C001', level: 'csr',
      firmId: 'FIRM-001', firmName: 'Ace Capital Group',
      branchId: 'BRN-NYC01', branchName: 'New York — Midtown',
      csrId: 'REP-001', csrName: 'Sofia Nakamura',
      email: 'csr@acefirm.com', phone: '+1 (212) 555-0303',
      name: 'Sofia Nakamura', role: 'Client Services Rep',
      status: 'active', lastLogin: '2026-09-10 07:58:22', createdAt: '2023-06-20',
    },
  },
  'client@acefirm.com': {
    password: 'acct123',
    user: {
      id: 'USR-A001', level: 'account',
      firmId: 'FIRM-001', firmName: 'Ace Capital Group',
      branchId: 'BRN-NYC01', branchName: 'New York — Midtown',
      csrId: 'REP-001', csrName: 'Sofia Nakamura',
      accountId: 'ACC-78341', accountName: 'Harrington Family Trust',
      email: 'client@acefirm.com', phone: '+1 (917) 555-0404',
      name: 'Edward Harrington', role: 'Account Holder',
      status: 'active', lastLogin: '2026-09-09 16:30:05', createdAt: '2019-11-12',
    },
  },
};

export const LEVEL_CREDENTIALS: Record<string, { hint: string; placeholder: string }> = {
  firm:    { hint: 'admin@acefirm.com / firm123',   placeholder: 'firm@example.com' },
  branch:  { hint: 'bmgr@acefirm.com / branch123',  placeholder: 'bmgr@example.com' },
  csr:     { hint: 'csr@acefirm.com / csr123',      placeholder: 'csr@example.com' },
  account: { hint: 'client@acefirm.com / acct123',  placeholder: 'client@example.com' },
};

// ── Branches ─────────────────────────────────────────────────────────────────

export const MOCK_BRANCHES: Branch[] = [
  {
    id: 'BRN-NYC01', firmId: 'FIRM-001',
    name: 'New York — Midtown', city: 'New York, NY',
    address: '1221 Avenue of the Americas, New York, NY 10020',
    phone: '+1 (212) 555-1000', managerName: 'Daniel Reyes', managerId: 'USR-B001',
    status: 'active', accountCount: 4, createdAt: '2018-04-01',
  },
  {
    id: 'BRN-CHI01', firmId: 'FIRM-001',
    name: 'Chicago — Loop', city: 'Chicago, IL',
    address: '233 S Wacker Dr, Chicago, IL 60606',
    phone: '+1 (312) 555-2000', managerName: 'Patricia Mwangi', managerId: 'USR-B002',
    status: 'active', accountCount: 3, createdAt: '2019-07-15',
  },
  {
    id: 'BRN-LA01', firmId: 'FIRM-001',
    name: 'Los Angeles — Century City', city: 'Los Angeles, CA',
    address: '2000 Avenue of the Stars, Los Angeles, CA 90067',
    phone: '+1 (310) 555-3000', managerName: 'Kevin Tran', managerId: 'USR-B003',
    status: 'active', accountCount: 2, createdAt: '2021-02-01',
  },
  {
    id: 'BRN-MIA01', firmId: 'FIRM-001',
    name: 'Miami — Brickell', city: 'Miami, FL',
    address: '1221 Brickell Ave, Miami, FL 33131',
    phone: '+1 (305) 555-4000', managerName: 'Carlos Mendez', managerId: 'USR-B004',
    status: 'inactive', accountCount: 0, createdAt: '2023-11-01',
  },
];

// ── Reps ─────────────────────────────────────────────────────────────────────

export const MOCK_REPS: Rep[] = [
  { id: 'REP-001', firmId: 'FIRM-001', branchId: 'BRN-NYC01', branchName: 'New York — Midtown', name: 'Sofia Nakamura', email: 'csr@acefirm.com',      phone: '+1 (212) 555-0303', status: 'active', accountCount: 3 },
  { id: 'REP-002', firmId: 'FIRM-001', branchId: 'BRN-NYC01', branchName: 'New York — Midtown', name: 'Marcus Webb',    email: 'mwebb@acefirm.com',    phone: '+1 (212) 555-0305', status: 'active', accountCount: 1 },
  { id: 'REP-003', firmId: 'FIRM-001', branchId: 'BRN-CHI01', branchName: 'Chicago — Loop',     name: 'Priya Kapoor',  email: 'pkapoor@acefirm.com',  phone: '+1 (312) 555-0501', status: 'active', accountCount: 2 },
  { id: 'REP-004', firmId: 'FIRM-001', branchId: 'BRN-CHI01', branchName: 'Chicago — Loop',     name: 'James Okonkwo', email: 'jokonkwo@acefirm.com', phone: '+1 (312) 555-0502', status: 'active', accountCount: 1 },
  { id: 'REP-005', firmId: 'FIRM-001', branchId: 'BRN-LA01',  branchName: 'Los Angeles — Century City', name: 'Lynn Castillo', email: 'lcastillo@acefirm.com', phone: '+1 (310) 555-0601', status: 'active', accountCount: 2 },
];

// ── Accounts ─────────────────────────────────────────────────────────────────

export const MOCK_ACCOUNTS: AccountRecord[] = [
  // NYC Branch
  { id: 'ACC-78341', firmId: 'FIRM-001', branchId: 'BRN-NYC01', branchName: 'New York — Midtown', repId: 'REP-001', repName: 'Sofia Nakamura', ownerName: 'Harrington Family Trust', email: 'client@acefirm.com', phone: '+1 (917) 555-0404', type: 'trust',      status: 'active',  openedAt: '2019-11-12', cashBalance: 87423.18,  portfolioValue: 1197337.24, totalValue: 1284760.42, dayPnl: 4812.65,  dayPnlPct: 0.38  },
  { id: 'ACC-78342', firmId: 'FIRM-001', branchId: 'BRN-NYC01', branchName: 'New York — Midtown', repId: 'REP-001', repName: 'Sofia Nakamura', ownerName: 'Priscilla Vance',         email: 'pvance@email.com',   phone: '+1 (212) 555-0410', type: 'individual', status: 'active',  openedAt: '2020-03-18', cashBalance: 24100.50,  portfolioValue: 312880.00,  totalValue: 336980.50,  dayPnl: -1240.10, dayPnlPct: -0.37 },
  { id: 'ACC-78343', firmId: 'FIRM-001', branchId: 'BRN-NYC01', branchName: 'New York — Midtown', repId: 'REP-001', repName: 'Sofia Nakamura', ownerName: 'Fontaine & Assoc IRA',   email: 'ira@fontaine.com',   phone: '+1 (212) 555-0411', type: 'ira',        status: 'active',  openedAt: '2021-08-01', cashBalance: 5400.00,   portfolioValue: 98600.00,   totalValue: 104000.00,  dayPnl: 320.00,   dayPnlPct: 0.31  },
  { id: 'ACC-78344', firmId: 'FIRM-001', branchId: 'BRN-NYC01', branchName: 'New York — Midtown', repId: 'REP-002', repName: 'Marcus Webb',    ownerName: 'GlobalTech Pension Fund', email: 'gtp@glbtech.com',    phone: '+1 (917) 555-0420', type: 'corporate',  status: 'active',  openedAt: '2018-05-10', cashBalance: 410000.00, portfolioValue: 3820000.00, totalValue: 4230000.00, dayPnl: 18500.00, dayPnlPct: 0.44  },
  // Chicago Branch
  { id: 'ACC-78350', firmId: 'FIRM-001', branchId: 'BRN-CHI01', branchName: 'Chicago — Loop',     repId: 'REP-003', repName: 'Priya Kapoor',  ownerName: 'Lakeshore Holdings LLC',  email: 'lsh@lakeshore.com',  phone: '+1 (312) 555-0510', type: 'corporate',  status: 'active',  openedAt: '2020-06-22', cashBalance: 62500.00,  portfolioValue: 748000.00,  totalValue: 810500.00,  dayPnl: 3200.00,  dayPnlPct: 0.40  },
  { id: 'ACC-78351', firmId: 'FIRM-001', branchId: 'BRN-CHI01', branchName: 'Chicago — Loop',     repId: 'REP-003', repName: 'Priya Kapoor',  ownerName: 'Raymond & Diane Osei',    email: 'rdosei@email.com',   phone: '+1 (312) 555-0511', type: 'joint',      status: 'active',  openedAt: '2022-02-14', cashBalance: 11800.00,  portfolioValue: 185400.00,  totalValue: 197200.00,  dayPnl: -890.00,  dayPnlPct: -0.45 },
  { id: 'ACC-78352', firmId: 'FIRM-001', branchId: 'BRN-CHI01', branchName: 'Chicago — Loop',     repId: 'REP-004', repName: 'James Okonkwo', ownerName: 'Midway Capital Partners',  email: 'mcp@midwaycap.com',  phone: '+1 (312) 555-0520', type: 'corporate',  status: 'pending', openedAt: '2026-08-15', cashBalance: 0,          portfolioValue: 0,          totalValue: 0,          dayPnl: 0,        dayPnlPct: 0     },
  // LA Branch
  { id: 'ACC-78360', firmId: 'FIRM-001', branchId: 'BRN-LA01',  branchName: 'Los Angeles — Century City', repId: 'REP-005', repName: 'Lynn Castillo', ownerName: 'Castellan Media Trust',   email: 'trust@castellan.com', phone: '+1 (310) 555-0610', type: 'trust',      status: 'active',  openedAt: '2021-09-30', cashBalance: 38000.00,  portfolioValue: 552000.00,  totalValue: 590000.00,  dayPnl: 1750.00,  dayPnlPct: 0.30  },
  { id: 'ACC-78361', firmId: 'FIRM-001', branchId: 'BRN-LA01',  branchName: 'Los Angeles — Century City', repId: 'REP-005', repName: 'Lynn Castillo', ownerName: 'Danielle Orozco',         email: 'dorozco@email.com',   phone: '+1 (310) 555-0611', type: 'individual', status: 'suspended',openedAt: '2023-04-05', cashBalance: 2100.00,   portfolioValue: 14800.00,   totalValue: 16900.00,  dayPnl: -50.00,   dayPnlPct: -0.30 },
];

// ── Positions ─────────────────────────────────────────────────────────────────

export const MOCK_POSITIONS: Position[] = [
  // ACC-78341 Harrington Family Trust
  { id: 'POS-001', accountId: 'ACC-78341', accountName: 'Harrington Family Trust', branchId: 'BRN-NYC01', firmId: 'FIRM-001', symbol: 'NVDA', description: 'NVIDIA Corporation',      assetClass: 'equity',  quantity: 150,  avgCost: 102.40,  currentPrice: 118.42, marketValue: 17763.00,  unrealizedPnl: 2403.00,  unrealizedPnlPct: 15.65, dayChange: 212.00,  dayChangePct: 1.21, lastUpdated: '2026-09-10 16:00' },
  { id: 'POS-002', accountId: 'ACC-78341', accountName: 'Harrington Family Trust', branchId: 'BRN-NYC01', firmId: 'FIRM-001', symbol: 'MSFT', description: 'Microsoft Corporation',   assetClass: 'equity',  quantity: 200,  avgCost: 380.00,  currentPrice: 432.15, marketValue: 86430.00,  unrealizedPnl: 10430.00, unrealizedPnlPct: 13.72, dayChange: 1240.00, dayChangePct: 1.46, lastUpdated: '2026-09-10 16:00' },
  { id: 'POS-003', accountId: 'ACC-78341', accountName: 'Harrington Family Trust', branchId: 'BRN-NYC01', firmId: 'FIRM-001', symbol: 'SPY',  description: 'SPDR S&P 500 ETF',       assetClass: 'etf',     quantity: 500,  avgCost: 510.00,  currentPrice: 558.30, marketValue: 279150.00, unrealizedPnl: 24150.00, unrealizedPnlPct: 9.47,  dayChange: 2500.00, dayChangePct: 0.90, lastUpdated: '2026-09-10 16:00' },
  { id: 'POS-004', accountId: 'ACC-78341', accountName: 'Harrington Family Trust', branchId: 'BRN-NYC01', firmId: 'FIRM-001', symbol: 'AAPL', description: 'Apple Inc.',              assetClass: 'equity',  quantity: 350,  avgCost: 195.00,  currentPrice: 228.85, marketValue: 80097.50,  unrealizedPnl: 11847.50, unrealizedPnlPct: 17.36, dayChange: -420.00, dayChangePct: -0.52, lastUpdated: '2026-09-10 16:00' },
  { id: 'POS-005', accountId: 'ACC-78341', accountName: 'Harrington Family Trust', branchId: 'BRN-NYC01', firmId: 'FIRM-001', symbol: 'JNJ',  description: 'Johnson & Johnson',       assetClass: 'equity',  quantity: 300,  avgCost: 158.20,  currentPrice: 152.40, marketValue: 45720.00,  unrealizedPnl: -1740.00, unrealizedPnlPct: -3.67, dayChange: -300.00, dayChangePct: -0.65, lastUpdated: '2026-09-10 16:00' },
  // ACC-78342 Priscilla Vance
  { id: 'POS-006', accountId: 'ACC-78342', accountName: 'Priscilla Vance',         branchId: 'BRN-NYC01', firmId: 'FIRM-001', symbol: 'AMZN', description: 'Amazon.com Inc.',        assetClass: 'equity',  quantity: 80,   avgCost: 185.00,  currentPrice: 198.40, marketValue: 15872.00,  unrealizedPnl: 1072.00,  unrealizedPnlPct: 7.24,  dayChange: 88.00,   dayChangePct: 0.56, lastUpdated: '2026-09-10 16:00' },
  { id: 'POS-007', accountId: 'ACC-78342', accountName: 'Priscilla Vance',         branchId: 'BRN-NYC01', firmId: 'FIRM-001', symbol: 'QQQ',  description: 'Invesco QQQ Trust',      assetClass: 'etf',     quantity: 600,  avgCost: 440.00,  currentPrice: 487.20, marketValue: 292320.00, unrealizedPnl: 28320.00, unrealizedPnlPct: 10.73, dayChange: 1800.00, dayChangePct: 0.62, lastUpdated: '2026-09-10 16:00' },
  // ACC-78344 GlobalTech Pension Fund
  { id: 'POS-008', accountId: 'ACC-78344', accountName: 'GlobalTech Pension Fund', branchId: 'BRN-NYC01', firmId: 'FIRM-001', symbol: 'BRK.B',description: 'Berkshire Hathaway B',   assetClass: 'equity',  quantity: 2000, avgCost: 328.00,  currentPrice: 411.50, marketValue: 823000.00, unrealizedPnl: 167000.00,unrealizedPnlPct: 25.46, dayChange: 8200.00, dayChangePct: 1.01, lastUpdated: '2026-09-10 16:00' },
  { id: 'POS-009', accountId: 'ACC-78344', accountName: 'GlobalTech Pension Fund', branchId: 'BRN-NYC01', firmId: 'FIRM-001', symbol: 'VTI',  description: 'Vanguard Total Market',  assetClass: 'etf',     quantity: 5000, avgCost: 198.00,  currentPrice: 241.30, marketValue: 1206500.00,unrealizedPnl: 216500.00,unrealizedPnlPct: 21.87, dayChange: 9000.00, dayChangePct: 0.75, lastUpdated: '2026-09-10 16:00' },
  { id: 'POS-010', accountId: 'ACC-78344', accountName: 'GlobalTech Pension Fund', branchId: 'BRN-NYC01', firmId: 'FIRM-001', symbol: 'TLT',  description: 'iShares 20+ Yr Treasury', assetClass: 'bond',   quantity: 3000, avgCost: 91.50,   currentPrice: 88.40,  marketValue: 265200.00, unrealizedPnl: -9300.00, unrealizedPnlPct: -3.39, dayChange: -600.00, dayChangePct: -0.23, lastUpdated: '2026-09-10 16:00' },
  // ACC-78350 Lakeshore Holdings
  { id: 'POS-011', accountId: 'ACC-78350', accountName: 'Lakeshore Holdings LLC',  branchId: 'BRN-CHI01', firmId: 'FIRM-001', symbol: 'TSLA', description: 'Tesla Inc.',             assetClass: 'equity',  quantity: 400,  avgCost: 248.00,  currentPrice: 312.70, marketValue: 125080.00, unrealizedPnl: 25880.00, unrealizedPnlPct: 26.13, dayChange: 1600.00, dayChangePct: 1.30, lastUpdated: '2026-09-10 16:00' },
  { id: 'POS-012', accountId: 'ACC-78350', accountName: 'Lakeshore Holdings LLC',  branchId: 'BRN-CHI01', firmId: 'FIRM-001', symbol: 'META', description: 'Meta Platforms Inc.',    assetClass: 'equity',  quantity: 300,  avgCost: 488.00,  currentPrice: 578.20, marketValue: 173460.00, unrealizedPnl: 27060.00, unrealizedPnlPct: 18.48, dayChange: 1800.00, dayChangePct: 1.05, lastUpdated: '2026-09-10 16:00' },
  { id: 'POS-013', accountId: 'ACC-78350', accountName: 'Lakeshore Holdings LLC',  branchId: 'BRN-CHI01', firmId: 'FIRM-001', symbol: 'GOOGL',description: 'Alphabet Inc.',          assetClass: 'equity',  quantity: 500,  avgCost: 148.00,  currentPrice: 176.80, marketValue: 88400.00,  unrealizedPnl: 14400.00, unrealizedPnlPct: 19.46, dayChange: 650.00,  dayChangePct: 0.74, lastUpdated: '2026-09-10 16:00' },
  // ACC-78351 Raymond & Diane Osei
  { id: 'POS-014', accountId: 'ACC-78351', accountName: 'Raymond & Diane Osei',    branchId: 'BRN-CHI01', firmId: 'FIRM-001', symbol: 'VYM',  description: 'Vanguard High Div Yield', assetClass: 'etf',    quantity: 1200, avgCost: 108.00,  currentPrice: 121.40, marketValue: 145680.00, unrealizedPnl: 16080.00, unrealizedPnlPct: 12.41, dayChange: -480.00, dayChangePct: -0.33, lastUpdated: '2026-09-10 16:00' },
  // ACC-78360 Castellan Media Trust
  { id: 'POS-015', accountId: 'ACC-78360', accountName: 'Castellan Media Trust',   branchId: 'BRN-LA01',  firmId: 'FIRM-001', symbol: 'DIS',  description: 'Walt Disney Co.',        assetClass: 'equity',  quantity: 900,  avgCost: 98.00,   currentPrice: 102.40, marketValue: 92160.00,  unrealizedPnl: 3960.00,  unrealizedPnlPct: 4.49,  dayChange: 450.00,  dayChangePct: 0.49, lastUpdated: '2026-09-10 16:00' },
  { id: 'POS-016', accountId: 'ACC-78360', accountName: 'Castellan Media Trust',   branchId: 'BRN-LA01',  firmId: 'FIRM-001', symbol: 'NFLX', description: 'Netflix Inc.',           assetClass: 'equity',  quantity: 200,  avgCost: 580.00,  currentPrice: 718.40, marketValue: 143680.00, unrealizedPnl: 27680.00, unrealizedPnlPct: 23.86, dayChange: 1400.00, dayChangePct: 0.98, lastUpdated: '2026-09-10 16:00' },
];

// ── Balances ──────────────────────────────────────────────────────────────────

export const MOCK_BALANCES: Balance[] = MOCK_ACCOUNTS.map(a => ({
  accountId:          a.id,
  accountName:        a.ownerName,
  branchId:           a.branchId,
  branchName:         a.branchName,
  firmId:             a.firmId,
  cashBalance:        a.cashBalance,
  marginBalance:      a.cashBalance * 0.5,
  portfolioValue:     a.portfolioValue,
  totalEquity:        a.totalValue,
  buyingPower:        a.cashBalance * 2,
  marginUsed:         a.portfolioValue * 0.15,
  marginAvailable:    a.portfolioValue * 0.35,
  pendingDeposits:    a.status === 'active' ? Math.round(Math.random() * 5000) : 0,
  pendingWithdrawals: a.status === 'active' ? Math.round(Math.random() * 2000) : 0,
  dayPnl:             a.dayPnl,
  dayPnlPct:          a.dayPnlPct,
  asOf:               '2026-09-10 16:00 ET',
}));

// ── Transactions ──────────────────────────────────────────────────────────────

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'TXN-20260910-0841', type: 'trade',  action: 'buy',        symbol: 'NVDA', description: 'Buy NVDA — NVIDIA Corp',         quantity: 150, price: 118.42, amount: 17763.00, status: 'settled',  accountId: 'ACC-78341', accountName: 'Harrington Family Trust', branchId: 'BRN-NYC01', firmId: 'FIRM-001', tradeDate: '2026-09-10', settleDate: '2026-09-12', csrId: 'REP-001', csrName: 'Sofia Nakamura', notes: 'Client-initiated market order.' },
  { id: 'TXN-20260910-0766', type: 'trade',  action: 'sell',       symbol: 'MSFT', description: 'Sell MSFT — Microsoft Corp',     quantity: 80,  price: 432.15, amount: 34572.00, status: 'pending',  accountId: 'ACC-78341', accountName: 'Harrington Family Trust', branchId: 'BRN-NYC01', firmId: 'FIRM-001', tradeDate: '2026-09-10', settleDate: '2026-09-12', csrId: 'REP-001', csrName: 'Sofia Nakamura' },
  { id: 'TXN-20260910-0702', type: 'trade',  action: 'buy',        symbol: 'AMZN', description: 'Buy AMZN — Amazon.com',          quantity: 80,  price: 198.40, amount: 15872.00, status: 'settled',  accountId: 'ACC-78342', accountName: 'Priscilla Vance',         branchId: 'BRN-NYC01', firmId: 'FIRM-001', tradeDate: '2026-09-10', settleDate: '2026-09-12', csrId: 'REP-001', csrName: 'Sofia Nakamura' },
  { id: 'TXN-20260910-0655', type: 'cash',   action: 'deposit',                    description: 'Wire Transfer Deposit',                              amount: 410000.00,status: 'settled',  accountId: 'ACC-78344', accountName: 'GlobalTech Pension Fund', branchId: 'BRN-NYC01', firmId: 'FIRM-001', tradeDate: '2026-09-10', settleDate: '2026-09-10', csrId: 'REP-002', csrName: 'Marcus Webb' },
  { id: 'TXN-20260909-1122', type: 'cash',   action: 'deposit',                    description: 'Wire Transfer Deposit',                              amount: 50000.00, status: 'settled',  accountId: 'ACC-78341', accountName: 'Harrington Family Trust', branchId: 'BRN-NYC01', firmId: 'FIRM-001', tradeDate: '2026-09-09', settleDate: '2026-09-09', csrId: 'REP-001', csrName: 'Sofia Nakamura' },
  { id: 'TXN-20260909-1044', type: 'trade',  action: 'buy',        symbol: 'TSLA', description: 'Buy TSLA — Tesla Inc.',          quantity: 400, price: 312.70, amount: 125080.00,status: 'settled',  accountId: 'ACC-78350', accountName: 'Lakeshore Holdings LLC',  branchId: 'BRN-CHI01', firmId: 'FIRM-001', tradeDate: '2026-09-09', settleDate: '2026-09-11', csrId: 'REP-003', csrName: 'Priya Kapoor' },
  { id: 'TXN-20260908-0512', type: 'cash',   action: 'withdrawal',                 description: 'ACH Withdrawal — Chase ****4821',                    amount: 12500.00, status: 'settled',  accountId: 'ACC-78341', accountName: 'Harrington Family Trust', branchId: 'BRN-NYC01', firmId: 'FIRM-001', tradeDate: '2026-09-08', settleDate: '2026-09-08', csrId: 'REP-001', csrName: 'Sofia Nakamura' },
  { id: 'TXN-20260908-0488', type: 'trade',  action: 'buy',        symbol: 'VYM',  description: 'Buy VYM — Vanguard High Div',   quantity: 1200,price: 121.40, amount: 145680.00,status: 'settled',  accountId: 'ACC-78351', accountName: 'Raymond & Diane Osei',    branchId: 'BRN-CHI01', firmId: 'FIRM-001', tradeDate: '2026-09-08', settleDate: '2026-09-10', csrId: 'REP-003', csrName: 'Priya Kapoor' },
  { id: 'TXN-20260907-0391', type: 'trade',  action: 'buy',        symbol: 'AAPL', description: 'Buy AAPL — Apple Inc',           quantity: 200, price: 228.85, amount: 45770.00, status: 'cancelled',accountId: 'ACC-78341', accountName: 'Harrington Family Trust', branchId: 'BRN-NYC01', firmId: 'FIRM-001', tradeDate: '2026-09-07', settleDate: '2026-09-09', csrId: 'REP-001', csrName: 'Sofia Nakamura', notes: 'Cancelled per client request.' },
  { id: 'TXN-20260907-0380', type: 'trade',  action: 'buy',        symbol: 'NFLX', description: 'Buy NFLX — Netflix Inc.',        quantity: 200, price: 718.40, amount: 143680.00,status: 'settled',  accountId: 'ACC-78360', accountName: 'Castellan Media Trust',   branchId: 'BRN-LA01',  firmId: 'FIRM-001', tradeDate: '2026-09-07', settleDate: '2026-09-09', csrId: 'REP-005', csrName: 'Lynn Castillo' },
  { id: 'TXN-20260906-0288', type: 'stock',  action: 'transfer',   symbol: 'TSLA', description: 'DTC Transfer Out — TSLA',       quantity: 50,  price: 312.70, amount: 15635.00, status: 'settled',  accountId: 'ACC-78341', accountName: 'Harrington Family Trust', branchId: 'BRN-NYC01', firmId: 'FIRM-001', tradeDate: '2026-09-06', settleDate: '2026-09-08', csrId: 'REP-001', csrName: 'Sofia Nakamura' },
  { id: 'TXN-20260905-0199', type: 'cash',   action: 'dividend',   symbol: 'JNJ',  description: 'Dividend Credit — JNJ',                             amount: 847.20,   status: 'settled',  accountId: 'ACC-78341', accountName: 'Harrington Family Trust', branchId: 'BRN-NYC01', firmId: 'FIRM-001', tradeDate: '2026-09-05', settleDate: '2026-09-05', csrId: 'REP-001', csrName: 'Sofia Nakamura' },
  { id: 'TXN-20260904-0144', type: 'trade',  action: 'buy',        symbol: 'SPY',  description: 'Buy SPY — SPDR S&P 500 ETF',    quantity: 100, price: 558.30, amount: 55830.00, status: 'rebilled', accountId: 'ACC-78341', accountName: 'Harrington Family Trust', branchId: 'BRN-NYC01', firmId: 'FIRM-001', tradeDate: '2026-09-04', settleDate: '2026-09-06', csrId: 'REP-001', csrName: 'Sofia Nakamura', notes: 'Rebilled after fee correction.' },
  { id: 'TXN-20260903-0088', type: 'stock',  action: 'transfer',   symbol: 'AMZN', description: 'DTC Transfer In — AMZN',        quantity: 30,  price: 198.40, amount: 5952.00,  status: 'failed',   accountId: 'ACC-78341', accountName: 'Harrington Family Trust', branchId: 'BRN-NYC01', firmId: 'FIRM-001', tradeDate: '2026-09-03', settleDate: '2026-09-05', csrId: 'REP-001', csrName: 'Sofia Nakamura', notes: 'DTC rejected — CUSIP mismatch.' },
  { id: 'TXN-20260902-0055', type: 'cash',   action: 'deposit',                    description: 'Wire Deposit',                                       amount: 62500.00, status: 'settled',  accountId: 'ACC-78350', accountName: 'Lakeshore Holdings LLC',  branchId: 'BRN-CHI01', firmId: 'FIRM-001', tradeDate: '2026-09-02', settleDate: '2026-09-02', csrId: 'REP-003', csrName: 'Priya Kapoor' },
  { id: 'TXN-20260901-0010', type: 'cash',   action: 'deposit',                    description: 'ACH Deposit',                                        amount: 38000.00, status: 'settled',  accountId: 'ACC-78360', accountName: 'Castellan Media Trust',   branchId: 'BRN-LA01',  firmId: 'FIRM-001', tradeDate: '2026-09-01', settleDate: '2026-09-01', csrId: 'REP-005', csrName: 'Lynn Castillo' },
];

// ── Scope filters ─────────────────────────────────────────────────────────────

/** Transactions visible to a user based on their role */
export function scopedTransactions(user: User): Transaction[] {
  if (user.level === 'firm')    return MOCK_TRANSACTIONS;
  if (user.level === 'branch')  return MOCK_TRANSACTIONS.filter(t => t.branchId === user.branchId);
  if (user.level === 'csr')     return MOCK_TRANSACTIONS.filter(t => t.csrId === user.csrId);
  if (user.level === 'account') return MOCK_TRANSACTIONS.filter(t => t.accountId === user.accountId);
  return [];
}

export function scopedAccounts(user: User): AccountRecord[] {
  if (user.level === 'firm')    return MOCK_ACCOUNTS;
  if (user.level === 'branch')  return MOCK_ACCOUNTS.filter(a => a.branchId === user.branchId);
  if (user.level === 'csr')     return MOCK_ACCOUNTS.filter(a => a.repId === user.csrId);
  if (user.level === 'account') return MOCK_ACCOUNTS.filter(a => a.id === user.accountId);
  return [];
}

export function scopedPositions(user: User): Position[] {
  if (user.level === 'firm')    return MOCK_POSITIONS;
  if (user.level === 'branch')  return MOCK_POSITIONS.filter(p => p.branchId === user.branchId);
  if (user.level === 'csr')     return MOCK_POSITIONS.filter(p => scopedAccounts(user).some(a => a.id === p.accountId));
  if (user.level === 'account') return MOCK_POSITIONS.filter(p => p.accountId === user.accountId);
  return [];
}

export function scopedBalances(user: User): Balance[] {
  if (user.level === 'firm')    return MOCK_BALANCES;
  if (user.level === 'branch')  return MOCK_BALANCES.filter(b => b.branchId === user.branchId);
  if (user.level === 'csr')     return MOCK_BALANCES.filter(b => scopedAccounts(user).some(a => a.id === b.accountId));
  if (user.level === 'account') return MOCK_BALANCES.filter(b => b.accountId === user.accountId);
  return [];
}
