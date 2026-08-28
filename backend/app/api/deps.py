"""Dependencies FastAPI — satu pintu DI untuk semua endpoint."""

from app.db.session import get_db

__all__ = ["get_db"]
