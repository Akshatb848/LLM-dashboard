from __future__ import annotations

import re
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

try:
    from backend.llm.production_cleaner import production_grade_cleanup
    from backend.llm.source_verification import get_footer_attribution
except ImportError:
    from llm.production_cleaner import production_grade_cleanup
    from llm.source_verification import get_footer_attribution

# Month names for query detection
MONTH_NAMES = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
]

TABLE_STYLE = (
    'border-collapse:collapse;width:100%;margin:16px 0;'
    'box-shadow:0 2px 8px rgba(0,61,130,0.12);border-radius:8px;overflow:hidden;'
    "font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;"
)
THEAD_STYLE = 'background:linear-gradient(135deg,#003d82 0%,#0056b3 100%);color:white;'
TH_STYLE = 'padding:14px 12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;'


def _row_bg(i: int) -> str:
    return "#ffffff" if i % 2 == 0 else "#f8f9fa"


def _td(value: str, bold: bool = False, color: str = "#333") -> str:
    fw = "font-weight:600;" if bold else ""
    return f'<td style="padding:12px;border-bottom:1px solid #e0e0e0;{fw}color:{color};">{value}</td>'


def _html_table(headers: list[str], rows: list[list[str]], *,
                col_styles: list[dict] | None = None) -> str:
    """Build a fully-styled HTML table."""
    ths = "".join(f'<th style="{TH_STYLE}">{h}</th>' for h in headers)
    body = ""
    for i, row in enumerate(rows):
        bg = _row_bg(i)
        cells = ""
        for j, cell in enumerate(row):
            st = (col_styles[j] if col_styles and j < len(col_styles) else {})
            cells += _td(cell, bold=st.get("bold", False), color=st.get("color", "#333"))
        body += f'<tr style="background:{bg};">{cells}</tr>'
    return (
        f'<table style="{TABLE_STYLE}">'
        f'<thead><tr style="{THEAD_STYLE}">{ths}</tr></thead>'
        f'<tbody>{body}</tbody></table>'
    )


class ChatRequest(BaseModel):
    query: str
    language: str = "en"


