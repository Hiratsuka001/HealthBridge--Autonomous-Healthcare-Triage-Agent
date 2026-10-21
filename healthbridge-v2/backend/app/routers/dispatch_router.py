from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.dispatch_service import (
    find_nearby_facilities,
    generate_soap_qr_packet,
    trigger_ambulance_voice_dispatch
)

router = APIRouter(prefix="/api/dispatch", tags=["Routing, Ambulance & ER QR"])

class DispatchRequest(BaseModel):
    messages: List[Dict[str, str]]
    severity: str
    decision_flip_summary: Optional[str] = "Critical warning sign evaluated"
    lat: Optional[float] = 23.7771
    lng: Optional[float] = 90.3994

@router.post("/execute")
async def execute_dispatch_and_handoff(req: DispatchRequest):
    facilities = await find_nearby_facilities(req.severity, req.lat, req.lng)
    qr_packet = generate_soap_qr_packet(req.messages, req.severity, req.decision_flip_summary)

    ambulance_dispatch = None
    if req.severity.lower() == "severe" and facilities:
        ambulance_dispatch = trigger_ambulance_voice_dispatch(
            facilities[0], qr_packet["soap_note"], req.lat, req.lng
        )

    return {
        "severity": req.severity,
        "recommended_facilities": facilities,
        "er_handoff_packet": qr_packet,
        "autonomous_ambulance_call": ambulance_dispatch
    }

