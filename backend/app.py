"""
MediSense FastAPI Application
Diabetes-Risk Screening Decision-Support System
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.db.database import init_and_seed_database
from backend.routes.health import router as health_router
from backend.routes.dashboard import router as dashboard_router
from backend.routes.patients import router as patients_router
from backend.routes.callback_queue import router as callback_router
from backend.routes.model_metrics import router as metrics_router
from backend.routes.screening import router as screening_router
from backend.routes.nurse_notes import router as nurse_notes_router
from backend.routes.export import router as export_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Safe startup initialization and seeding
    try:
        init_and_seed_database()
    except Exception as e:
        print(f"Warning during database initialization: {e}")
    yield

app = FastAPI(
    title="MediSense API",
    description="Diabetes Risk Screening Decision-Support Dashboard for Community Health Clinics",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local dev and cross-origin deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes under /api
app.include_router(health_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(patients_router, prefix="/api")
app.include_router(callback_router, prefix="/api")
app.include_router(metrics_router, prefix="/api")
app.include_router(screening_router, prefix="/api")
app.include_router(nurse_notes_router, prefix="/api")
app.include_router(export_router, prefix="/api")

@app.get("/")
def root():
    return {
        "service": "MediSense Clinical Decision Support API",
        "status": "operational",
        "docs_url": "/docs",
        "api_prefix": "/api"
    }
