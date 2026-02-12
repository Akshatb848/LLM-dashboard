from __future__ import annotations

from fastapi import APIRouter, HTTPException


class NewsletterHandler:
    def __init__(self, rag_system):
        self.rag = rag_system
        self.router = APIRouter(prefix="/api/newsletter", tags=["newsletter"])
        self.router.add_api_route("/months", self.months, methods=["GET"])
        self.router.add_api_route("/{month_name}", self.month_detail, methods=["GET"])

    async def months(self):
        return {"months": self.rag.list_months()}

    async def month_detail(self, month_name: str):
        month = self.rag.get_month(month_name.replace("%20", " "))
        if not month:
            raise HTTPException(status_code=404, detail="Month not found in official dataset")
        return month
