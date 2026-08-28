"""Canonical AI report schema (Section 18-19)."""

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator


class RiskLevel(StrEnum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


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
    current_situation: str = Field(min_length=20, max_length=1500)
    main_factors: list[str] = Field(min_length=1, max_length=8)
    areas_of_concern: list[str] = Field(max_length=10)
    recommended_monitoring: str = Field(min_length=15, max_length=1000)
    limitations: str = Field(min_length=10, max_length=1000)

    @field_validator("main_factors")
    @classmethod
    def factors_not_empty_strings(cls, v: list[str]) -> list[str]:
        cleaned = [s.strip() for s in v if s.strip()]
        if not cleaned:
            raise ValueError("main_factors tidak boleh kosong")
        return cleaned

    @field_validator("areas_of_concern")
    @classmethod
    def concerns_cleaned(cls, v: list[str]) -> list[str]:
        return [s.strip() for s in v if s.strip()]


class AIAnalyzeResponse(BaseModel):
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
    data_coverage: dict
    fallback_used: bool = False
    provider_error: str | None = None
