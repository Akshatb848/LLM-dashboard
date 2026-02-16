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
        """Format monthly newsletter data with HTML tables for production display"""
        month = month_data.get('month', 'Unknown')

        # Key Statistics table
        stats_rows = ""
        stats = [
            ("Schools", f"{month_data.get('schools', 0):,}"),
            ("Teachers", f"{month_data.get('teachers', 0):,}"),
            ("Students", f"{month_data.get('students', 0):,}"),
            ("APAAR IDs Generated", f"{month_data.get('apaar_ids', 0):,}"),
            ("Attendance Rate", f"{month_data.get('attendance_rate', 0)}%"),
        ]
        for i, (metric, value) in enumerate(stats):
            bg = "#ffffff" if i % 2 == 0 else "#f8f9fa"
            stats_rows += (
                f'<tr style="background:{bg};">'
                f'<td style="padding:12px;border-bottom:1px solid #e0e0e0;font-weight:500;color:#003d82;">{metric}</td>'
                f'<td style="padding:12px;border-bottom:1px solid #e0e0e0;color:#333;font-weight:600;">{value}</td>'
                f'</tr>'
            )

        result = f"<strong>{month} - Education Intelligence Report</strong>\n\n"
        result += (
            '<table style="border-collapse:collapse;width:100%;margin:16px 0;box-shadow:0 2px 8px rgba(0,61,130,0.12);'
            'border-radius:8px;overflow:hidden;">'
            '<thead><tr style="background:linear-gradient(135deg,#003d82,#0056b3);color:white;">'
            '<th style="padding:14px 12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">Metric</th>'
            '<th style="padding:14px 12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">Value</th>'
            f'</tr></thead><tbody>{stats_rows}</tbody></table>'
        )

        # Highlights
        highlights = month_data.get("highlights", [])
        if highlights:
            result += "\n\n<strong>Key Highlights:</strong>\n<ul>"
            for h in highlights:
                result += f"<li>{h}</li>"
            result += "</ul>"

        # State performance table
        states = month_data.get("states", {})
        if states:
            state_rows = ""
            for i, (state, data) in enumerate(states.items()):
                bg = "#ffffff" if i % 2 == 0 else "#f8f9fa"
                att_color = "#28a745" if data.get('attendance', 0) >= 95 else "#333"
                state_rows += (
                    f'<tr style="background:{bg};">'
                    f'<td style="padding:10px;border-bottom:1px solid #e0e0e0;font-weight:500;color:#003d82;">{state}</td>'
                    f'<td style="padding:10px;border-bottom:1px solid #e0e0e0;color:{att_color};font-weight:600;">{data.get("attendance", "N/A")}%</td>'
                    f'<td style="padding:10px;border-bottom:1px solid #e0e0e0;color:#333;">{data.get("apaar_coverage", "N/A")}%</td>'
                    f'<td style="padding:10px;border-bottom:1px solid #e0e0e0;color:#333;">{data.get("schools", 0):,}</td>'
                    f'</tr>'
                )
            result += (
                '\n\n<strong>State Performance:</strong>\n'
                '<table style="border-collapse:collapse;width:100%;margin:16px 0;box-shadow:0 2px 8px rgba(0,61,130,0.12);'
                'border-radius:8px;overflow:hidden;">'
                '<thead><tr style="background:linear-gradient(135deg,#003d82,#0056b3);color:white;">'
                '<th style="padding:12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">State</th>'
                '<th style="padding:12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">Attendance</th>'
                '<th style="padding:12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">APAAR Coverage</th>'
                '<th style="padding:12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">Schools</th>'
                f'</tr></thead><tbody>{state_rows}</tbody></table>'
            )

        return result

    def _format_technical_data(self, tech_data: dict[str, Any]) -> str:
        """Format technical developments data with HTML"""
        if not isinstance(tech_data, dict):
            return "Technical development data is not available."

        result = "<strong>Technical Developments & Infrastructure</strong>\n\n"

        # Dashboard Features
        features = tech_data.get("dashboard_features", [])
        if features:
            result += "<strong>Dashboard Features:</strong>\n<ul>"
            for f in features[:8]:
                result += f"<li>{f}</li>"
            result += "</ul>\n\n"

        # Infrastructure Upgrades
        upgrades = tech_data.get("infrastructure_upgrades", [])
        if upgrades:
            result += "<strong>Infrastructure Upgrades:</strong>\n<ul>"
            for u in upgrades[:8]:
                result += f"<li>{u}</li>"
            result += "</ul>\n\n"

        # APAAR Milestones as table
        milestones = tech_data.get("apaar_milestones", [])
        if milestones:
            rows = ""
            for i, m in enumerate(milestones):
                bg = "#ffffff" if i % 2 == 0 else "#f8f9fa"
                rows += (
                    f'<tr style="background:{bg};">'
                    f'<td style="padding:10px;border-bottom:1px solid #e0e0e0;font-weight:500;color:#003d82;">{m.get("month", "N/A")}</td>'
                    f'<td style="padding:10px;border-bottom:1px solid #e0e0e0;color:#333;font-weight:600;">{m.get("registrations", 0):,}</td>'
                    f'<td style="padding:10px;border-bottom:1px solid #e0e0e0;color:#333;">{m.get("states_active", 0)}</td>'
                    f'</tr>'
                )
            result += (
                '<strong>APAAR Registration Milestones:</strong>\n'
                '<table style="border-collapse:collapse;width:100%;margin:16px 0;box-shadow:0 2px 8px rgba(0,61,130,0.12);'
                'border-radius:8px;overflow:hidden;">'
                '<thead><tr style="background:linear-gradient(135deg,#003d82,#0056b3);color:white;">'
                '<th style="padding:12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">Month</th>'
                '<th style="padding:12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">Registrations</th>'
                '<th style="padding:12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">States Active</th>'
                f'</tr></thead><tbody>{rows}</tbody></table>'
            )

        return result

    def _format_kpi_data(self, kpi_data: dict[str, Any], category: str) -> str:
        """Format KPI data as HTML table"""
        category_name = category.replace("_", " ").title()

        if not isinstance(kpi_data, dict) or not kpi_data:
            return f"KPI data for {category_name} is not available."

        rows = ""
        for i, (key, value) in enumerate(kpi_data.items()):
            label = key.replace("_", " ").title()
            bg = "#ffffff" if i % 2 == 0 else "#f8f9fa"
            rows += (
                f'<tr style="background:{bg};">'
                f'<td style="padding:12px;border-bottom:1px solid #e0e0e0;font-weight:500;color:#003d82;">{label}</td>'
                f'<td style="padding:12px;border-bottom:1px solid #e0e0e0;color:#333;font-weight:600;">{value}</td>'
                f'</tr>'
            )

        return (
            f'<strong>Key Performance Indicators: {category_name}</strong>\n\n'
            '<table style="border-collapse:collapse;width:100%;margin:16px 0;box-shadow:0 2px 8px rgba(0,61,130,0.12);'
            'border-radius:8px;overflow:hidden;">'
            '<thead><tr style="background:linear-gradient(135deg,#003d82,#0056b3);color:white;">'
            '<th style="padding:14px 12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">Indicator</th>'
            '<th style="padding:14px 12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">Value</th>'
            f'</tr></thead><tbody>{rows}</tbody></table>'
        )

    def _format_director_message(self, msg_data: dict[str, Any]) -> str:
        """Format director's message"""
        name = msg_data.get('name', 'Director')
        position = msg_data.get('position', 'Director, Department of School Education & Literacy')
        message = msg_data.get('message', '')

        # Format message paragraphs
        paragraphs = message.split('\n\n')
        formatted_msg = ''.join(f'<p style="margin-bottom:12px;line-height:1.8;">{p.strip()}</p>' for p in paragraphs if p.strip())

        return (
            f'<strong>Director\'s Message</strong>\n\n'
            f'<p><strong>From:</strong> {name}<br>'
            f'<strong>Position:</strong> {position}</p>\n\n'
            f'{formatted_msg}'
        )

    def _format_state_engagement(self, engagement_data: dict[str, Any]) -> str:
        """Format state engagement data with HTML tables"""
        if not isinstance(engagement_data, dict):
            return "State engagement data is not available."

        result = "<strong>State Engagement Overview</strong>\n\n"

        # Summary table
        summary = engagement_data.get("correspondence_summary", {})
        if summary:
            summary_items = [
                ("Total States/UTs", str(summary.get('total_states_uts', 0))),
                ("Active Participants", str(summary.get('active_participants', 0))),
                ("MOUs Signed", str(summary.get('mou_signed', 0))),
                ("Advanced Implementation", str(summary.get('implementation_advanced', 0))),
                ("Pilot Phase", str(summary.get('pilot_phase', 0))),
            ]
            rows = ""
            for i, (label, val) in enumerate(summary_items):
                bg = "#ffffff" if i % 2 == 0 else "#f8f9fa"
                rows += (
                    f'<tr style="background:{bg};">'
                    f'<td style="padding:10px;border-bottom:1px solid #e0e0e0;font-weight:500;color:#003d82;">{label}</td>'
                    f'<td style="padding:10px;border-bottom:1px solid #e0e0e0;color:#333;font-weight:600;">{val}</td>'
                    f'</tr>'
                )
            result += (
                '<table style="border-collapse:collapse;width:100%;margin:16px 0;box-shadow:0 2px 8px rgba(0,61,130,0.12);'
                'border-radius:8px;overflow:hidden;">'
                '<thead><tr style="background:linear-gradient(135deg,#003d82,#0056b3);color:white;">'
                '<th style="padding:12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">Parameter</th>'
                '<th style="padding:12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">Value</th>'
                f'</tr></thead><tbody>{rows}</tbody></table>\n\n'
            )

        # Top performing states table
        top_states = engagement_data.get("top_performing_states", [])
        if top_states:
            state_rows = ""
            for i, state in enumerate(top_states[:5]):
                bg = "#ffffff" if i % 2 == 0 else "#f8f9fa"
                state_rows += (
                    f'<tr style="background:{bg};">'
                    f'<td style="padding:10px;border-bottom:1px solid #e0e0e0;font-weight:500;color:#003d82;">{state.get("name", "N/A")}</td>'
                    f'<td style="padding:10px;border-bottom:1px solid #e0e0e0;color:#333;font-weight:600;">{state.get("apaar_coverage", "N/A")}%</td>'
                    f'<td style="padding:10px;border-bottom:1px solid #e0e0e0;color:#333;font-weight:600;">{state.get("attendance", "N/A")}%</td>'
                    f'<td style="padding:10px;border-bottom:1px solid #e0e0e0;color:#333;">{state.get("digital_readiness", "N/A")}%</td>'
                    f'</tr>'
                )
            result += (
                '<strong>Top Performing States:</strong>\n'
                '<table style="border-collapse:collapse;width:100%;margin:16px 0;box-shadow:0 2px 8px rgba(0,61,130,0.12);'
                'border-radius:8px;overflow:hidden;">'
                '<thead><tr style="background:linear-gradient(135deg,#003d82,#0056b3);color:white;">'
                '<th style="padding:12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">State</th>'
                '<th style="padding:12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">APAAR Coverage</th>'
                '<th style="padding:12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">Attendance</th>'
                '<th style="padding:12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">Digital Readiness</th>'
                f'</tr></thead><tbody>{state_rows}</tbody></table>'
            )

        return result

    def _format_generic_answer(self, results: list[dict[str, Any]], query: str) -> str:
        """Format a generic answer based on search results"""
        result = f"<strong>Based on official newsletter data:</strong>\n\n<ul>"

        for res in results[:3]:
            text = res.get("text", "")
            if text:
                text = text.replace("\n", " ").strip()
                if len(text) > 400:
                    text = text[:397] + "..."
                result += f"<li style='margin-bottom:12px;line-height:1.6;'>{text}</li>"

        result += "</ul>"
        return result

    def _render_no_data(self) -> str:
        return (
            "<strong>No relevant information found in the official newsletter data.</strong>\n\n"
            "<p>Please try asking about:</p>\n"
            "<ul>"
            "<li>Monthly statistics and activities (April 2025 - January 2026)</li>"
            "<li>APAAR ID generation progress and milestones</li>"
            "<li>State performance and attendance rates</li>"
            "<li>Technical developments and infrastructure</li>"
            "<li>Learning outcomes and key performance indicators</li>"
            "<li>Director's message and vision</li>"
            "<li>Major events and initiatives</li>"
            "</ul>"
        )

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
