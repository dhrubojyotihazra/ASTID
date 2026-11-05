"""
ASTID Live Transaction Scoring API Route
Enforces IETF Idempotency-Key distributed locking and off-path background persistence.
"""

from fastapi import APIRouter, Header, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal

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

    # 2. Synchronous Pre-Authorization Scoring (<15ms)
    tx_dict = payload.model_dump()
    result = scoring_instance.score_transaction(tx_dict)

    # Cache response under idempotency key
    if idempotency_key:
        cache_instance.set(f"idemp:{idempotency_key}", result, ttl_seconds=300)

    # 3. Asynchronous Non-Blocking Persistence (Off-Path via BackgroundTasks)
    background_tasks.add_task(storage_instance.persist_transaction, result)

    return result

@router.post("/benchmark")
async def run_benchmark_endpoint(sample_size: int = 100):
    from backend.ml.test_simulation_confusion_matrix import run_simulation_benchmark
    sample_size = max(10, min(500, sample_size))
    metrics = run_simulation_benchmark(n_legit=sample_size)
    return metrics
