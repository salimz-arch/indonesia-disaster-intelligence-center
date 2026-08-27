"""OpenAI provider — aktif saat AI_PROVIDER=openai + OPENAI_API_KEY terisi."""
import json
import logging
from typing import ClassVar

import httpx

from app.ai.base import AIProvider, AISituationOutput
from app.core.exceptions import AIProviderError

logger = logging.getLogger("app.ai.openai")

API_URL = "https://api.openai.com/v1/chat/completions"

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


class OpenAIProvider(AIProvider):
    name: ClassVar[str] = "openai"

    def __init__(self, api_key: str, model: str = "gpt-4o-mini") -> None:
        self.api_key = api_key
        self.model = model

    async def analyze(self, context: dict, risk: dict) -> AISituationOutput:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    API_URL,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "model": self.model,
                        "temperature": 0.2,
                        "max_tokens": 1024,
                        "response_format": {"type": "json_object"},
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {
                                "role": "user",
                                "content": json.dumps(
                                    {"context": context, "risk": risk},
                                    ensure_ascii=False,
                                ),
                            },
                        ],
                    },
                )
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPError as exc:
            raise AIProviderError(f"OpenAI request gagal: {exc}") from exc

        try:
            return AISituationOutput(json.loads(data["choices"][0]["message"]["content"]))
        except (KeyError, IndexError, json.JSONDecodeError) as exc:
            raise AIProviderError(f"Respons OpenAI tidak valid: {exc}") from exc
