# ═══ IDIC Backend — FastAPI + APScheduler ═══
FROM python:3.12-slim

# Keamanan: tidak jalan sebagai root
RUN groupadd -r idic && useradd -r -g idic idic

WORKDIR /app

# Install dependencies dulu (agar layer ini ter-cache jika requirements tidak berubah)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . /app/
RUN chown -R idic:idic /app
USER idic

EXPOSE 8000

# Migrate DB + Seed data + Jalankan server
CMD ["sh", "-c", "alembic upgrade head && python scripts/seed.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
