"""
ASTID Background Persistence & Storage Service
Executes out-of-band in FastAPI BackgroundTasks to isolate scoring latency (<15ms).
Supports hosted Supabase PostgreSQL with automatic local store fallback.
"""

import os
import json
import time
import uuid
from typing import Dict, Any, List, Optional
import urllib.request
import urllib.error

# Ensure environment variables are loaded
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

BRANCH_MAP = {
    "Kolkata-SaltLake": "b1111111-1111-1111-1111-111111111111",
    "Mumbai-BKC": "b2222222-2222-2222-2222-222222222222",
    "Bengaluru-HSR": "b3333333-3333-3333-3333-333333333333",
    "Delhi-Connaught": "b4444444-4444-4444-4444-444444444444",
    "Chennai-Guindy": "b5555555-5555-5555-5555-555555555555",
}

class StorageService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        self.is_cloud = bool(self.supabase_url and self.supabase_key)
        self.local_store: List[Dict[str, Any]] = []
        self.escalations_store: Dict[str, Dict[str, Any]] = {}

    def persist_transaction(self, tx_record: Dict[str, Any]) -> None:
        """Asynchronously persists scored transaction out-of-band."""
        # Always maintain in-memory copy for fast workbench retrieval
        self.local_store.append(tx_record)

        # If escalated, store in escalations state machine
        if tx_record.get("final_verdict") in ("ESCALATE", "BLOCK"):
            esc_id = f"ESC-{int(time.time() * 1000) % 1000000}"
            self.escalations_store[esc_id] = {
                "escalation_id": esc_id,
                "transaction_id": tx_record.get("transaction_id"),
                "amount": tx_record.get("amount"),
                "name_orig": tx_record.get("name_orig"),
                "name_dest": tx_record.get("name_dest"),
                "severity": "critical" if tx_record.get("final_verdict") == "BLOCK" else "high",
                "status": "open",
                "sla_deadline": time.time() + 900.0, # 15 minutes
                "created_at": time.time(),
                "assigned_to": None,
                "resolution": None
            }

        if self.is_cloud:
            try:
                branch_id = BRANCH_MAP.get(tx_record.get("branch", ""), "b2222222-2222-2222-2222-222222222222")
                tx_id = str(tx_record.get("transaction_id") or uuid.uuid4())
                
                # Ensure valid UUID
                try:
                    uuid.UUID(tx_id)
                except ValueError:
                    tx_id = str(uuid.uuid4())

                supabase_payload = {
                    "transaction_id": tx_id,
                    "ingestion_hash": str(uuid.uuid4()),
                    "branch_id": branch_id,
                    "model_id": "m0000000-0000-0000-0000-000000000001",
                    "step": int(tx_record.get("step", 744)),
                    "tx_type": tx_record.get("type", "TRANSFER"),
                    "amount": float(tx_record.get("amount", 0.0)),
                    "name_orig": str(tx_record.get("name_orig", "")),
                    "name_dest": str(tx_record.get("name_dest", "")),
                    "old_balance_orig": float(tx_record.get("oldbalanceOrg", 0.0)),
                    "old_balance_dest": float(tx_record.get("oldbalanceDest", 0.0)),
                    "source": "live_demo",
                    "xgb_prob": float(tx_record.get("risk_score", 0.0)),
                    "ae_mse": float(tx_record.get("ae_raw_mse", 0.0)),
                    "ae_norm_score": float(tx_record.get("zero_day_ae_score", 0.0)),
                    "combined_score": float(tx_record.get("risk_score", 0.0)),
                    "final_verdict": tx_record.get("final_verdict", "APPROVE"),
                    "whitebox_insights": tx_record.get("whitebox_insights", [])
                }

                # Post to Supabase REST endpoint: /rest/v1/transactions
                url = f"{self.supabase_url}/rest/v1/transactions"
                req = urllib.request.Request(
                    url,
                    data=json.dumps(supabase_payload).encode('utf-8'),
                    headers={
                        "apikey": self.supabase_key,
                        "Authorization": f"Bearer {self.supabase_key}",
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal"
                    },
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=5) as response:
                    pass
            except Exception as e:
                # If Supabase table isn't migrated yet, local fallback takes over seamlessly
                pass

    def claim_escalation(self, escalation_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        if escalation_id in self.escalations_store:
            esc = self.escalations_store[escalation_id]
            esc["status"] = "assigned"
            esc["assigned_to"] = user_id
            return esc
        return None

    def resolve_escalation(self, escalation_id: str, verdict: str, notes: str) -> Optional[Dict[str, Any]]:
        if escalation_id in self.escalations_store:
            esc = self.escalations_store[escalation_id]
            esc["status"] = "resolved"
            esc["resolution"] = {
                "verdict": verdict,
                "notes": notes,
                "resolved_at": time.time()
            }
            return esc
        return None

# Singleton instance
storage_instance = StorageService()
