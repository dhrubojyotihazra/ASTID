"""
ASTID Real-Time WebSocket Streaming Manager & Transaction Generator
Continuously broadcasts live transaction events and scores to connected clients.
"""

import asyncio
import json
import random
import time
import uuid
from typing import Set, Dict, Any, Optional
from fastapi import WebSocket

from backend.app.services.scoring_service import scoring_instance
from backend.app.services.storage_service import storage_instance

BRANCHES = [
    {"name": "Kolkata-SaltLake", "lat": 22.5867, "lon": 88.4178},
    {"name": "Mumbai-BKC", "lat": 19.0657, "lon": 72.8681},
    {"name": "Bengaluru-HSR", "lat": 12.9121, "lon": 77.6446},
    {"name": "Delhi-Connaught", "lat": 28.6315, "lon": 77.2167},
    {"name": "Chennai-Guindy", "lat": 13.0067, "lon": 80.2038},
]

class StreamManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.is_running: bool = False
        self.interval_seconds: float = 3.5
        self._task: Optional[asyncio.Task] = None
        self.stats = {
            "total_streamed": 0,
            "approved": 0,
            "reviewed": 0,
            "escalated": 0,
            "blocked": 0,
        }

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        # Send initial status
        await websocket.send_json({
            "type": "STREAM_STATUS",
            "is_running": self.is_running,
            "interval_seconds": self.interval_seconds,
            "stats": self.stats,
            "connected_clients": len(self.active_connections),
        })

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        disconnected = set()
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        for conn in disconnected:
            self.active_connections.discard(conn)

    def start_background_stream(self):
        if not self.is_running:
            self.is_running = True
            self._task = asyncio.create_task(self._stream_loop())

    def stop_background_stream(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
            self._task = None

    async def _stream_loop(self):
        """Continuously generates realistic transactions and streams scored results."""
        while self.is_running:
            try:
                tx_event = self._generate_simulated_tx()
                score_res = scoring_instance.score_transaction(tx_event)

                # Update stats
                self.stats["total_streamed"] += 1
                verdict = score_res.get("final_verdict", "APPROVE")
                if verdict == "APPROVE":
                    self.stats["approved"] += 1
                elif verdict == "REVIEW":
                    self.stats["reviewed"] += 1
                elif verdict == "ESCALATE":
                    self.stats["escalated"] += 1
                elif verdict == "BLOCK":
                    self.stats["blocked"] += 1

                # If flagged, prepare case format for live Kanban injection
                case_payload = None
                if verdict in ("REVIEW", "ESCALATE", "BLOCK"):
                    case_id = f"WS-{score_res['transaction_id'][:6].upper()}"
                    is_esc = verdict in ("ESCALATE", "BLOCK")
                    case_payload = {
                        "id": case_id,
                        "amount": score_res["amount"],
                        "branch": tx_event.get("branch", "Mumbai-BKC"),
                        "score": score_res["risk_score"],
                        "kind": "escalate" if is_esc else "review",
                        "due": 900 if is_esc else None,
                        "reasons": [
                            score_res["primary_reason"],
                            *[f"{ins['badge']}: {ins['explanation']}" for ins in score_res.get("whitebox_insights", [])]
                        ],
                        "chain": [tx_event["nameOrig"], tx_event["nameDest"]],
                        "originAcc": tx_event["nameOrig"],
                        "destVpa": tx_event["nameDest"],
                        "isHighValue": score_res["amount"] >= 100000,
                    }

                # Broadcast to frontend
                await self.broadcast({
                    "type": "TX_EVENT",
                    "timestamp": time.time(),
                    "score_result": score_res,
                    "case": case_payload,
                    "stats": self.stats,
                })

            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[StreamManager] Error in stream loop: {e}")

            await asyncio.sleep(self.interval_seconds)

    def _generate_simulated_tx(self) -> Dict[str, Any]:
        """Synthesizes a realistic mix of legitimate and occasional high-risk transactions."""
        roll = random.random()
        branch_info = random.choice(BRANCHES)

        # 85% legitimate everyday payments
        if roll < 0.85:
            amount = round(random.choice([
                random.uniform(20.0, 500.0),      # Small UPI chai / grocery
                random.uniform(500.0, 3500.0),    # Retail / utility
                random.uniform(3500.0, 15000.0),  # Rent / shopping
            ]), 2)
            orig_bal = round(amount + random.uniform(5000.0, 85000.0), 2)
            tx_type = random.choice(["PAYMENT", "PAYMENT", "TRANSFER", "DEBIT"])
            dest_prefix = "M" if tx_type == "PAYMENT" else "C"
            return {
                "transaction_id": str(uuid.uuid4()),
                "step": 744,
                "type": tx_type,
                "amount": amount,
                "nameOrig": f"C{random.randint(1000000000, 9999999999)}",
                "nameDest": f"{dest_prefix}{random.randint(1000000000, 9999999999)}",
                "oldbalanceOrg": orig_bal,
                "oldbalanceDest": round(random.uniform(1000.0, 50000.0), 2),
                "geo_lat": branch_info["lat"] + random.uniform(-0.02, 0.02),
                "geo_lon": branch_info["lon"] + random.uniform(-0.02, 0.02),
                "branch": branch_info["name"],
            }

        # 10% high-risk fraudulent account draining / script storms
        elif roll < 0.95:
            amount = round(random.uniform(250000.0, 950000.0), 2)
            orig_bal = amount  # 100% full balance liquidation drain
            return {
                "transaction_id": str(uuid.uuid4()),
                "step": 744,
                "type": "TRANSFER",
                "amount": amount,
                "nameOrig": f"C{random.randint(7000000000, 7999999999)}",
                "nameDest": f"C{random.randint(8000000000, 8999999999)}",
                "oldbalanceOrg": orig_bal,
                "oldbalanceDest": 0.0,  # Unfunded destination account
                "geo_lat": branch_info["lat"],
                "geo_lon": branch_info["lon"],
                "branch": branch_info["name"],
            }

        # 5% blacklisted or impossible travel anomaly
        else:
            return {
                "transaction_id": str(uuid.uuid4()),
                "step": 744,
                "type": "TRANSFER",
                "amount": round(random.uniform(5000.0, 50000.0), 2),
                "nameOrig": "C1234567890",  # Confirmed blacklist match
                "nameDest": f"C{random.randint(9000000000, 9999999999)}",
                "oldbalanceOrg": 60000.0,
                "oldbalanceDest": 1500.0,
                "geo_lat": branch_info["lat"],
                "geo_lon": branch_info["lon"],
                "branch": branch_info["name"],
            }

stream_manager = StreamManager()
