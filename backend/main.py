from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.admin_handler import AdminHandler
from api.analytics_handler import AnalyticsHandler
from api.chat_handler import ChatHandler
from api.newsletter_handler import NewsletterHandler
from llm.llm_handler import LLMHandler
from rag.rag_system import RagSystem

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "newsletter_data.json"

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
