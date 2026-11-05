"""
ASTID System Health & Telemetry API Route
"""

from fastapi import APIRouter
import time
from backend.app.services.scoring_service import scoring_instance
from backend.app.services.storage_service import storage_instance

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "timestamp": time.time(),
        "model_loaded": scoring_instance.model is not None,
        "zero_day_ae_loaded": scoring_instance.ae_scorer.enabled,
        "tau_review": scoring_instance.tau_review,
        "tau_escalate": scoring_instance.tau_escalate,
        "persistence_mode": "SUPABASE_CLOUD" if storage_instance.is_cloud else "LOCAL_MEMORY",
        "active_escalations": len(storage_instance.escalations_store)
    }
