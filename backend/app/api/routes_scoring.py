"""
ASTID Live Transaction Scoring API Route
Enforces IETF Idempotency-Key distributed locking and off-path background persistence.
"""

from fastapi import APIRouter, Header, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
import asyncio

from backend.app.services.scoring_service import scoring_instance
from backend.app.services.storage_service import storage_instance
from backend.app.services.cache import cache_instance

router = APIRouter(prefix="/score", tags=["Scoring"])

class LiveTransactionPayload(BaseModel):
    step: int = Field(default=744, description="Simulation step / hour")
    type: Literal['TRANSFER', 'CASH_OUT', 'PAYMENT', 'CASH_IN', 'DEBIT', 'UPI_P2P', 'UPI_MERCHANT']
    amount: float = Field(gt=0, description="Monetary value in INR")
    nameOrig: str = Field(description="Originating sender account / UPI VPA")
    nameDest: str = Field(description="Destination beneficiary account / merchant VPA")
    oldbalanceOrg: float = Field(default=0.0, description="Pre-authorization sender balance")
    newbalanceOrig: float = Field(default=0.0, description="Post-authorization sender balance (optional)")
    oldbalanceDest: float = Field(default=0.0, description="Pre-authorization destination balance")
    newbalanceDest: float = Field(default=0.0, description="Post-authorization destination balance (optional)")
    geo_lat: Optional[float] = Field(default=None, description="Client latitude")
    geo_lon: Optional[float] = Field(default=None, description="Client longitude")
    branch: Optional[str] = Field(default="Kolkata-SaltLake", description="Originating banking branch")

@router.post("/live")
async def score_live_transaction(
    payload: LiveTransactionPayload,
    background_tasks: BackgroundTasks,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key")
):
    # 1. Idempotency Check (Duplicate request protection via atomic locking)
    if idempotency_key:
        cached_resp = cache_instance.get(f"idemp:{idempotency_key}")
        if cached_resp:
            return cached_resp

        # Acquire 30s atomic distributed lock
        acquired = cache_instance.setnx(f"lock:idemp:{idempotency_key}", "locked", ttl_seconds=30)
        if not acquired:
            # Another identical request is actively being evaluated
            raise HTTPException(status_code=409, detail="Concurrent request with identical Idempotency-Key in progress")

    # 2. Synchronous Pre-Authorization Scoring (<15ms) — offloaded to thread pool
    tx_dict = payload.model_dump()
    result = await asyncio.to_thread(scoring_instance.score_transaction, tx_dict)

    # Cache response under idempotency key
    if idempotency_key:
        cache_instance.set(f"idemp:{idempotency_key}", result, ttl_seconds=300)

    # 3. Asynchronous Non-Blocking Persistence (Off-Path via BackgroundTasks)
    full_record = {**tx_dict, **result}
    background_tasks.add_task(storage_instance.persist_transaction, full_record)

    return result

@router.post("/benchmark")
async def run_benchmark_endpoint(sample_size: int = 100):
    from backend.ml.test_simulation_confusion_matrix import run_simulation_benchmark
    sample_size = max(10, min(500, sample_size))
    metrics = await asyncio.to_thread(run_simulation_benchmark, sample_size)
    return metrics

@router.post("/batch")
async def score_batch_transactions(
    payload: List[LiveTransactionPayload],
    background_tasks: BackgroundTasks
):
    results = []
    total_amount = 0.0
    fraud_count = 0
    escalate_count = 0
    review_count = 0
    approve_count = 0

    for item in payload:
        tx_dict = item.model_dump()
        res = await asyncio.to_thread(scoring_instance.score_transaction, tx_dict)
        verdict = res["final_verdict"]
        if verdict in ("ESCALATE", "BLOCK"):
            escalate_count += 1
            fraud_count += 1
        elif verdict == "REVIEW":
            review_count += 1
        else:
            approve_count += 1
        total_amount += item.amount

        full_rec = {**tx_dict, **res}
        background_tasks.add_task(storage_instance.persist_transaction, full_rec)
        results.append({**res, "branch": item.branch})

    return {
        "total_scored": len(results),
        "total_amount": total_amount,
        "approved": approve_count,
        "under_review": review_count,
        "escalated_or_blocked": escalate_count,
        "fraud_count": fraud_count,
        "transactions": results
    }
