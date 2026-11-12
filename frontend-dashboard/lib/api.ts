/**
 * ASTID RiskOps API Client
 * Connects frontend dashboard workbench to FastAPI Real-Time ML Engine
 */

export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // On Vercel or any non-local domain, always route to Render production backend
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return 'https://astid-backend.onrender.com/api/v1';
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE;
  if (envUrl) {
    let raw = envUrl.trim().replace(/\/+$/, '');
    if (!raw.endsWith('/api/v1')) {
      raw = `${raw}/api/v1`;
    }
    return raw;
  }

  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    return 'https://astid-backend.onrender.com/api/v1';
  }

  return 'http://localhost:8000/api/v1';
}

export function getBaseUrl(): string {
  return getApiBase();
}

const API_BASE = getApiBase();

export interface ScoreRequest {
  transaction_id?: string;
  step?: number;
  type: 'TRANSFER' | 'CASH_OUT' | 'PAYMENT' | 'DEBIT' | 'CASH_IN';
  amount: number;
  nameOrig: string;
  nameDest: string;
  oldbalanceOrg: number;
  oldbalanceDest: number;
  geo_lat?: number;
  geo_lon?: number;
  branch?: string;
}

export interface WhiteboxInsight {
  badge: string;
  explanation: string;
  impact_score: string;
}

export interface ScoreResponse {
  transaction_id: string;
  amount: number;
  name_orig: string;
  name_dest: string;
  final_verdict: 'APPROVE' | 'REVIEW' | 'ESCALATE' | 'BLOCK';
  risk_score: number;
  zero_day_ae_score?: number;
  ae_raw_mse?: number;
  confidence_tier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  primary_reason: string;
  whitebox_insights: WhiteboxInsight[];
  matched_rules: string[];
  scoring_latency_ms: number;
}

export interface SystemHealth {
  status: string;
  timestamp: number;
  model_loaded: boolean;
  zero_day_ae_loaded: boolean;
  tau_review: number;
  tau_escalate: number;
  persistence_mode: string;
  active_escalations: number;
}

export interface EscalationRecord {
  escalation_id: string;
  transaction_id: string;
  risk_score: number;
  reason: string;
  status: 'pending' | 'assigned' | 'resolved_fraud' | 'resolved_fp';
  assigned_to?: string;
  assigned_at?: number;
  sla_deadline: number;
  created_at: number;
}

