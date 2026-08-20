"""ORM: ai_reports — persist setiap AI Situation Analysis.

JSON polos (bukan JSONB) untuk MVP — upgrade ke JSONB + GIN index
kalau nanti perlu query di dalam output_json.
"""
import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class AIReport(Base, TimestampMixin):
    __tablename__ = "ai_reports"
    __table_args__ = (
        sa.CheckConstraint("risk_score BETWEEN 0 AND 100", name="risk_score_range"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    provider: Mapped[str] = mapped_column(sa.String(50), nullable=False)
    model: Mapped[str] = mapped_column(sa.String(100), default="", nullable=False)
    # Skor dari Risk Engine deterministik (Step 13) — BUKAN dari LLM
    risk_score: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    context_json: Mapped[dict] = mapped_column(sa.JSON, nullable=False)
    output_json: Mapped[dict] = mapped_column(sa.JSON, nullable=False)
