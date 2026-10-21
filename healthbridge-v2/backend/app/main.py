from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from app.routers.triage_router import router as triage_router
from app.routers.dispatch_router import router as dispatch_router

load_dotenv()

app = FastAPI(title="HealthBridge API - Missing-Question Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "provider_mode": os.getenv("AI_PROVIDER_MODE", "mock"),
        "engine": "HealthBridge Missing-Question & Decision Flip Engine"
    }

app.include_router(triage_router)
app.include_router(dispatch_router)
