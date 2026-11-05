"""
ASTID Operations & Escalations State Machine API Route
Manages 15-minute SLA claim and resolution workflows for Senior Fraud Investigators.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, Literal

from backend.app.services.storage_service import storage_instance

router = APIRouter(prefix="/escalations", tags=["Operations"])

class ClaimPayload(BaseModel):
    user_id: str = "analyst-senior-01"

class ResolvePayload(BaseModel):
    verdict: Literal["confirmed_fraud", "false_positive"]
    notes: str

@router.get("")
async def list_escalations():
    """Returns active escalations with live SLA countdown."""
    return list(storage_instance.escalations_store.values())

@router.post("/{escalation_id}/claim")
async def claim_escalation(escalation_id: str, payload: ClaimPayload):
    """Senior analyst claims case; locks assignment under 15-min resolution SLA."""
    esc = storage_instance.claim_escalation(escalation_id, payload.user_id)
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation ID not found")
    return {"message": "Escalation successfully claimed", "escalation": esc}

@router.post("/{escalation_id}/resolve")
async def resolve_escalation(escalation_id: str, payload: ResolvePayload):
    """Resolves escalation and commits immutable decision."""
    esc = storage_instance.resolve_escalation(escalation_id, payload.verdict, payload.notes)
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation ID not found")
    return {"message": "Escalation resolved successfully", "escalation": esc}
