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
    verdict: Optional[str] = None
    action: Optional[str] = None
    notes: Optional[str] = ""
    reason: Optional[str] = ""
    user_id: Optional[str] = None

    def get_normalized_verdict(self) -> str:
        v = (self.verdict or self.action or "confirmed_fraud").lower()
        if "fraud" in v or "confirm" in v:
            return "confirmed_fraud"
        return "false_positive"

    def get_notes(self) -> str:
        return self.notes or self.reason or "Resolved by investigator"

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
    final_verdict = payload.get_normalized_verdict()
    final_notes = payload.get_notes()
    esc = storage_instance.resolve_escalation(escalation_id, final_verdict, final_notes)
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation ID not found")
    return {"message": "Escalation resolved successfully", "escalation": esc}
