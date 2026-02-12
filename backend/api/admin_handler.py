from __future__ import annotations

from fastapi import APIRouter


class AdminHandler:
    def __init__(self, rag_system):
        self.rag = rag_system
        self.router = APIRouter(prefix="/api/admin", tags=["admin"])
        self.router.add_api_route("/stats", self.stats, methods=["GET"])

    async def stats(self):
        return {
            "documents_loaded": len(self.rag.newsletters),
            "chunks_indexed": len(self.rag.chunks),
            "faiss_enabled": self.rag.using_faiss,
        }