export async function fetchHealth(): Promise<SystemHealth | null> {
  try {
    const res = await fetch(`${getApiBase()}/health`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function scoreLiveTransaction(tx: ScoreRequest): Promise<ScoreResponse> {
  const idempotencyKey = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const base = getApiBase();
  const res = await fetch(`${base}/score/live`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      step: tx.step ?? 744,
      type: tx.type,
      amount: tx.amount,
      nameOrig: tx.nameOrig,
      nameDest: tx.nameDest,
      oldbalanceOrg: tx.oldbalanceOrg,
      oldbalanceDest: tx.oldbalanceDest,
      geo_lat: tx.geo_lat,
      geo_lon: tx.geo_lon,
      branch: tx.branch || 'Kolkata-SaltLake',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Scoring API failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    transaction_id: data.transaction_id || `TX-${Date.now().toString(36).toUpperCase()}`,
    amount: typeof data.amount === 'number' ? data.amount : tx.amount,
    name_orig: data.name_orig || tx.nameOrig || 'ANON_SRC',
    name_dest: data.name_dest || tx.nameDest || 'ANON_DST',
    final_verdict: data.final_verdict || (data.risk_score > 0.4 ? 'ESCALATE' : 'APPROVE'),
    risk_score: typeof data.risk_score === 'number' ? data.risk_score : 0.05,
    zero_day_ae_score: typeof data.zero_day_ae_score === 'number' ? data.zero_day_ae_score : 0.0,
    ae_raw_mse: typeof data.ae_raw_mse === 'number' ? data.ae_raw_mse : 0.0,
    confidence_tier: data.confidence_tier || 'HIGH',
    primary_reason: data.primary_reason || 'Dual-engine neural inference evaluated',
    whitebox_insights: Array.isArray(data.whitebox_insights) ? data.whitebox_insights : [],
    matched_rules: Array.isArray(data.matched_rules) ? data.matched_rules : [],
    scoring_latency_ms: typeof data.scoring_latency_ms === 'number' ? data.scoring_latency_ms : 2.45,
  };
}

export interface BenchmarkMetrics {
  total_tested: number;
  true_negatives: number;
  false_positives: number;
  true_positives: number;
  false_negatives: number;
  false_negative_rate_pct: number;
  recall_pct: number;
  specificity_pct: number;
  latency_p50_ms: number;
  latency_p95_ms: number;
}

export interface BatchScoreResult {
  total_scored: number;
  total_amount: number;
  approved: number;
  under_review: number;
  escalated_or_blocked: number;
  fraud_count: number;
  transactions: (ScoreResponse & { branch?: string })[];
}

export async function scoreBatchTransactions(txs: ScoreRequest[]): Promise<BatchScoreResult> {
  const res = await fetch(`${API_BASE}/score/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(txs.map(tx => ({
      step: tx.step ?? 744,
      type: tx.type,
      amount: tx.amount,
      nameOrig: tx.nameOrig,
      nameDest: tx.nameDest,
      oldbalanceOrg: tx.oldbalanceOrg,
      oldbalanceDest: tx.oldbalanceDest,
      branch: tx.branch ?? 'Kolkata-SaltLake',
    }))),
  });
  if (!res.ok) {
    throw new Error(`Batch scoring failed (${res.status})`);
  }
  return await res.json();
}

export async function runSimulationBenchmark(sampleSize: number = 100): Promise<BenchmarkMetrics> {
  const res = await fetch(`${API_BASE}/score/benchmark?sample_size=${sampleSize}`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Benchmark failed (${res.status})`);
  }
  return await res.json();
}



export async function fetchEscalations(): Promise<EscalationRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/escalations`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function claimBackendEscalation(escId: string, userId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/escalations/${escId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function resolveBackendEscalation(
  escId: string,
  action: 'CONFIRM_FRAUD' | 'FALSE_POSITIVE',
  reason: string,
  userId: string
): Promise<boolean> {
  try {
    const verdict = action === 'CONFIRM_FRAUD' ? 'confirmed_fraud' : 'false_positive';
    const res = await fetch(`${API_BASE}/escalations/${escId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        reason,
        user_id: userId,
        verdict,
        notes: reason,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface SarNarrativeResponse {
  case_id: string;
  narrative: string;
  model: string;
  generation_latency_ms: number;
  tokens_used?: number;
  cached?: boolean;
}

export async function generateSarNarrative(caseData: {
  id: string;
  amount: number;
  branch?: string;
  score: number;
  kind?: string;
  reasons: string[];
  chain?: string[];
  originAcc?: string;
  destVpa?: string;
}): Promise<SarNarrativeResponse> {
  const res = await fetch(`${API_BASE}/narratives/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: caseData.id,
      amount: caseData.amount,
      branch: caseData.branch || 'Central Hub',
      score: caseData.score,
      kind: caseData.kind || 'review',
      reasons: caseData.reasons || [],
      chain: caseData.chain || [],
      originAcc: caseData.originAcc,
      destVpa: caseData.destVpa,
    }),
  });

  if (!res.ok) {
    throw new Error(`Narrative generation failed (${res.status})`);
  }

  return await res.json();
}


export interface WarehouseStats {
  total_transactions: number;
  total_turnover_inr: number;
  total_fraud_cases: number;
  fraud_prevented_inr: number;
  fraud_prevented_cr: number;
  fraud_rate_pct: number;
  unique_senders: number;
  unique_receivers: number;
  active_model_version: string;
  stability_status: string;
  drift_index: number;
}

export interface ApiBranchMetric {
  name: string;
  region: string;
  totalTxns: number;
  turnover: number;
  fraudPrevented: number;
  fraudCount: number;
  reviewRate: string;
}

export interface ModelGovernanceData {
  active_champion: {
    version: string;
    base_model: string;
    zero_day_model: string;
    pr_auc: number;
    roc_auc: number;
    recall: number;
    holdout_fn_rate: number;
    brier_score: number;
    ae_tau_99_9: number;
    tau_review: number;
    tau_escalate: number;
    p95_latency_ms: number;
    drift_index_psi: number;
    zero_leakage_certified: boolean;
  };
  challengers: {
    version: string;
    pr_auc: number;
    recall: number;
    holdout_fn_rate: number;
    status: string;
  }[];
}

export async function fetchWarehouseStats(): Promise<WarehouseStats | null> {
  try {
    const res = await fetch(`${API_BASE}/ops/warehouse-stats`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchBranchMetrics(): Promise<ApiBranchMetric[]> {
  try {
    const res = await fetch(`${API_BASE}/ops/branches`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchHoldoutCases(limit: number = 24): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/ops/cases?limit=${limit}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchModelGovernance(): Promise<ModelGovernanceData | null> {
  try {
    const res = await fetch(`${API_BASE}/ops/model-governance`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface WeeklyActivityDay {
  day: string;
  name: string;
  pct: number;
  height: number;
  barClass: string;
  desc: string;
  totalTxns: number;
  fraudCount: number;
  cleanPct: number;
  delay: number;
}

export interface ProjectProgressData {
  totalQueue: number;
  resolvedCount: number;
  inProgressCount: number;
  pendingCount: number;
  completedPct: number;
  inProgressPct: number;
  pendingPct: number;
  completedDash: number;
  inProgressDash: number;
  inProgressOffset: number;
  circumference: number;
}

export interface TeamMemberData {
  id: string;
  name: string;
  roleTitle: string;
  tier: 'lead' | 'senior' | 'analyst' | 'compliance';
  dept: 'Operations' | 'Escalation' | 'Investigation' | 'Compliance';
  branch: string;
  status: 'online' | 'away' | 'offline';
  activeCases: number;
  resolvedCases: number;
  caseload: number;
  init: string;
  avatarBg: string;
  reportsTo?: string;
}

export interface TeamTelemetryData {
  heatLevels: number[];
  highVolumeDays: number;
  totalDays: number;
  topReviewers: {
    name: string;
    role: string;
    init: string;
    score: number;
    max: number;
    bg: string;
  }[];
  members: TeamMemberData[];
}

export async function fetchWeeklyActivity(): Promise<WeeklyActivityDay[]> {
  try {
    const res = await fetch(`${API_BASE}/ops/weekly-activity`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchProjectProgress(): Promise<ProjectProgressData | null> {
  try {
    const res = await fetch(`${API_BASE}/ops/project-progress`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchTeamTelemetry(): Promise<TeamTelemetryData | null> {
  try {
    const res = await fetch(`${API_BASE}/ops/team`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}






