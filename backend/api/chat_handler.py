from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel


class ChatRequest(BaseModel):
    query: str


class ChatHandler:
    def __init__(self, rag_system, llm_handler):
        self.rag = rag_system
        self.llm = llm_handler
        self.router = APIRouter(prefix="/api", tags=["chat"])
        self.router.add_api_route("/chat", self.chat, methods=["POST"])

    def _render_newsletter_format(self, month_data: dict[str, Any]) -> str:
        lines = [
            f"{month_data['month']} — Education Intelligence Report",
            "",
            "Overview:",
            f"{month_data['month']} reflects verified progress as reported in the official newsletter dataset.",
            "",
            "Key Statistics:",
            f"• Schools: {month_data['schools']:,}",
            f"• Teachers: {month_data['teachers']:,}",
            f"• Students: {month_data['students']:,}",
            f"• APAAR IDs: {month_data['apaar_ids']:,}",
            f"• Attendance Rate: {month_data['attendance_rate']}%",
            "",
            "Highlights:",
        ]
        lines.extend([f"• {h}" for h in month_data.get("highlights", [])])
        lines.append("")
        lines.append("Events & Initiatives:")
        for event in month_data.get("events", []):
            lines.append(f"• {event['name']} — {event['date']}")
            lines.append(f"  {event['description']}")
        return "\n".join(lines)

    def _render_no_data(self) -> str:
        return "No relevant information found in the official newsletter data."

    async def chat(self, payload: ChatRequest) -> dict[str, Any]:
        query = payload.query.strip()
        if not query:
            return {"answer": self._render_no_data(), "mode": "rag_only", "sources": []}

        results = self.rag.search(query, top_k=3)
        if not results or results[0]["score"] <= 0:
            return {"answer": self._render_no_data(), "mode": "rag_only", "sources": []}

        primary = results[0]["metadata"]
        deterministic_answer = self._render_newsletter_format(primary)

        context = "\n\n".join(item["text"] for item in results)
        llm_text = self.llm.summarize(query, context)
        if llm_text:
            answer = deterministic_answer + "\n\nEditorial Note:\n" + llm_text
            mode = "hybrid"
        else:
            answer = deterministic_answer
            mode = "rag_only"

        return {
            "answer": answer,
            "mode": mode,
            "sources": [r["source"] for r in results],
            "top_month": primary["month"],
        }
