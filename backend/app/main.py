"""
ASTID FastAPI Main Application Entrypoint
AI Shield for Transaction Integrity & Defense | Bank Fraud Operations Workbench
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes_scoring import router as scoring_router
from backend.app.api.routes_ops import router as ops_router
from backend.app.api.routes_health import router as health_router
from backend.app.api.routes_ws import router as ws_router
from backend.app.api.routes_narrative import router as narrative_router
from backend.app.api.routes_warehouse import (
    router as warehouse_router,
    warehouse_spec_router,
    drift_router,
    graph_router
)

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

app = FastAPI(
    title="ASTID RiskOps Intelligence API",
    description="Sub-15ms Real-Time Transaction Inspection & Fraud Detection Pipeline",
    version="2.4.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Robust URL normalization middleware to seamlessly handle double-slashes and root vs /api/v1 paths
class RobustPathMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.scope.get("path", "")
        # Clean double slashes
        while "//" in path:
            path = path.replace("//", "/")
        request.scope["path"] = path
        return await call_next(request)

app.add_middleware(RobustPathMiddleware)

# CORS configuration for Next.js frontend workbench (Vercel & Local)
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://astid.vercel.app",
    "https://astid-dashboard.vercel.app",
]

_frontend_env = os.environ.get("FRONTEND_URL", "")
if _frontend_env and _frontend_env not in ALLOWED_ORIGINS:
    if _frontend_env != "*":
        ALLOWED_ORIGINS.append(_frontend_env)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Idempotency-Key"],
)

# Mount API Routers under BOTH /api/v1 AND root prefix for 100% cloud frontend compatibility
_routers = [
    health_router,
    scoring_router,
    ops_router,
    warehouse_router,
    warehouse_spec_router,
    drift_router,
    graph_router,
    ws_router,
    narrative_router
]

for r in _routers:
    app.include_router(r, prefix="/api/v1")
    app.include_router(r, prefix="")

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