class ChatHandler:
    def __init__(self, rag_system, llm_handler):
        self.rag = rag_system
        self.llm = llm_handler
        self.router = APIRouter(prefix="/api", tags=["chat"])
        self.router.add_api_route("/chat", self.chat, methods=["POST"])

    # ------------------------------------------------------------------
    # Month detection helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _detect_month_in_query(query: str) -> str | None:
        """Return 'Month YYYY' if the query references a specific month."""
        q = query.lower()
        for m in MONTH_NAMES:
            if m in q:
                # Try to find a year
                year_match = re.search(r'(202[4-9]|2030)', q)
                year = year_match.group(1) if year_match else "2025"
                if m == "january" and "2026" not in q:
                    year = "2026"
                return f"{m.capitalize()} {year}"
        return None

    def _find_month_data(self, month_name: str) -> dict[str, Any] | None:
        """Lookup structured month data from the RAG system."""
        return self.rag.get_month(month_name)

    # ------------------------------------------------------------------
    # Formatters
    # ------------------------------------------------------------------
    def _format_monthly_data(self, md: dict[str, Any]) -> str:
        """Comprehensive monthly formatter with statistics, activities, events, and states."""
        month = md.get("month", "Unknown")
        parts: list[str] = []

        # --- Title
        parts.append(f'<h3 style="color:#003d82;margin:0 0 16px 0;">{month} — Education Intelligence Report</h3>')

        # --- Key Statistics table
        stats = [
            ("Schools", f"{md.get('schools', 0):,}"),
            ("Teachers", f"{md.get('teachers', 0):,}"),
            ("Students", f"{md.get('students', 0):,}"),
            ("APAAR IDs Generated", f"{md.get('apaar_ids', 0):,}"),
            ("Attendance Rate", f"{md.get('attendance_rate', 0)}%"),
        ]
        parts.append('<p style="margin:8px 0;"><strong>Key Statistics:</strong></p>')
        parts.append(_html_table(
            ["Metric", "Value"],
            [[s[0], s[1]] for s in stats],
            col_styles=[{"bold": True, "color": "#003d82"}, {"bold": True}],
        ))

        # --- Highlights
        highlights = md.get("highlights", [])
        if highlights:
            parts.append('<p style="margin:20px 0 8px;"><strong>Key Highlights:</strong></p><ul style="margin:0;padding-left:24px;">')
            for h in highlights:
                parts.append(f'<li style="margin:6px 0;line-height:1.7;">{h}</li>')
            parts.append("</ul>")

        # --- Activities table
        activities = md.get("activities", [])
        if activities:
            parts.append('<p style="margin:20px 0 8px;"><strong>Major Activities &amp; Initiatives:</strong></p>')
            parts.append(_html_table(
                ["#", "Activity / Initiative"],
                [[str(i + 1), a] for i, a in enumerate(activities)],
                col_styles=[{"bold": True, "color": "#003d82"}, {}],
            ))

        # --- Events table
        events = md.get("events", [])
        if events:
            parts.append('<p style="margin:20px 0 8px;"><strong>Notable Events:</strong></p>')
            rows = []
            for e in events:
                rows.append([
                    e.get("name", ""),
                    e.get("date", ""),
                    e.get("description", ""),
                    f'{e.get("participants", 0):,}',
                ])
            parts.append(_html_table(
                ["Event", "Date", "Description", "Participants"],
                rows,
                col_styles=[
                    {"bold": True, "color": "#003d82"},
                    {"color": "#FF6600"},
                    {},
                    {"bold": True, "color": "#28a745"},
                ],
            ))

        # --- State Performance table
        states = md.get("states", {})
        if states:
            parts.append('<p style="margin:20px 0 8px;"><strong>State-wise Performance:</strong></p>')
            state_rows = []
            for state, data in states.items():
                att = data.get("attendance", "N/A")
                att_color = "#28a745" if isinstance(att, (int, float)) and att >= 95 else "#333"
                state_rows.append([
                    state,
                    f'{att}%',
                    f'{data.get("apaar_coverage", "N/A")}%',
                    f'{data.get("schools", 0):,}',
                ])
            parts.append(_html_table(
                ["State / UT", "Attendance", "APAAR Coverage", "Schools"],
                state_rows,
                col_styles=[
                    {"bold": True, "color": "#003d82"},
                    {"bold": True, "color": "#28a745"},
                    {"bold": True},
                    {},
                ],
            ))

        return "\n".join(parts)

    def _format_technical_data(self, tech_data: dict[str, Any]) -> str:
        if not isinstance(tech_data, dict):
            return "<p>Technical development data is not available.</p>"

        parts = ['<h3 style="color:#003d82;margin:0 0 16px 0;">Technical Developments &amp; Infrastructure</h3>']

        features = tech_data.get("dashboard_features", [])
        if features:
            parts.append('<p style="margin:12px 0 8px;"><strong>Dashboard Features:</strong></p>')
            parts.append(_html_table(
                ["#", "Feature"],
                [[str(i + 1), f] for i, f in enumerate(features)],
                col_styles=[{"bold": True, "color": "#003d82"}, {}],
            ))

        upgrades = tech_data.get("infrastructure_upgrades", [])
        if upgrades:
            parts.append('<p style="margin:20px 0 8px;"><strong>Infrastructure Upgrades:</strong></p>')
            parts.append(_html_table(
                ["#", "Upgrade"],
                [[str(i + 1), u] for i, u in enumerate(upgrades)],
                col_styles=[{"bold": True, "color": "#003d82"}, {}],
            ))

        milestones = tech_data.get("apaar_milestones", [])
        if milestones:
            parts.append('<p style="margin:20px 0 8px;"><strong>APAAR Registration Milestones:</strong></p>')
            rows = []
            prev_reg = 0
            for m in milestones:
                reg = m.get("registrations", 0)
                growth = ""
                if prev_reg > 0:
                    pct = ((reg - prev_reg) / prev_reg) * 100
                    growth = f"+{pct:.1f}%"
                prev_reg = reg
                rows.append([
                    m.get("month", "N/A"),
                    f'{reg:,}',
                    str(m.get("states_active", 0)),
                    growth,
                ])
            parts.append(_html_table(
                ["Month", "Registrations", "States Active", "Growth"],
                rows,
                col_styles=[
                    {"bold": True, "color": "#003d82"},
                    {"bold": True},
                    {},
                    {"bold": True, "color": "#28a745"},
                ],
            ))

        return "\n".join(parts)

    def _format_kpi_data(self, kpi_data: dict[str, Any], category: str) -> str:
        category_name = category.replace("_", " ").title()
        if not isinstance(kpi_data, dict) or not kpi_data:
            return f"<p>KPI data for {category_name} is not available.</p>"

        rows = [[key.replace("_", " ").title(), str(value)] for key, value in kpi_data.items()]
        return (
            f'<h3 style="color:#003d82;margin:0 0 16px 0;">Key Performance Indicators: {category_name}</h3>'
            + _html_table(["Indicator", "Value"], rows,
                          col_styles=[{"bold": True, "color": "#003d82"}, {"bold": True}])
        )

    def _format_director_message(self, msg: dict[str, Any]) -> str:
        name = msg.get("name", "Director")
        position = msg.get("position", "Director, Dept. of School Education & Literacy")
        message = msg.get("message", "")
        paragraphs = "".join(
            f'<p style="margin-bottom:12px;line-height:1.8;">{p.strip()}</p>'
            for p in message.split("\n\n") if p.strip()
        )
        return (
            f'<h3 style="color:#003d82;margin:0 0 16px 0;">Director\'s Message</h3>'
            f'<p><strong>{name}</strong><br><em>{position}</em></p>{paragraphs}'
        )

    def _format_state_engagement(self, eng: dict[str, Any]) -> str:
        if not isinstance(eng, dict):
            return "<p>State engagement data is not available.</p>"

        parts = ['<h3 style="color:#003d82;margin:0 0 16px 0;">State Engagement Overview</h3>']

        summary = eng.get("correspondence_summary", {})
        if summary:
            rows = [
                ["Total States / UTs", str(summary.get("total_states_uts", 0))],
                ["Active Participants", str(summary.get("active_participants", 0))],
                ["MOUs Signed", str(summary.get("mou_signed", 0))],
                ["Advanced Implementation", str(summary.get("implementation_advanced", 0))],
                ["Pilot Phase", str(summary.get("pilot_phase", 0))],
            ]
            parts.append(_html_table(["Parameter", "Value"], rows,
                                     col_styles=[{"bold": True, "color": "#003d82"}, {"bold": True}]))

        top = eng.get("top_performing_states", [])
        if top:
            parts.append('<p style="margin:20px 0 8px;"><strong>Top Performing States:</strong></p>')
            rows = [
                [s["name"], f'{s["apaar_coverage"]}%', f'{s["attendance"]}%', f'{s["digital_readiness"]}%']
                for s in top[:5]
            ]
            parts.append(_html_table(
                ["State", "APAAR Coverage", "Attendance", "Digital Readiness"], rows,
                col_styles=[{"bold": True, "color": "#003d82"}, {"bold": True}, {"bold": True}, {}],
            ))

        consent = eng.get("consent_framework", {})
        if consent:
            parts.append('<p style="margin:20px 0 8px;"><strong>Consent Framework:</strong></p>')
            rows = [
                ["Total Consents Collected", f'{consent.get("total_consents_collected", 0):,}'],
                ["Digital Consent Rate", f'{consent.get("digital_consent_rate", 0)}%'],
                ["Parent Awareness Programs", f'{consent.get("parent_awareness_programs", 0):,}'],
                ["Data Privacy Compliance", str(consent.get("data_privacy_compliance", "N/A"))],
            ]
            parts.append(_html_table(["Parameter", "Value"], rows,
                                     col_styles=[{"bold": True, "color": "#003d82"}, {"bold": True}]))

        return "\n".join(parts)

    def _render_no_data(self) -> str:
        return (
            '<p><strong>No relevant information found in the official newsletter data.</strong></p>'
            '<p>Please try asking about:</p>'
            '<ul>'
            '<li>Monthly statistics and activities (April 2025 - January 2026)</li>'
            '<li>APAAR ID generation progress and milestones</li>'
            '<li>State performance and attendance rates</li>'
            '<li>Technical developments and infrastructure</li>'
            '<li>Learning outcomes and key performance indicators</li>'
            '</ul>'
        )

    # ------------------------------------------------------------------
    # Intelligent response assembly
    # ------------------------------------------------------------------
    def _try_structured_format(self, results: list[dict], query: str) -> str | None:
        """
        Walk through ALL search results and pick the best structured
        data source.  Prioritise structured types over detailed_context.
        If no structured type is found in search results, use keyword
        detection to explicitly fetch structured data.
        """
        # --- Step A: Check if the query is about a specific month ---
        target_month = self._detect_month_in_query(query)
        if target_month:
            month_data = self._find_month_data(target_month)
            if month_data:
                return self._format_monthly_data(month_data)

        # --- Step B: Search results for a structured type ---
        priority = {
            "month": 1,
            "kpi": 2,
            "state_engagement": 3,
            "technical": 4,
            "director_message": 5,
            "detailed_context": 99,
        }

        best = None
        best_pri = 999
        for r in results:
            t = r["metadata"].get("type", "")
            pri = priority.get(t, 100)
            if pri < best_pri:
                best = r
                best_pri = pri

        # If we found a structured type, use it
        if best and best_pri < 99:
            chunk_type = best["metadata"].get("type", "")
            data = best["metadata"].get("data", {})

            if chunk_type == "month":
                return self._format_monthly_data(data)
            elif chunk_type == "technical":
                return self._format_technical_data(data)
            elif chunk_type == "kpi":
                return self._format_kpi_data(data, best["metadata"].get("category", "general"))
            elif chunk_type == "director_message":
                return self._format_director_message(data)
            elif chunk_type == "state_engagement":
                return self._format_state_engagement(data)

        # --- Step C: Keyword-based fallback to structured data ---
        q_lower = query.lower()

        # Technical query: fetch structured tech data from RAG
        tech_keywords = ["technical", "dashboard", "infrastructure", "upgrade", "feature", "system", "platform"]
        if any(kw in q_lower for kw in tech_keywords):
            tech_data = self.rag.data.get("technical_developments")
            if tech_data:
                return self._format_technical_data(tech_data)

        # KPI query: fetch structured KPI data
        kpi_keywords = ["kpi", "performance indicator", "learning outcome", "equity", "growth metric"]
        if any(kw in q_lower for kw in kpi_keywords):
            kpis = self.rag.data.get("key_performance_indicators", {})
            if kpis:
                parts = []
                for cat, data in kpis.items():
                    parts.append(self._format_kpi_data(data, cat))
                return "\n".join(parts)

        # State engagement query
        state_keywords = ["state engagement", "state performance", "top state", "top performing"]
        if any(kw in q_lower for kw in state_keywords):
            eng_data = self.rag.data.get("state_engagement")
            if eng_data:
                return self._format_state_engagement(eng_data)

        # Director message query
        director_keywords = ["director", "message", "vision"]
        if all(kw in q_lower for kw in ["director"]):
            msg_data = self.rag.data.get("director_message")
            if msg_data:
                return self._format_director_message(msg_data)

        return None

    # ------------------------------------------------------------------
    # Main chat endpoint
    # ------------------------------------------------------------------
    async def chat(self, payload: ChatRequest) -> dict[str, Any]:
        query = payload.query.strip()
        language = payload.language
        if not query:
            return {"answer": self._render_no_data(), "mode": "rag_only", "sources": []}

        results = self.rag.search(query, top_k=5)
        if not results or results[0]["score"] <= 0:
            return {"answer": self._render_no_data(), "mode": "rag_only", "sources": []}

        # ---- Step 1: Build a structured answer from the best data ----
        answer = self._try_structured_format(results, query)

        if not answer:
            # Fallback: basic formatted list from search results
            answer = '<p><strong>Based on official newsletter data:</strong></p><ul>'
            for r in results[:3]:
                txt = r.get("text", "").replace("\n", " ").strip()
                if txt:
                    if len(txt) > 350:
                        txt = txt[:347] + "..."
                    answer += f'<li style="margin:8px 0;line-height:1.7;">{txt}</li>'
            answer += "</ul>"

        # ---- Step 2: Try LLM enhancement ----
        context = "\n\n".join(item["text"] for item in results[:3])
        llm_text = self.llm.summarize(query, context, language=language)
        mode = "rag_only"

        if llm_text and llm_text.strip():
            llm_cleaned = production_grade_cleanup(llm_text)
            if len(llm_cleaned) > 150:
                # If LLM produced HTML tables, use its response
                if "<table" in llm_cleaned.lower():
                    answer = llm_cleaned
                else:
                    # Append LLM analysis as a supplementary insight section
                    answer += (
                        '\n<hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;">'
                        '\n<p style="margin:12px 0 8px;"><strong>Analysis &amp; Insights:</strong></p>'
                        f'\n<div style="padding:12px 16px;background:#f8f9fa;border-left:4px solid #003d82;'
                        f'border-radius:4px;line-height:1.7;">{llm_cleaned}</div>'
                    )
            mode = "hybrid"

        # ---- Step 3: Professional footer ----
        answer += '\n\n' + get_footer_attribution()

        return {
            "answer": answer,
            "mode": mode,
            "sources": [r["source"] for r in results[:3]],
        }
