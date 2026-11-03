from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class VitalsInput(BaseModel):
    respiratory_rate: Optional[int] = 16
    spo2: Optional[int] = 98
    systolic_bp: Optional[int] = 120
    diastolic_bp: Optional[int] = 80
    heart_rate: Optional[int] = 75
    temperature: Optional[float] = 37.0
    avpu: Optional[str] = "Alert"
    pain_level: Optional[int] = 0
    on_supplemental_o2: Optional[bool] = False
    selected_body_region: Optional[str] = None
    red_flags: Optional[List[str]] = None

class ClinicalScoringResult(BaseModel):
    news2_score: int
    news2_risk: str
    esi_level: int
    esi_category: str
    clinical_urgency: str

class DecisionFlipTest(BaseModel):
    missing_critical_info: Optional[str] = Field(
        default=None,
        description="What specific unasked information could flip the recommended urgency to Severe?"
    )
    has_verified_info: bool = Field(
        description="Has the system explicitly asked for and verified this critical information?"
    )
    should_escalate: bool = Field(
        description="If a critical variable is unknown or ambiguous, default to escalating care rather than offering false reassurance."
    )

class TriageEngineResponse(BaseModel):
    decision_flip_test: DecisionFlipTest
    current_severity: str = Field(
        description="Must be 'Mild', 'Moderate', or 'Severe'"
    )
    next_question: Optional[str] = Field(
        default=None,
        description="The single next question most likely to change the safe clinical outcome. Must be in the user's language."
    )
    is_triage_complete: bool = Field(
        description="True if enough information has been gathered to make a safe routing decision."
    )
    news2_score: Optional[int] = Field(
        default=None,
        description="Calculated NEWS2 score (0-20)"
    )
    esi_level: Optional[int] = Field(
        default=None,
        description="Calculated ESI Level (1 to 5)"
    )
    clinical_rationale: Optional[str] = Field(
        default=None,
        description="Underlying clinical rationale behind the assigned severity and urgency"
    )
    provider_used: Optional[str] = Field(
        default="gemini-flash",
        description="Name of the AI provider/model used to generate this turn"
    )
    latency_seconds: Optional[float] = Field(
        default=None,
        description="Response generation latency in seconds"
    )
