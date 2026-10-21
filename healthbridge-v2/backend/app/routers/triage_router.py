from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.llm_engine import process_triage_turn
from app.services.vision_service import analyze_symptom_image

router = APIRouter(prefix="/api/triage", tags=["Triage & Vision"])

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    visual_context: Optional[str] = ""

@router.post("/chat")
async def triage_chat(req: ChatRequest):
    result = await process_triage_turn(req.messages, req.visual_context)
    return result

@router.post("/vision")
async def triage_vision(
    file: UploadFile = File(...),
    symptom_hint: str = Form("visible wound, burn, rash, or prescription")
):
    image_bytes = await file.read()
    analysis = await analyze_symptom_image(image_bytes, file.filename, symptom_hint)
    return analysis

