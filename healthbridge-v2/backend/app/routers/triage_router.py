from fastapi import APIRouter, UploadFile, File, Form, Request
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from app.services.llm_engine import process_triage_turn
from app.services.vision_service import analyze_symptom_image
from app.services.medicine_scanner_service import scan_medicine_strip
from app.services.clinical_calculator import calculate_news2, calculate_esi
from app.schemas.triage import VitalsInput

router = APIRouter(prefix="/api/triage", tags=["Triage & Vision"])

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    visual_context: Optional[str] = ""
    vitals: Optional[Dict[str, Any]] = None
    selected_region: Optional[str] = None

@router.post("/chat")
async def triage_chat(req: ChatRequest):
    result = await process_triage_turn(
        conversation_history=req.messages,
        visual_context=req.visual_context or "",
        vitals=req.vitals,
        selected_region=req.selected_region
    )
    return result

@router.post("/calculate-vitals")
async def calculate_vitals_endpoint(vitals: VitalsInput):
    news_res = calculate_news2(
        respiratory_rate=vitals.respiratory_rate if vitals.respiratory_rate is not None else 16,
        spo2=vitals.spo2 if vitals.spo2 is not None else 98,
        systolic_bp=vitals.systolic_bp if vitals.systolic_bp is not None else 120,
        heart_rate=vitals.heart_rate if vitals.heart_rate is not None else 75,
        temp_celsius=vitals.temperature if vitals.temperature is not None else 37.0,
        avpu=vitals.avpu or "Alert",
        on_supplemental_o2=bool(vitals.on_supplemental_o2)
    )
    esi = calculate_esi(
        news2_score=news_res["score"],
        avpu=vitals.avpu or "Alert",
        spo2=vitals.spo2 if vitals.spo2 is not None else 98,
        pain_level=vitals.pain_level if vitals.pain_level is not None else 0,
        has_high_risk_symptom=bool(vitals.red_flags and len(vitals.red_flags) > 0)
    )
    esi_desc = {
        1: "Immediate Resuscitation (Red Bay)",
        2: "Emergent / High Risk (Direct Bedding)",
        3: "Urgent (Acute Ward)",
        4: "Less Urgent (Ambulatory Clinic)",
        5: "Non-urgent (Local Pharmacy / Self-care)"
    }
    return {
        "news2": news_res,
        "esi_level": esi,
        "esi_category": esi_desc.get(esi, "Urgent"),
        "clinical_urgency": news_res["clinical_urgency"]
    }

@router.post("/vision")
async def triage_vision(
    request: Request,
    file: Optional[UploadFile] = File(None),
    symptom_hint: Optional[str] = Form("visible wound, burn, rash, or prescription")
):
    import base64
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        try:
            body = await request.json()
        except Exception:
            body = {}
        b64 = body.get("image_base64", "")
        image_bytes = base64.b64decode(b64) if b64 else b""
        filename = body.get("filename", "upload.jpg")
        hint = body.get("symptom_hint", "visible wound, burn, rash, or prescription")
        return await analyze_symptom_image(image_bytes, filename, hint)

    image_bytes = (await file.read()) if file else b""
    fname = file.filename if file else "upload.jpg"
    hint = symptom_hint or "visible wound, burn, rash, or prescription"
    analysis = await analyze_symptom_image(image_bytes, fname, hint)
    return analysis

@router.post("/scan-medicine")
async def scan_medicine_endpoint(
    request: Request,
    file: Optional[UploadFile] = File(None),
    symptoms: Optional[str] = Form(""),
    news2_score: Optional[int] = Form(0),
    selected_region: Optional[str] = Form(""),
    vitals_json: Optional[str] = Form("")
):
    import json
    import base64
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        try:
            body = await request.json()
        except Exception:
            body = {}
        b64 = body.get("image_base64", "")
        image_bytes = base64.b64decode(b64) if b64 else b""
        filename = body.get("filename", "upload.jpg")
        clinical_context = {
            "symptoms": body.get("symptoms", "") or "",
            "news2_score": body.get("news2_score", 0) or 0,
            "selected_region": body.get("selected_region", "") or "",
            "vitals": body.get("vitals", {}) or {}
        }
        return await scan_medicine_strip(image_bytes, filename, clinical_context)

    vitals_dict = {}
    if vitals_json:
        try:
            vitals_dict = json.loads(vitals_json)
        except Exception:
            vitals_dict = {}

    clinical_context = {
        "symptoms": symptoms or "",
        "news2_score": news2_score or 0,
        "selected_region": selected_region or "",
        "vitals": vitals_dict
    }

    image_bytes = (await file.read()) if file else b""
    fname = file.filename if file else "upload.jpg"
    report = await scan_medicine_strip(image_bytes, fname, clinical_context)
    return report
