"""AI abstraction — factory memilih provider dari settings (tanpa hard-code)."""
from app.ai.base import AIProvider
from app.ai.providers.gemini import GeminiAIProvider
from app.ai.providers.mock import MockAIProvider
from app.ai.providers.openai import OpenAIProvider
from app.core.config import get_settings
from app.core.exceptions import AIProviderError


def get_ai_provider() -> AIProvider:
    settings = get_settings()
    if settings.ai_provider == "gemini":
        if not settings.gemini_api_key:
            raise AIProviderError("AI_PROVIDER=gemini tapi GEMINI_API_KEY kosong")
        return GeminiAIProvider(settings.gemini_api_key, settings.gemini_model)
    if settings.ai_provider == "openai":
        if not settings.openai_api_key:
            raise AIProviderError("AI_PROVIDER=openai tapi OPENAI_API_KEY kosong")
        return OpenAIProvider(settings.openai_api_key)
    return MockAIProvider()
