"""
ASTID Compliance Narrative & Regulatory SAR Generator via Groq Cloud LPU
Translates TreeSHAP feature weights, Autoencoder anomaly signals, and rule triggers
into institutional Suspicious Activity Reports (SAR).
"""

import json
import os
import time
import urllib.request
from typing import Dict, Any, Tuple

GROQ_API_KEY = os.environ.get(
    "GROQ_API_KEY",
    "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"
)
GROQ_MODEL = "qwen/qwen3.8-27b"

class LLMNarrativeService:
    def __init__(self, api_key: str = GROQ_API_KEY, model: str = GROQ_MODEL):
        self.api_key = api_key
        self.model = model

    def generate_narrative(self, case: Dict[str, Any]) -> Tuple[str, str, float]:
        """
        Generates an AML/Fraud SAR Narrative using Groq LPU.
        Returns:
            (narrative: str, model_used: str, latency_ms: float)
        """
        start_t = time.time()
        tx_id = case.get("id") or case.get("transaction_id", "TX-UNKNOWN")
        amount = case.get("amount", 0.0)
        branch = case.get("branch", "Central Banking Hub")
        score = case.get("score", 0.0)
        kind = case.get("kind", "review").upper()
        reasons = case.get("reasons", [])
        chain = case.get("chain", [])
        orig = case.get("originAcc") or (chain[0] if chain else "UNKNOWN")
        dest = case.get("destVpa") or (chain[1] if len(chain) > 1 else "UNKNOWN")

        # Fallback template if network/key fails
        template_fallback = (
            f"Case {tx_id} involving an amount of INR {amount:,.2f} at branch {branch} "
            f"was assigned a calibrated risk score of {score:.2f} ({kind}). "
            f"Key risk triggers observed: {'; '.join(reasons) if reasons else 'Elevated monetary variance'}. "
            f"Funds route from account {orig} towards {dest}. "
            f"Recommended Action: Immediate compliance review and counterparty hold pending customer contact."
        )

        if not self.api_key:
            return template_fallback, "Template-Deterministic (Offline)", 0.5

        prompt = f"""
You are an expert Anti-Money Laundering (AML) Compliance Officer for ASTID Financial Defense.
Draft a concise, regulatory-grade SAR (Suspicious Activity Report) narrative for an investigator based on these real-time signals:

- Case ID: {tx_id}
- Transaction Amount: INR {amount:,.2f}
- Branch Jurisdiction: {branch}
- Calibrated Risk Score: {score:.2f} (Verdict Tier: {kind})
- Originating Account: {orig}
- Beneficiary Counterparty: {dest}
- Triggered Rules & TreeSHAP Attributes:
{chr(10).join([f"  • {r}" for r in reasons])}

Instructions:
1. Write a professional, 1-to-2 paragraph regulatory SAR narrative.
2. Highlight the specific fraud topology (e.g., account liquidation, money mule layering, impossible travel).
3. State the operational recommendation (e.g., temporary account freeze, beneficiary clawback, SAR filing).
Keep it objective, factual, and legally defensible.
"""

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a senior banking AML fraud investigator drafting concise, legally robust SAR summaries."
                },
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 400,
            "temperature": 0.2
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "ASTID-RiskOps/1.0 (Windows NT 10.0; Win64; x64)"
        }

        try:
            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                narrative = data["choices"][0]["message"]["content"].strip()
                latency_ms = (time.time() - start_t) * 1000.0
                return narrative, f"{self.model} (Groq LPU)", round(latency_ms, 1)

        except Exception as e:
            print(f"[LLMNarrativeService] Groq API call failed: {e}. Falling back to template.")
            latency_ms = (time.time() - start_t) * 1000.0
            return template_fallback, "Template-Deterministic (Fallback)", round(latency_ms, 1)

# Singleton
narrative_service = LLMNarrativeService()
