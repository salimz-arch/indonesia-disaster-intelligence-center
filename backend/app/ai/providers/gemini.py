"""Gemini provider — aktif saat AI_PROVIDER=gemini + GEMINI_API_KEY terisi.

System prompt MENGIKATI aturan §18: hanya data yang diberikan, tanpa klaim
prediksi gempa, tanpa instruksi keselamatan resmi.
Few-shot example + JSON mode → output konsisten.
"""

import json
import logging
from typing import ClassVar

import httpx

from app.ai.base import AIProvider, AISituationOutput
from app.core.exceptions import AIProviderError

logger = logging.getLogger("app.ai.gemini")

SYSTEM_PROMPT = (
    "You are an analytical assistant for an Indonesian disaster monitoring "
    "platform called IDIC (Indonesia Disaster Intelligence Center).\n\n"
    "You analyze ONLY the JSON data provided in the user message. "
    "Follow these ABSOLUTE rules:\n"
    "1. NEVER invent data, numbers, locations, or events not present in the "
    "provided context.\n"
    "2. NEVER claim to predict earthquakes or any disaster.\n"
    "3. NEVER issue official evacuation or safety instructions.\n"
    "4. Use ONLY numbers and locations explicitly stated in the data.\n"
    "5. The risk score is pre-computed by the platform; your job is to "
    "EXPLAIN it, not recalculate it.\n"
    "6. Write in formal Bahasa Indonesia.\n"
    "7. Keep sentences concise and data-driven.\n\n"
    "You MUST respond with STRICT JSON (no markdown, no code fences) using "
    "EXACTLY this structure:\n"
    "{\n"
    '  "current_situation": "string — 2-4 sentences summarizing the '
    'situation from data",\n'
    '  "main_factors": ["string — one factor per item, from risk '
    'assessment factors"],\n'
    '  "areas_of_concern": ["string — location names from data, max 5 '
    'items"],\n'
    '  "recommended_monitoring": "string — 1-2 sentences of monitoring '
    'recommendation",\n'
    '  "limitations": "string — acknowledge you only analyze provided data, '
    'not official warnings"\n'
    "}\n\n"
    "EXAMPLE RESPONSE (for reference only — do NOT copy these values):\n"
    "{\n"
    '  "current_situation": "Aktivitas seismik 24 jam terakhir tercatat 15 '
    "event dengan magnitudo terbesar M5.2. Hujan aktif di 3 dari 16 lokasi "
    'pantau dengan intensitas puncak 12.5 mm/jam.",\n'
    '  "main_factors": ["Gempa terbesar M5.2 dalam 24 jam", '
    '"3 gempa signifikan (M≥4.5) dalam 24 jam", '
    '"Intensitas hujan puncak 12.5 mm/jam"],\n'
    '  "areas_of_concern": ["Sumatera Utara", "Sulawesi Tengah"],\n'
    '  "recommended_monitoring": "Pertahankan pemantauan ketat pada '
    'aktivitas seismik dan tren curah hujan di wilayah yang disebutkan.",\n'
    '  "limitations": "Analisis berdasarkan data platform semata, '
    'bukan peringatan resmi."\n'
    "}"
)


class GeminiAIProvider(AIProvider):
    name: ClassVar[str] = "gemini"

    def __init__(self, api_key: str, model: str = "gemini-2.0-flash") -> None:
        self.api_key = api_key
        self.model = model

    def _build_url(self) -> str:
        return (
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        )

    def _parse_response(self, data: dict) -> AISituationOutput:
        """Extract + parse JSON dari respons Gemini."""
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        # Strip markdown fences bila ada
        text = text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()
        return AISituationOutput(json.loads(text))

    async def analyze(self, context: dict, risk: dict) -> AISituationOutput:
        prompt = (
            "Analyze the following disaster monitoring data for Indonesia.\n\n"
            "CONTEXT (real data from platform):\n"
            f"{json.dumps(context, ensure_ascii=False, indent=2)}\n\n"
            "RISK ASSESSMENT (pre-computed):\n"
            f"{json.dumps(risk, ensure_ascii=False, indent=2)}\n\n"
            "Respond with STRICT JSON following the exact structure specified."
        )

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            "generationConfig": {
                "temperature": 0.1,  # rendah = konsisten
                "topP": 0.8,
                "maxOutputTokens": 1024,
                "responseMimeType": "application/json",  # paksa JSON mode
            },
        }

        # Retry sekali bila parse gagal (respons kadang menyimpang)
        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        self._build_url(),
                        params={"key": self.api_key},
                        json=payload,
                    )
                    resp.raise_for_status()
                    data = resp.json()

                return self._parse_response(data)

            except httpx.HTTPStatusError as exc:
                # 429 = rate limit, 400 = bad request — tidak retry
                if exc.response.status_code in (400, 401, 403):
                    raise AIProviderError(
                        f"Gemini API error {exc.response.status_code}: {exc.response.text[:200]}"
                    ) from exc
                logger.warning(
                    "gemini attempt %d gagal (HTTP %d) — %s",
                    attempt + 1,
                    exc.response.status_code,
                    str(exc)[:200],
                )
            except httpx.HTTPError as exc:
                logger.warning("gemini attempt %d gagal: %s", attempt + 1, exc.__class__.__name__)
            except (KeyError, IndexError, json.JSONDecodeError) as exc:
                logger.warning("gemini attempt %d parse gagal: %s", attempt + 1, exc)
                if attempt == 0:
                    # Tambah instruksi lebih tegas untuk retry
                    payload["contents"][0]["parts"][0]["text"] += (
                        "\n\nIMPORTANT: Respond ONLY with valid JSON. "
                        "No markdown fences, no explanations outside JSON."
                    )
                    continue

        raise AIProviderError("Gemini gagal menghasilkan JSON valid setelah 2 percobaan")
