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
  index.html            - Main dashboard (7-layer architecture)
  css/
    style.css           - Base styles, variables, gov theme
    enhanced-ui.css     - Enhanced UI components
    dashboard-layers.css - Layered dashboard: carousel, leadership, 6A, stats, best practices
  js/
    app.js              - Core data loading and initialization
    chat-widget.js      - Chat FAB and widget panel
    enhanced-chat.js    - Language selection and enhanced chat
    translations.js     - Bilingual support (EN/HI)
    sidebar-functionality.js - Sidebar and header controls
    dashboard-layers.js - Newsletter carousel, nav highlighting
  assets/               - SVG logos, gov header, leadership photos
```

## Running the App
- Workflow: `python -m uvicorn backend.main:app --host 0.0.0.0 --port 5000`
- The FastAPI server serves both the API and the static frontend on port 5000

## Environment Variables (Optional)
- `OLLAMA_URL` - URL for Ollama LLM server (if empty, runs in RAG-only mode)
- `OLLAMA_MODEL` - Ollama model name (default: llama3.1)

## Chatbot Features
- **Bilingual**: Full English and Hindi response support with auto-language detection
- **Hinglish Support**: Detects Latin-script Hindi (e.g., "RVSK mein kitne schools hain?")
- **Language Detection**: Devanagari detection + Hinglish keyword matching (25% threshold)
- **Leadership Accuracy**: Canonical names used — Prof. Dinesh Prasad Saklani, Prof. Amarendra Behera, Prof. Indu Kumar
- **Hallucination Control**: Only indexed newsletter data; explicit "not available" messages in both languages
- **Structured Responses**: HTML tables with VSK styling, bullet points, headings
- **RAG-only mode**: Works without external LLM; optional Ollama integration for enhanced analysis

## Recent Changes
- 2026-02-18: UI corrections patch — replaced leadership letter avatars with real photos (circular crop), updated Operational VSKs from 37 to 38 (35 States/UTs + 3 CABs) across stats/newsletter/data/RAG, updated footer to NCERT address (Sri Aurobindo Marg, New Delhi 110016), added DPDP Act 2023 compliance handler to chatbot (bilingual, structured table, scope disclaimer)
- 2026-02-18: Chatbot bilingual fine-tuning — added Hindi response labels, auto language detection (Devanagari + Hinglish), leadership query handling with canonical names, 6A Framework dedicated handler, Hindi RAG chunks, bilingual system prompt, hallucination guardrails
- 2026-02-18: Header branding update — MoE and NCERT logos, leadership name/designation attribution
- 2026-02-18: Restructured dashboard into 7-layer architecture with newsletter carousel, leadership cards, 6A framework band, VSK statistics, best practices grid, national programs band, and AI assistant section. Created dashboard-layers.css and dashboard-layers.js.
- 2026-02-17: Initial Replit setup, configured for port 5000, fixed API_BASE for proxy compatibility
