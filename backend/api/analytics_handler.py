from __future__ import annotations

from fastapi import APIRouter


class AnalyticsHandler:
    def __init__(self, rag_system):
        self.rag = rag_system
        self.router = APIRouter(prefix="/api/analytics", tags=["analytics"])
        self.router.add_api_route("/overview", self.overview, methods=["GET"])

    async def overview(self):
        months = self.rag.newsletters
        return {
            "attendance_trend": [{"month": m["month"], "attendance": m["attendance_rate"]} for m in months],
            "apaar_trend": [{"month": m["month"], "apaar_ids": m["apaar_ids"]} for m in months],
            "states": list(months[0].get("states", {}).keys()) if months else [],
        }
