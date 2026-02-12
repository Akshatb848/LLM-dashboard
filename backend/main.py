from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.api.admin_handler import AdminHandler
from backend.api.analytics_handler import AnalyticsHandler
from backend.api.chat_handler import ChatHandler
from backend.api.newsletter_handler import NewsletterHandler
from backend.llm.llm_handler import LLMHandler
from backend.rag.rag_system import RagSystem

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "newsletter_data.json"
FRONTEND_DIR = BASE_DIR.parent / "frontend"

rag_system = RagSystem(str(DATA_PATH))
rag_system.initialize()
llm_handler = LLMHandler()

app = FastAPI(title="Smart Education Newsletter Platform", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ChatHandler(rag_system, llm_handler).router)
app.include_router(NewsletterHandler(rag_system).router)
app.include_router(AnalyticsHandler(rag_system).router)
app.include_router(AdminHandler(rag_system).router)

# Serve static files (CSS, JS)
if FRONTEND_DIR.exists():
    app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
    app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")


@app.get("/")
async def root():
    """Serve the frontend index.html"""
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return {"message": "Frontend not found. API is running at /api/*"}


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "rag_initialized": len(rag_system.chunks) > 0,
        "mode": "hybrid" if llm_handler.enabled else "rag_only",
    }


@app.get("/api/llm/status")
async def llm_status():
    return llm_handler.status()
