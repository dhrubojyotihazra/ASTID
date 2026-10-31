export type Role = 'analyst' | 'senior' | 'lead' | 'admin';
export type BaseCase = {
  id: string;
  amount: number;
  branch: string;
  score: number;
  kind: 'review' | 'escalate';
  due?: number;
  reasons: string[];
  chain: string[];
  originAcc?: string;
  destVpa?: string;
  isHighValue?: boolean;
};

export type BranchMetric = {
  name: string;
  region: string;
  totalTxns: number;
  fraudPrevented: number;
  reviewRate: string;
};

export const BRANCHES: BranchMetric[] = [
  { name: 'Kolkata-SaltLake', region: 'Eastern Hub', totalTxns: 1272524, fraudPrevented: 36820000, reviewRate: '1.2%' },
  { name: 'Mumbai-BKC', region: 'Western Financial Centre', totalTxns: 1452110, fraudPrevented: 52140000, reviewRate: '1.4%' },
  { name: 'Bengaluru-HSR', region: 'Southern Tech Corridor', totalTxns: 1318400, fraudPrevented: 41200000, reviewRate: '1.1%' },
  { name: 'Delhi-Connaught', region: 'Northern Commercial Hub', totalTxns: 1208680, fraudPrevented: 34500000, reviewRate: '1.3%' },
  { name: 'Chennai-Guindy', region: 'Southern Industrial Hub', totalTxns: 1110906, fraudPrevented: 29560000, reviewRate: '1.0%' },
];

// Ground truth metrics across all 6.36M warehouse transactions
export const SYSTEM_METRICS = {
  totalTransactions: 6362620,
  fraudPreventedTotal: 194220000,
  avgReviewRate: '1.2%',
  activeModelVersion: 'v2.4 (Active)',
  driftIndex: 0.0421,
  stabilityStatus: 'Healthy · Stability 99.8%',
};

export const BASE_CASES: BaseCase[] = [
  {
    id: 'R-1041',
    amount: 245000,
    branch: 'Kolkata-SaltLake',
    score: 0.88,
    kind: 'escalate',
    due: 540,
    reasons: ['99.8% balance drained in single transfer', 'Immediate subsequent cash-out within 3 minutes', 'Off-hours activity at 11:45 PM for account profile'],
    chain: ['C1231006815', 'mule@okaxis', 'ATM-CashOut-WB02'],
    originAcc: 'C1231006815',
    destVpa: 'mule@okaxis',
    isHighValue: true,
  },
  {
    id: 'R-1042',
    amount: 74500,
    branch: 'Mumbai-BKC',
    score: 0.62,
    kind: 'review',
    reasons: ['First-time unverified payee at 3:15 AM', 'Transaction amount 4.2x above 30-day moving average'],
    chain: ['C9041284102', 'payee-new@icici'],
    originAcc: 'C9041284102',
    destVpa: 'payee-new@icici',
    isHighValue: false,
  },
  {
    id: 'R-1043',
    amount: 42000,
    branch: 'Delhi-Connaught',
    score: 0.79,
    kind: 'escalate',
    due: 200,
    reasons: ['Impossible travel velocity: 1,420 km/h between Kolkata and Mumbai', 'Concurrent device sessions detected within 18 minutes'],
    chain: ['Session-Kolkata-IP', 'Session-Mumbai-IP', 'Payee-Delhi'],
    originAcc: 'C4512991040',
    destVpa: 'vendor@paytm',
    isHighValue: false,
  },
  {
    id: 'R-1044',
    amount: 185000,
    branch: 'Bengaluru-HSR',
    score: 0.55,
    kind: 'review',
    reasons: ['High burst velocity: 6 rapid transfers within 60 minutes', 'Transaction value deviates sharply from account norm'],
    chain: ['C3341029188', 'payee-A@okhdfc', 'payee-B@okaxis'],
    originAcc: 'C3341029188',
    destVpa: 'payee-A@okhdfc',
    isHighValue: true,
  },
  {
    id: 'R-1045',
    amount: 9800,
    branch: 'Chennai-Guindy',
    score: 0.41,
    kind: 'review',
    reasons: ['Payment frequency spike following 45 days of dormancy'],
    chain: ['C7819023411', 'retailer@ybl'],
    originAcc: 'C7819023411',
    destVpa: 'retailer@ybl',
    isHighValue: false,
  },
  {
    id: 'R-1046',
    amount: 512000,
    branch: 'Mumbai-BKC',
    score: 0.93,
    kind: 'escalate',
    due: -120,
    reasons: ['Transferred through high-risk cluster connected to prior fraud alerts', 'Destination account previously marked in suspicious money trail'],
    chain: ['C5120993812', 'mule1@sbi', 'mule2@barodampay', 'ATM-CashOut-MH01'],
    originAcc: 'C5120993812',
    destVpa: 'mule1@sbi',
    isHighValue: true,
  },
  {
    id: 'R-1047',
    amount: 31500,
    branch: 'Kolkata-SaltLake',
    score: 0.36,
    kind: 'review',
    reasons: ['Unrecognized device fingerprint and browser user-agent change'],
    chain: ['C2234019284', 'merchant-quick@axis'],
    originAcc: 'C2234019284',
    destVpa: 'merchant-quick@axis',
    isHighValue: false,
  },
  {
    id: 'R-1048',
    amount: 67000,
    branch: 'Kolkata-SaltLake',
    score: 0.47,
    kind: 'review',
    reasons: ['Late-night transfer velocity outside customer historic profile', 'First payment to newly added beneficiary'],
    chain: ['C8819203144', 'new-payee@ibl'],
    originAcc: 'C8819203144',
    destVpa: 'new-payee@ibl',
    isHighValue: false,
  },
  {
    id: 'R-1049',
    amount: 128000,
    branch: 'Kolkata-SaltLake',
    score: 0.58,
    kind: 'review',
    reasons: ['3 successive transfers in 40 minutes', 'Account ledger balance depleted by 80%'],
    chain: ['C6619028441', 'payee-split1@hdfc', 'payee-split2@sbi'],
    originAcc: 'C6619028441',
    destVpa: 'payee-split1@hdfc',
    isHighValue: true,
  },
];
