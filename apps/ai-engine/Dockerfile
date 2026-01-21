FROM python:3.14-slim

WORKDIR /app

# Install uv
RUN pip install --no-cache-dir uv

# Copy Python project files
COPY apps/ai-engine/pyproject.toml ./

# Install dependencies using uv (no --frozen since we don't have lockfile)
RUN uv sync --no-dev

# Copy source code
COPY apps/ai-engine/src ./src

# Create non-root user
RUN useradd -m -u 1001 aiengine && \
    chown -R aiengine:aiengine /app

USER aiengine

EXPOSE 8000

# Use uv to run the app with uvicorn from .venv
CMD ["uv", "run", "--no-dev", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
