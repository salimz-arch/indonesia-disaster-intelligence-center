"""Canonical AI report schema (§18-19).

risk_score/risk_level = INTERNAL MONITORING SCORE dari Risk Engine
deterministik — bukan prediksi resmi dan bukan keluaran LLM.
"""
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, computed_field


class RiskLevel(StrEnum):
    LOW = "low"            # 0-30
    MODERATE = "moderate"  # 31-60
    HIGH = "high"          # 61-80
    CRITICAL = "critical"  # 81-100


def risk_level(score: int) -> RiskLevel:
    if score <= 30:
        return RiskLevel.LOW
    if score <= 60:
        return RiskLevel.MODERATE
    if score <= 80:
        return RiskLevel.HIGH
    return RiskLevel.CRITICAL


class AIReportCreate(BaseModel):
    provider: str = Field(min_length=1, max_length=50)
    model: str = Field(default="", max_length=100)
    risk_score: int = Field(ge=0, le=100)
    context: dict
    output: dict


class AIReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    provider: str
    model: str
    risk_score: int
    context_json: dict
    output_json: dict
    created_at: datetime

    @computed_field
    @property
    def risk_level(self) -> RiskLevel:
        return risk_level(self.risk_score)


class AISituationOutputSchema(BaseModel):
    """Validator keluaran provider — struktur WAJIB (§18)."""

    current_situation: str = Field(min_length=10, max_length=2000)
    main_factors: list[str] = Field(max_length=8)
    areas_of_concern: list[str] = Field(max_length=10)
    recommended_monitoring: str = Field(min_length=10, max_length=2000)
    limitations: str = Field(min_length=5, max_length=2000)


class AIAnalyzeResponse(BaseModel):
    """Respons endpoint /ai/analyze — kontrak frontend."""

    risk_score: int
    risk_level: RiskLevel
    factors: list[dict]
    generated_at: datetime
    provider: str
    model: str
    current_situation: str
    main_factors: list[str]
    areas_of_concern: list[str]
    recommended_monitoring: str
    limitations: str
    data_coverage: dict  # ringkasan sumber data yang dipakai
