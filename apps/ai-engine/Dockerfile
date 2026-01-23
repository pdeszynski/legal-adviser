# Development stage - for local development
FROM python:3.13-slim AS development

WORKDIR /app

# Install uv
RUN pip install --no-cache-dir uv

# Copy Python project files
COPY apps/ai-engine/pyproject.toml apps/ai-engine/uv.lock ./

# Install dependencies including dev tools
RUN uv sync --frozen

# Copy source code
COPY apps/ai-engine/src ./src

EXPOSE 8000

# Set PYTHONPATH so Python can find the src module
ENV PYTHONPATH=/app

# For development, use uv run with uvicorn
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production stage - for production deployments
FROM python:3.13-slim AS production

WORKDIR /app

# Install uv
RUN pip install --no-cache-dir uv

# Copy Python project files (include lock file for reproducible builds)
COPY apps/ai-engine/pyproject.toml apps/ai-engine/uv.lock ./

# Install dependencies using uv
RUN uv sync --frozen --no-dev

# Copy source code
COPY apps/ai-engine/src ./src

# Create non-root user
RUN useradd -m -u 1001 aiengine && \
    chown -R aiengine:aiengine /app

USER aiengine

EXPOSE 8000

# Use uv run to execute the app from .venv
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
