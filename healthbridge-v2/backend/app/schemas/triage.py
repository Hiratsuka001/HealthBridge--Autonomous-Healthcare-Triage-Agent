from pydantic import BaseModel, Field
from typing import Optional

class DecisionFlipTest(BaseModel):
    missing_critical_info: Optional[str] = Field(
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
        description="The single next question most likely to change the safe clinical outcome. Must be in the user's language."
    )
    is_triage_complete: bool = Field(
        description="True if enough information has been gathered to make a safe routing decision."
    )

