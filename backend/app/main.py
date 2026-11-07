"""
ASTID FastAPI Main Application Entrypoint
AI Shield for Transaction Integrity & Defense | Bank Fraud Operations Workbench
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes_scoring import router as scoring_router
from backend.app.api.routes_ops import router as ops_router
from backend.app.api.routes_health import router as health_router
from backend.app.api.routes_ws import router as ws_router
from backend.app.api.routes_narrative import router as narrative_router
from backend.app.api.routes_warehouse import router as warehouse_router

app = FastAPI(
    title="ASTID RiskOps Intelligence API",
    description="Sub-15ms Real-Time Transaction Inspection & Fraud Detection Pipeline",
    version="2.4.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for Next.js frontend workbench
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add production Vercel domain if configured
import os
_vercel_url = os.environ.get("FRONTEND_URL", "")
if _vercel_url:
    ALLOWED_ORIGINS.append(_vercel_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Idempotency-Key"],
)

# Mount API v1 Routers
app.include_router(health_router, prefix="/api/v1")
app.include_router(scoring_router, prefix="/api/v1")
app.include_router(ops_router, prefix="/api/v1")
app.include_router(warehouse_router, prefix="/api/v1")
app.include_router(ws_router, prefix="/api/v1")
app.include_router(narrative_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "system": "ASTID Bank Fraud RiskOps Platform",
        "version": "v2.4.0",
        "status": "ONLINE",
        "endpoints": {
            "health": "/api/v1/health",
            "score_live": "/api/v1/score/live",
            "escalations": "/api/v1/escalations",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=False)
