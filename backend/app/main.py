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

app = FastAPI(
    title="ASTID RiskOps Intelligence API",
    description="Sub-15ms Real-Time Transaction Inspection & Fraud Detection Pipeline",
    version="2.4.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for Next.js frontend workbench
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 Routers
app.include_router(health_router, prefix="/api/v1")
app.include_router(scoring_router, prefix="/api/v1")
app.include_router(ops_router, prefix="/api/v1")
app.include_router(ws_router, prefix="/api/v1")

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
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
