"""
ASTID Background Persistence & Storage Service
Executes out-of-band in FastAPI BackgroundTasks to isolate scoring latency (<15ms).
Supports hosted Supabase PostgreSQL (Option B) with automatic local store fallback.
"""

import os
import json
import time
from typing import Dict, Any, List, Optional
import urllib.request
import urllib.error

class StorageService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        self.is_cloud = bool(self.supabase_url and self.supabase_key)
        self.local_store: List[Dict[str, Any]] = []
        self.escalations_store: Dict[str, Dict[str, Any]] = {}

    def persist_transaction(self, tx_record: Dict[str, Any]) -> None:
        """Asynchronously persists scored transaction out-of-band."""
        if self.is_cloud:
            try:
                # Post to Supabase REST endpoint: /rest/v1/transactions
                url = f"{self.supabase_url}/rest/v1/transactions"
                req = urllib.request.Request(
                    url,
                    data=json.dumps(tx_record).encode('utf-8'),
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
                # Fallback to local memory if network/cloud fails
                self.local_store.append(tx_record)
        else:
            self.local_store.append(tx_record)

        # If escalated, store in escalations table
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
