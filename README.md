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

## Custom domain setup (organization domain)

If you want to use your own domain (instead of the default deployment URL):

1. **Point DNS**
   - Add a `CNAME` record from your subdomain (for example `dashboard.yourorg.org`)
   - Point it to your hosting provider target (Render/Replit-provided target).

2. **Add domain in hosting dashboard**
   - In your deployment settings, add the custom domain and complete TLS/SSL verification.

3. **Set keep-alive URL via environment variable**
   - Set `SERVICE_URL=https://dashboard.yourorg.org` in your deployment environment.
   - This repo now reads `SERVICE_URL` instead of relying on a hardcoded domain.

4. **Render blueprint note**
   - In `render.yaml`, `SERVICE_URL` is `sync: false`, so it can be configured per environment without merge conflicts.
