from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

# Import data formatter, production cleaner, and source verification
try:
    from backend.llm.data_formatter import enhance_response_with_tables
    from backend.llm.production_cleaner import production_grade_cleanup, intelligent_data_visualization
    from backend.llm.source_verification import get_footer_attribution
except ImportError:
    from llm.data_formatter import enhance_response_with_tables
    from llm.production_cleaner import production_grade_cleanup, intelligent_data_visualization
    from llm.source_verification import get_footer_attribution


class ChatRequest(BaseModel):
    query: str
    language: str = "en"  # Default to English, can be "en" or "hi"


class ChatHandler:
    def __init__(self, rag_system, llm_handler):
        self.rag = rag_system
        self.llm = llm_handler
        self.router = APIRouter(prefix="/api", tags=["chat"])
        self.router.add_api_route("/chat", self.chat, methods=["POST"])

    def _format_monthly_data(self, month_data: dict[str, Any]) -> str:
        """Format monthly newsletter data"""
        lines = [
            f"[{month_data['month']}] Education Intelligence Report",
            "",
            "KEY STATISTICS:",
            f"• Schools: {month_data['schools']:,}",
            f"• Teachers: {month_data['teachers']:,}",
            f"• Students: {month_data['students']:,}",
            f"• APAAR IDs Generated: {month_data['apaar_ids']:,}",
            f"• Attendance Rate: {month_data['attendance_rate']}%",
            "",
            "HIGHLIGHTS:",
        ]
        lines.extend([f"• {h}" for h in month_data.get("highlights", [])])

        if month_data.get("activities"):
            lines.append("")
            lines.append("MAJOR ACTIVITIES:")
            lines.extend([f"• {a}" for a in month_data.get("activities", [])[:5]])

        if month_data.get("events"):
            lines.append("")
            lines.append("NOTABLE EVENTS:")
            for event in month_data.get("events", [])[:3]:
                lines.append(f"• {event['name']} ({event['date']})")
                lines.append(f"  {event['description']}")
                lines.append(f"  Participants: {event.get('participants', 'N/A'):,}")

        if month_data.get("states"):
            lines.append("")
            lines.append("STATE PERFORMANCE:")
            for state, data in list(month_data.get("states", {}).items())[:5]:
                lines.append(f"• {state}: Attendance {data['attendance']}%, APAAR Coverage {data['apaar_coverage']}%")

        return "\n".join(lines)

    def _format_technical_data(self, tech_data: dict[str, Any]) -> str:
        """Format technical developments data"""
        lines = [
            "TECHNICAL DEVELOPMENTS & INFRASTRUCTURE",
            "",
            "DASHBOARD FEATURES:",
        ]

        if isinstance(tech_data, dict):
            features = tech_data.get("dashboard_features", [])
            lines.extend([f"• {f}" for f in features[:6]])

            if tech_data.get("infrastructure_upgrades"):
                lines.append("")
                lines.append("INFRASTRUCTURE UPGRADES:")
                lines.extend([f"• {u}" for u in tech_data.get("infrastructure_upgrades", [])[:6]])

            if tech_data.get("apaar_milestones"):
                lines.append("")
                lines.append("APAAR MILESTONES:")
                milestones = tech_data.get("apaar_milestones", [])
                if milestones:
                    first = milestones[0]
                    last = milestones[-1]
                    lines.append(f"• Registration Growth: {first['registrations']:,} to {last['registrations']:,}")
                    lines.append(f"• State Coverage: {first['states_active']} to {last['states_active']} states/UTs")
                    total_growth = last['registrations'] - first['registrations']
                    lines.append(f"• Total Growth: {total_growth:,} new registrations")

        return "\n".join(lines)

    def _format_kpi_data(self, kpi_data: dict[str, Any], category: str) -> str:
        """Format KPI data"""
        category_name = category.replace("_", " ").upper()
        lines = [
            f"KEY PERFORMANCE INDICATORS: {category_name}",
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
            "DIRECTOR'S MESSAGE",
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
            "STATE ENGAGEMENT OVERVIEW",
            "",
        ]

        if isinstance(engagement_data, dict):
            summary = engagement_data.get("correspondence_summary", {})
            if summary:
                lines.append("SUMMARY:")
                lines.append(f"• Total States/UTs: {summary.get('total_states_uts', 0)}")
                lines.append(f"• Active Participants: {summary.get('active_participants', 0)}")
                lines.append(f"• MOUs Signed: {summary.get('mou_signed', 0)}")
                lines.append(f"• Advanced Implementation: {summary.get('implementation_advanced', 0)}")
                lines.append(f"• Pilot Phase: {summary.get('pilot_phase', 0)}")

            top_states = engagement_data.get("top_performing_states", [])
            if top_states:
                lines.append("")
                lines.append("TOP PERFORMING STATES:")
                for state in top_states[:5]:
                    lines.append(f"• {state['name']}:")
                    lines.append(f"  - APAAR Coverage: {state['apaar_coverage']}%")
                    lines.append(f"  - Attendance: {state['attendance']}%")
                    lines.append(f"  - Digital Readiness: {state['digital_readiness']}%")

            consent = engagement_data.get("consent_framework", {})
            if consent:
                lines.append("")
                lines.append("CONSENT FRAMEWORK:")
                lines.append(f"• Total Consents Collected: {consent.get('total_consents_collected', 0):,}")
                lines.append(f"• Digital Consent Rate: {consent.get('digital_consent_rate', 0)}%")
                lines.append(f"• Parent Awareness Programs: {consent.get('parent_awareness_programs', 0):,}")
                lines.append(f"• Data Privacy Compliance: {consent.get('data_privacy_compliance', 'N/A')}")

        return "\n".join(lines)

    def _format_generic_answer(self, results: list[dict[str, Any]], query: str) -> str:
        """Format a generic answer based on search results"""
        lines = [
            f"RESPONSE: {query}",
            "",
            "Based on official newsletter data:",
            "",
        ]

        for i, result in enumerate(results[:3], 1):
            text = result.get("text", "")
            if text:
                text = text.replace("\n", " ").strip()
                if len(text) > 350:
                    text = text[:347] + "..."
                lines.append(f"{i}. {text}")
                lines.append("")

        return "\n".join(lines)

    def _render_no_data(self) -> str:
        return """No relevant information found in the official newsletter data.

Please try asking about:
• Monthly statistics and activities (April 2025 - January 2026)
• APAAR ID generation progress and milestones
• State performance and attendance rates
• Technical developments and infrastructure
• Learning outcomes and key performance indicators
• Director's message and vision
• Major events and initiatives"""

    async def chat(self, payload: ChatRequest) -> dict[str, Any]:
        query = payload.query.strip()
        language = payload.language
        if not query:
            return {"answer": self._render_no_data(), "mode": "rag_only", "sources": []}

        results = self.rag.search(query, top_k=5)
        if not results or results[0]["score"] <= 0:
            return {"answer": self._render_no_data(), "mode": "rag_only", "sources": []}

        primary = results[0]
        metadata = primary["metadata"]
        chunk_type = metadata.get("type", "month")

        # Format RAG answer based on chunk type
        if chunk_type == "month":
            answer = self._format_monthly_data(metadata.get("data", {}))
        elif chunk_type == "technical":
            answer = self._format_technical_data(metadata.get("data", {}))
        elif chunk_type == "kpi":
            answer = self._format_kpi_data(metadata.get("data", {}), metadata.get("category", "general"))
        elif chunk_type == "director_message":
            answer = self._format_director_message(metadata.get("data", {}))
        elif chunk_type == "state_engagement":
            answer = self._format_state_engagement(metadata.get("data", {}))
        else:
            answer = self._format_generic_answer(results, query)

        # Add additional context from other search results
        additional_info = []
        for result in results[1:4]:
            if result["metadata"].get("type", "") != chunk_type:
                text = result.get("text", "")
                if text:
                    snippet = text[:250] + "..." if len(text) > 250 else text
                    additional_info.append(snippet)

        if additional_info:
            answer += "\n\nADDITIONAL CONTEXT:"
            for info in additional_info[:2]:
                answer += f"\n- {info}"

        # Try LLM enhancement
        context = "\n\n".join(item["text"] for item in results[:3])
        llm_text = self.llm.summarize(query, context, language=language)
        mode = "rag_only"

        if llm_text and llm_text.strip():
            # LLM provides the enhanced response - use it as the primary answer
            # The LLM is instructed to produce HTML tables, so preserve them
            llm_cleaned = production_grade_cleanup(llm_text)

            # If LLM response is short or lacks substance, augment with RAG data
            if len(llm_cleaned) < 100:
                answer = enhance_response_with_tables(answer, query)
                answer = production_grade_cleanup(answer)
            else:
                # Use LLM response as primary, add RAG data as supplemental
                answer = llm_cleaned

                # Add table formatting if LLM didn't provide HTML tables
                if '<table' not in answer.lower():
                    answer = enhance_response_with_tables(answer, query)
                    answer = intelligent_data_visualization(answer, query)

            mode = "hybrid"
        else:
            # RAG-only: enhance with tables
            answer = enhance_response_with_tables(answer, query)
            answer = intelligent_data_visualization(answer, query)
            answer = production_grade_cleanup(answer)

        # Add professional footer
        answer += "\n\n" + get_footer_attribution()

        return {
            "answer": answer,
            "mode": mode,
            "sources": [r["source"] for r in results[:3]],
        }
