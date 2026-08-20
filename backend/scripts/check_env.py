"""Cek kesehatan environment development IDIC.

Jalankan dari folder backend/ (venv aktif):
    python scripts/check_env.py

Exit code 0 = semua sehat, 1 = ada komponen gagal.
"""
import asyncio
import sys
from pathlib import Path

# Pastikan package `app` bisa diimpor saat dijalankan sebagai file script
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import get_settings
from app.db.redis import ping_redis
from app.db.session import ping_database


def _mask_url(url: str) -> str:
    """Sembunyikan kredensial: postgresql+asyncpg://idic:***@localhost:5432/idic"""
    if "://" not in url:
        return url
    scheme, rest = url.split("://", 1)
    if "@" in rest:
        creds, host = rest.rsplit("@", 1)
        user = creds.split(":", 1)[0]
        return f"{scheme}://{user}:***@{host}"
    return url


async def main() -> int:
    settings = get_settings()
    db_ok = await ping_database()
    redis_ok = await ping_redis()

    checks = [
        ("Backend config", True, f"env={settings.environment}"),
        ("PostgreSQL", db_ok, _mask_url(settings.database_url)),
        ("Redis", redis_ok, _mask_url(settings.redis_url)),
    ]

    print()
    print("IDIC Environment Check")
    print("=" * 62)
    for name, ok, detail in checks:
        status = "OK  " if ok else "FAIL"
        print(f"[{status}] {name:<16} {detail}")
    print("=" * 62)

    if not (db_ok and redis_ok):
        print("\nPerbaikan — dari root repository jalankan:")
        print("  docker compose up -d")
        print("  docker compose ps        # tunggu status (healthy)")
        return 1

    print("\nSemua komponen sehat. Siap lanjut ke Step 4.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
