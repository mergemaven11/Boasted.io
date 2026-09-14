FROM python:3.12.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt \
    && useradd --create-home --uid 10001 --shell /usr/sbin/nologin boasted

COPY app ./app
COPY scripts ./scripts

USER boasted

EXPOSE 8000

CMD ["sh", "-c", "python -m scripts.ensure_core_indexes && exec uvicorn app.main:app --host 0.0.0.0 --port 8000"]
