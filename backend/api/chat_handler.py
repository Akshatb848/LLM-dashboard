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

    def _format_monthly_data(self, month_data: dict[str, Any]) -> str:
        """Format monthly newsletter data"""
        lines = [
            f"📅 {month_data['month']} — Education Intelligence Report",
            "",
            "📊 Key Statistics:",
            f"• Schools: {month_data['schools']:,}",
            f"• Teachers: {month_data['teachers']:,}",
            f"• Students: {month_data['students']:,}",
            f"• APAAR IDs Generated: {month_data['apaar_ids']:,}",
            f"• Attendance Rate: {month_data['attendance_rate']}%",
            "",
            "✨ Key Highlights:",
        ]
        lines.extend([f"• {h}" for h in month_data.get("highlights", [])])

        if month_data.get("activities"):
            lines.append("")
            lines.append("🎯 Major Activities:")
            lines.extend([f"• {a}" for a in month_data.get("activities", [])[:5]])  # Show top 5

        if month_data.get("events"):
            lines.append("")
            lines.append("🎪 Notable Events:")
            for event in month_data.get("events", [])[:3]:  # Show top 3
                lines.append(f"• {event['name']} ({event['date']})")
                lines.append(f"  {event['description']}")

        if month_data.get("states"):
            lines.append("")
            lines.append("🗺️ State Performance:")
            for state, data in list(month_data.get("states", {}).items())[:3]:  # Top 3 states
                lines.append(f"• {state}: {data['attendance']}% attendance, {data['apaar_coverage']}% APAAR coverage")

        return "\n".join(lines)

    def _format_technical_data(self, tech_data: dict[str, Any]) -> str:
        """Format technical developments data"""
        lines = [
            "💻 Technical Developments & Infrastructure",
            "",
            "🎯 Dashboard Features:",
        ]

        if isinstance(tech_data, dict):
            features = tech_data.get("dashboard_features", [])
            lines.extend([f"• {f}" for f in features[:5]])

            if tech_data.get("infrastructure_upgrades"):
                lines.append("")
                lines.append("🏗️ Infrastructure Upgrades:")
                lines.extend([f"• {u}" for u in tech_data.get("infrastructure_upgrades", [])[:5]])

            if tech_data.get("apaar_milestones"):
                lines.append("")
                lines.append("📈 APAAR Milestones:")
                milestones = tech_data.get("apaar_milestones", [])
                if milestones:
                    first = milestones[0]
                    last = milestones[-1]
                    lines.append(f"• Growth: {first['registrations']:,} → {last['registrations']:,} registrations")
                    lines.append(f"• State Coverage: {first['states_active']} → {last['states_active']} states/UTs")

        return "\n".join(lines)

    def _format_kpi_data(self, kpi_data: dict[str, Any], category: str) -> str:
        """Format KPI data"""
        category_name = category.replace("_", " ").title()
        lines = [
            f"🎯 Key Performance Indicators: {category_name}",
            "",
        ]

        if isinstance(kpi_data, dict):
            for key, value in kpi_data.items():
                label = key.replace("_", " ").title()
                lines.append(f"• {label}: {value}")

        return "\n".join(lines)

    def _format_director_message(self, msg_data: dict[str, Any]) -> str:
        """Format director's message"""
        lines = [
            "✉️ Director's Message",
            "",
            f"From: {msg_data.get('name', 'Director')}",
            f"Position: {msg_data.get('position', 'Director, Department of School Education & Literacy')}",
            "",
            msg_data.get('message', ''),
        ]
        return "\n".join(lines)

    def _format_state_engagement(self, engagement_data: dict[str, Any]) -> str:
        """Format state engagement data"""
        lines = [
            "🤝 State Engagement Overview",
            "",
        ]

        if isinstance(engagement_data, dict):
            summary = engagement_data.get("correspondence_summary", {})
            if summary:
                lines.append("📊 Summary:")
                lines.append(f"• Total States/UTs: {summary.get('total_states_uts', 0)}")
                lines.append(f"• Active Participants: {summary.get('active_participants', 0)}")
                lines.append(f"• MOUs Signed: {summary.get('mou_signed', 0)}")
                lines.append(f"• Advanced Implementation: {summary.get('implementation_advanced', 0)}")

            top_states = engagement_data.get("top_performing_states", [])
            if top_states:
                lines.append("")
                lines.append("🏆 Top Performing States:")
                for state in top_states[:5]:
                    lines.append(f"• {state['name']}: APAAR {state['apaar_coverage']}%, Attendance {state['attendance']}%, Digital Readiness {state['digital_readiness']}%")

        return "\n".join(lines)

    def _format_generic_answer(self, results: list[dict[str, Any]], query: str) -> str:
        """Format a generic answer based on search results"""
        lines = [
            f"📝 Answer to: '{query}'",
            "",
            "Based on the official newsletter data:",
            "",
        ]

        # Extract key information from top results
        for i, result in enumerate(results[:3], 1):
            text = result.get("text", "")
            if text:
                # Clean up the text
                text = text.replace("\n", " ").strip()
                if len(text) > 300:
                    text = text[:297] + "..."
                lines.append(f"{i}. {text}")
                lines.append("")

        return "\n".join(lines)

    def _render_no_data(self) -> str:
        return "❌ No relevant information found in the official newsletter data. Please try asking about:\n• Monthly statistics and activities (April 2025 - January 2026)\n• APAAR ID generation progress\n• State performance and attendance rates\n• Technical developments and infrastructure\n• Learning outcomes and KPIs\n• Director's message"

    async def chat(self, payload: ChatRequest) -> dict[str, Any]:
        query = payload.query.strip()
        if not query:
            return {"answer": self._render_no_data(), "mode": "rag_only", "sources": []}

        results = self.rag.search(query, top_k=5)
        if not results or results[0]["score"] <= 0:
            return {"answer": self._render_no_data(), "mode": "rag_only", "sources": []}

        # Get the primary result
        primary = results[0]
        metadata = primary["metadata"]
        chunk_type = metadata.get("type", "month")

        # Format answer based on chunk type
        if chunk_type == "month":
            month_data = metadata.get("data", {})
            answer = self._format_monthly_data(month_data)
        elif chunk_type == "technical":
            tech_data = metadata.get("data", {})
            answer = self._format_technical_data(tech_data)
        elif chunk_type == "kpi":
            kpi_data = metadata.get("data", {})
            category = metadata.get("category", "general")
            answer = self._format_kpi_data(kpi_data, category)
        elif chunk_type == "director_message":
            msg_data = metadata.get("data", {})
            answer = self._format_director_message(msg_data)
        elif chunk_type == "state_engagement":
            engagement_data = metadata.get("data", {})
            answer = self._format_state_engagement(engagement_data)
        else:
            # Generic format for unknown types
            answer = self._format_generic_answer(results, query)

        # Add context from other results if they provide additional value
        if len(results) > 1:
            answer += "\n\n📚 Additional Context:"
            for result in results[1:3]:  # Add top 2 additional results
                result_type = result["metadata"].get("type", "")
                result_text = result.get("text", "")
                if result_text and result_type != chunk_type:  # Different type = additional value
                    snippet = result_text[:200] + "..." if len(result_text) > 200 else result_text
                    answer += f"\n• {snippet}"

        # Try to get LLM enhancement if available
        context = "\n\n".join(item["text"] for item in results[:3])
        llm_text = self.llm.summarize(query, context)
        mode = "rag_only"

        if llm_text and llm_text.strip():
            answer += "\n\n💡 AI Analysis:\n" + llm_text
            mode = "hybrid"

        return {
            "answer": answer,
            "mode": mode,
            "sources": [r["source"] for r in results[:3]],
        }
