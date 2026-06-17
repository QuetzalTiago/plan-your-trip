# ─── Base stage ──────────────────────────────────────────────────────────────
FROM python:3.12-slim AS base

WORKDIR /app

COPY pyproject.toml ./
RUN pip install --no-cache-dir -e ".[dev]" 2>/dev/null || pip install --no-cache-dir .

COPY src/ ./src/
COPY sql/ ./sql/

# ─── Development stage ───────────────────────────────────────────────────────
FROM base AS dev

EXPOSE 4000

CMD ["python", "-m", "uvicorn", "src.local.server:app", "--host", "0.0.0.0", "--port", "4000", "--reload", "--reload-dir", "src"]

# ─── Production stage (ECS) ──────────────────────────────────────────────────
FROM base AS production

EXPOSE 8000

# Run FastAPI with uvicorn
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
