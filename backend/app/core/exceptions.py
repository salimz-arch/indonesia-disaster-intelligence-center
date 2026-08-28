"""Exception aplikasi — dipetakan ke envelope error di layer API."""

from typing import ClassVar


class AppError(Exception):
    """Base error — subclass WAJIB mendefinisikan code & status_code."""

    code: ClassVar[str] = "INTERNAL_ERROR"
    status_code: ClassVar[int] = 500

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class ProviderError(AppError):
    """Sumber data eksternal gagal (setelah retry)."""

    code = "DATA_SOURCE_UNAVAILABLE"
    status_code = 503


class NotFoundError(AppError):
    code = "NOT_FOUND"
    status_code = 404


class AIProviderError(AppError):
    code = "AI_PROVIDER_ERROR"
    status_code = 502
