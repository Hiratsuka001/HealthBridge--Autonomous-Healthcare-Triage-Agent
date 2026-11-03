from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from app.routers.triage_router import router as triage_router
from app.routers.dispatch_router import router as dispatch_router

load_dotenv()

def get_allowed_origins() -> list:
    allowed = os.getenv("ALLOWED_ORIGINS", "")
    if allowed:
        return [o.strip() for o in allowed.split(",") if o.strip()]
    origins = ["http://localhost:5173", "http://localhost:3000"]
    vercel_prod = os.getenv("VERCEL_PROJECT_PRODUCTION_URL", "").strip()
    if vercel_prod:
        origins.append(vercel_prod if vercel_prod.startswith("http") else f"https://{vercel_prod}")
    vercel_url = os.getenv("VERCEL_URL", "").strip()
    if vercel_url:
        origins.append(vercel_url if vercel_url.startswith("http") else f"https://{vercel_url}")
    return origins

app = FastAPI(title="HealthBridge API - Missing-Question Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,
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
