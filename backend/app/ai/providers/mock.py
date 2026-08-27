"""Mock provider — TANPA LLM, rule-based dari data riil.

Bukan "AI" — menghasilkan narasi deterministik dari context.
Jujur soal identitasnya di field limitations.
"""
from typing import ClassVar

from app.ai.base import AIProvider, AISituationOutput


class MockAIProvider(AIProvider):
    name: ClassVar[str] = "mock"

    async def analyze(self, context: dict, risk: dict) -> AISituationOutput:
        eq_total = context["earthquakes"]["total_24h"]
        eq_max = context["earthquakes"]["max_magnitude"]
        raining = context["rainfall"]["raining_locations"]
        total_locs = context["rainfall"]["total_locations"]
        extreme = context["weather"]["extreme_locations"]

        # ── Current situation ──
        parts = []
        if eq_max:
            parts.append(
                f"aktivitas seismik 24 jam tercatat {eq_total} event "
                f"dengan magnitudo terbesar M{eq_max:.1f}"
            )
        else:
            parts.append("tidak ada gempa tercatat dalam 24 jam terakhir")
        if raining:
            parts.append(f"hujan aktif di {raining} dari {total_locs} lokasi pantau")
        if extreme:
            parts.append(f"kondisi cuaca ekstrem di {', '.join(extreme[:3])}")
        situation = "; ".join(p.capitalize() for p in parts) + "."

        # ── Factors (dari risk engine — bukan karangan) ──
        main_factors = [f["label"] for f in risk["factors"]] or [
            "Tidak ada faktor risiko dominan terdeteksi pada periode pemantauan"
        ]

        # ── Areas of concern (lokasi riil) ──
        concerns = []
        for e in context["earthquakes"]["recent_significant"]:
            loc = e.get("location_text") or f"{e.get('latitude')}, {e.get('longitude')}"
            concerns.append(f"{loc} (M{e['magnitude']:.1f})")
        for name in context["rainfall"]["top_rain_locations"]:
            concerns.append(f"{name} (hujan)")
        if extreme:
            concerns.extend(extreme[:2])

        # ── Recommended monitoring ──
        if risk["level"] in ("high", "critical"):
            rec = (
                "Pertahankan pemantauan ketat pada aktivitas seismik dan tren "
                "curah hujan; waspadai informasi resmi BMKG untuk wilayah yang disebutkan."
            )
        else:
            rec = (
                "Pemantauan rutin berlanjut; perhatikan pembaruan data gempa "
                "dan curah hujan berkala."
            )

        return AISituationOutput(
            current_situation=situation,
            main_factors=main_factors,
            areas_of_concern=concerns[:5],
            recommended_monitoring=rec,
            limitations=(
                "Analisis dihasilkan oleh provider rule-based (mock) berdasarkan "
                "data platform semata — bukan model bahasa dan bukan peringatan resmi."
            ),
        )
