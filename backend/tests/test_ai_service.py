"""Integration test: AI analyze pipeline (mock provider)."""

from app.services.ai_service import run_analysis


async def test_analysis_with_empty_data(db_session):
    """DB kosong → tetap jalan, level low, output valid."""
    report = await run_analysis(db_session, force=True)
    assert 0 <= report.risk_score <= 100
    assert report.risk_level == "low"
    assert report.provider == "mock"
    assert report.current_situation
    assert report.areas_of_concern == []
    assert report.limitations  # disclaimer selalu ada


async def test_analysis_persists_report(db_session):
    import sqlalchemy as sa

    from app.models import AIReport

    await run_analysis(db_session, force=True)
    count = await db_session.scalar(sa.select(sa.func.count()).select_from(AIReport))
    assert count == 1
