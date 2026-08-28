"""AI endpoints — situation analysis (§18). Provider via AI_PROVIDER env."""

import logging

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.envelope import fail, ok
from app.core.exceptions import AIProviderError
from app.db.session import AsyncSessionLocal
from app.services.ai_service import run_analysis
from app.services.source_service import mark_success

logger = logging.getLogger("app.api.ai")
router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/analyze", response_model=None)
async def analyze(
    force: bool = Query(False, description="Bypass cache 5 menit"),
    db: AsyncSession = Depends(get_db),
) -> dict | JSONResponse:
    """Generate AI Situation Analysis — context riil + risk score deterministik."""
    try:
        report = await run_analysis(db, force=force)
    except AIProviderError as exc:
        return JSONResponse(
            status_code=502,
            content=fail("AI_PROVIDER_ERROR", exc.message),
        )

    try:
        async with AsyncSessionLocal() as session:
            await mark_success(session, "ai-provider", 0)
    except Exception as exc:
        # Log warning agar tidak silent pass (memenuhi aturan S110)
        logger.warning("Gagal mencatat status ai-provider: %s", exc)

    return ok(report.model_dump(mode="json"), source=report.provider)
