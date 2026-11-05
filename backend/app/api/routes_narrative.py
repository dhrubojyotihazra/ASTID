"""
ASTID Narrative Generation Route (Groq Cloud LPU)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from backend.app.services.llm_narrative import narrative_service

router = APIRouter(tags=["Compliance Narrative"])

class NarrativeRequest(BaseModel):
    id: str = Field(..., description="Case or Transaction ID")
    amount: float = Field(..., ge=0.0)
    branch: Optional[str] = "Central Hub"
    score: float = Field(..., ge=0.0, le=1.0)
    kind: Optional[str] = "review"
    reasons: List[str] = []
    chain: List[str] = []
    originAcc: Optional[str] = None
    destVpa: Optional[str] = None

class NarrativeResponse(BaseModel):
    case_id: str
    narrative: str
    model: str
    generation_latency_ms: float

@router.post("/narratives/generate", response_model=NarrativeResponse)
async def generate_sar_narrative(req: NarrativeRequest):
    case_dict = req.model_dump()
    narrative, model_used, latency_ms = narrative_service.generate_narrative(case_dict)
    return NarrativeResponse(
        case_id=req.id,
        narrative=narrative,
        model=model_used,
        generation_latency_ms=latency_ms
    )
