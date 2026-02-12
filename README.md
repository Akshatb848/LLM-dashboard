# Smart Education Newsletter + AI Chatbot Platform

Conference-ready Ministry of Education dashboard with **RAG-first retrieval**, optional LLM summarization, strict no-hallucination behavior, and official newsletter output formatting.

## Run locally

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt pytest
uvicorn backend.main:app --reload --port 8000
```

Serve frontend:

```bash
python -m http.server 8080 -d frontend
```

## APIs
- `GET /api/health`
- `GET /api/llm/status`
- `POST /api/chat`
- `GET /api/newsletter/months`
- `GET /api/newsletter/{month}`
- `GET /api/analytics/overview`

## LLM mode
Set `OLLAMA_URL` (e.g. `http://localhost:11434`) to enable hybrid RAG+LLM summarization. If unavailable, platform remains fully functional in RAG-only mode.

## Test

```bash
pytest -q
```

## Render deployment (recommended)

This repository includes `render.yaml` so Render uses the correct import path and Python runtime.

- Build command: `pip install -r backend/requirements.txt`
- Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- Python version: `3.11.9`

If an older failed deploy is cached, trigger a **Clear build cache & deploy** in Render.
