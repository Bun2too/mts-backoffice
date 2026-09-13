export type UserLevel = 'firm' | 'branch' | 'csr' | 'account';

export interface User {
  id: string;
  level: UserLevel;
  firmId: string;
  firmName: string;
  branchId?: string;
  branchName?: string;
  csrId?: string;
  csrName?: string;
  accountId?: string;
  accountName?: string;
  email: string;
  phone: string;
  name: string;
  role: string;
  status: 'active' | 'suspended' | 'pending';
  lastLogin: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  firmId: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  managerName: string;
  managerId: string;
  status: 'active' | 'inactive';
  accountCount: number;
  createdAt: string;
}

export interface Rep {
  id: string;
  firmId: string;
  branchId: string;
  branchName: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  accountCount: number;
  assignedAccountIds?: string[];
}

export interface AccountRecord {
  id: string;
  firmId: string;
  branchId: string;
  branchName: string;
  repId: string;
  repName: string;
  ownerName: string;
  email: string;
  phone: string;
  type: 'individual' | 'joint' | 'trust' | 'ira' | 'corporate';
  status: 'active' | 'suspended' | 'closed' | 'pending';
  openedAt: string;
  cashBalance: number;
  portfolioValue: number;
  totalValue: number;
  dayPnl: number;
  dayPnlPct: number;
}

export interface Position {
  id: string;
  accountId: string;
  accountName: string;
  branchId: string;
  firmId: string;
  symbol: string;
  description: string;
  assetClass: 'equity' | 'etf' | 'bond' | 'option' | 'mutual_fund';
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  dayChange: number;
  dayChangePct: number;
  lastUpdated: string;
}

export interface Balance {
  accountId: string;
  accountName: string;
  branchId: string;
  branchName: string;
  firmId: string;
  cashBalance: number;
  marginBalance: number;
  portfolioValue: number;
  totalEquity: number;
  buyingPower: number;
  marginUsed: number;
  marginAvailable: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  dayPnl: number;
  dayPnlPct: number;
  asOf: string;
}

export type TxType = 'trade' | 'cash' | 'stock';
export type TxStatus = 'settled' | 'pending' | 'cancelled' | 'rebilled' | 'failed';
export type TxAction = 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'transfer' | 'dividend';

export interface Transaction {
  id: string;
  type: TxType;
  action: TxAction;
  symbol?: string;
  description: string;
  quantity?: number;
  price?: number;
  amount: number;
  status: TxStatus;
  accountId: string;
  accountName: string;
  branchId: string;
  firmId: string;
  tradeDate: string;
  settleDate: string;
  csrId: string;
  csrName: string;
  notes?: string;
}

export type AppView =
  | 'login'
  | 'dashboard'
  | 'transactions'
  | 'positions'
  | 'balances'
  | 'branches'
  | 'accounts'
  | 'profile'
  | 'users'
  | 'reps'
  | 'firm-settings';

// Permission helpers
export const canEditData = (level: UserLevel) => level === 'firm' || level === 'branch';
export const canManageBranches = (level: UserLevel) => level === 'firm';
export const canManageAccounts = (level: UserLevel) => level === 'firm';
export const canAssignRep = (level: UserLevel) => level === 'firm';

export type Theme = 'dark' | 'light';
export interface AppUserRecord {
  id: string; name: string; email: string; phone: string; level: UserLevel;
  role: string; firmId: string; branchId?: string; repId?: string; accountId?: string;
  status: User['status']; createdAt: string; approvedBy?: string; password?: string; lastLogin?: string;
}
export interface PendingRegistration {
  id: string; name: string; email: string; phone: string; desiredLevel: UserLevel;
  branchId?: string; accountId?: string; repId?: string; password: string;
  message: string; submittedAt: string; status: 'pending' | 'approved' | 'rejected';
}
export interface FirmInfo {
  logoDataUrl?: string;
  id: string; name: string; legalName: string; address: string; city: string;
  state: string; zip: string; country: string; phone: string; email: string;
  website: string; foundedYear: string; aum: string; crd: string; ein: string;
  licenseType: string; regulatoryBody: string; status: 'active' | 'inactive';
}
export interface DemoData {
  version: 1;
  transactions: Transaction[]; accounts: AccountRecord[]; positions: Position[];
  branches: Branch[]; reps: Rep[]; appUsers: AppUserRecord[];
  registrations: PendingRegistration[]; firmInfo: FirmInfo;
}
