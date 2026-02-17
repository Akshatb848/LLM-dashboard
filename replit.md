# VSK Dashboard - Rashtriya Vidya Samiksha Kendra

## Overview
Smart Education Newsletter Platform for the Ministry of Education, Government of India. Features a FastAPI backend serving a static HTML/CSS/JS frontend with RAG-based AI chat, newsletter data visualization, and analytics dashboards.

## Project Architecture
- **Backend**: Python FastAPI (uvicorn) serving API endpoints and static frontend files
- **Frontend**: Static HTML/CSS/JS with Chart.js for data visualization
- **AI**: RAG system using TF-IDF + optional Ollama LLM for chat assistant
- **Data**: JSON-based newsletter data (`backend/data/newsletter_data.json`)

## Directory Structure
```
backend/
  main.py              - FastAPI app entry point
  api/                  - API route handlers (chat, newsletter, analytics, admin)
  llm/                  - LLM handler, system prompt, response formatting
  rag/                  - RAG system with TF-IDF vectorization
  data/                 - Newsletter JSON data and detailed context
frontend/
  index.html            - Main dashboard page
  css/                  - Stylesheets
  js/                   - Client-side JavaScript (app.js, chat widgets)
  assets/               - SVG logos and images
```

## Running the App
- Workflow: `python -m uvicorn backend.main:app --host 0.0.0.0 --port 5000`
- The FastAPI server serves both the API and the static frontend on port 5000

## Environment Variables (Optional)
- `OLLAMA_URL` - URL for Ollama LLM server (if empty, runs in RAG-only mode)
- `OLLAMA_MODEL` - Ollama model name (default: llama3.1)

## Recent Changes
- 2026-02-17: Initial Replit setup, configured for port 5000, fixed API_BASE for proxy compatibility
