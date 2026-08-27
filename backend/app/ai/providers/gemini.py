"""Gemini provider — aktif saat AI_PROVIDER=gemini + GEMINI_API_KEY terisi.

System prompt MENGIKATI aturan §18: hanya data yang diberikan, tanpa klaim
prediksi gempa, tanpa instruksi keselamatan resmi.
"""
import json
import logging
from typing import ClassVar

import httpx

from app.ai.base import AIProvider, AISituationOutput
from app.core.exceptions import AIProviderError

logger = logging.getLogger("app.ai.gemini")

API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

SYSTEM_PROMPT = """You are an analytical assistant for an Indonesian disaster monitoring platform.
Analyze ONLY the JSON data provided. Rules (absolute):
- Never invent data not present in the context.
- Never claim to predict earthquakes or any disaster.
- Never issue official evacuation or safety instructions.
- Reference locations and numbers only from the data.
- The risk score is pre-computed by the platform; explain it, do not recalculate.
Respond with STRICT JSON only (no markdown fences) with keys:
current_situation (string), main_factors (array of strings),
areas_of_concern (array of strings), recommended_monitoring (string),
limitations (string). Write in Bahasa Indonesia."""


class GeminiAIProvider(AIProvider):
    name: ClassVar[str] = "gemini"

    def __init__(self, api_key: str, model: str = "gemini-2.0-flash") -> None:
        self.api_key = api_key
        self.model = model

    async def analyze(self, context: dict, risk: dict) -> AISituationOutput:
        prompt = (
            f"{SYSTEM_PROMPT}\n\nCONTEXT:\n{json.dumps(context, ensure_ascii=False)}"
            f"\n\nRISK ASSESSMENT:\n{json.dumps(risk, ensure_ascii=False)}"
        )
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    API_URL,
                    params={"key": self.api_key},
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1024},
                    },
                )
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPError as exc:
            raise AIProviderError(f"Gemini request gagal: {exc}") from exc

        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            # Buang markdown fence bila ada
            text = text.strip().removeprefix("```json").removesuffix("```").strip()
            return AISituationOutput(json.loads(text))
        except (KeyError, IndexError, json.JSONDecodeError) as exc:
            raise AIProviderError(f"Respons Gemini tidak valid: {exc}") from exc
