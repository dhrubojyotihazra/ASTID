/**
 * ASTID RiskOps API Client
 * Connects frontend dashboard workbench to FastAPI Real-Time ML Engine
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
    const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function scoreLiveTransaction(tx: ScoreRequest): Promise<ScoreResponse> {
  const idempotencyKey = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const res = await fetch(`${API_BASE}/score/live`, {
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
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Scoring API failed (${res.status}): ${errText}`);
  }

  return await res.json();
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
    const res = await fetch(`${API_BASE}/escalations/${escId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason, user_id: userId }),
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




