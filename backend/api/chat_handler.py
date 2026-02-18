from __future__ import annotations

import re
import unicodedata
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

try:
    from backend.llm.production_cleaner import production_grade_cleanup
    from backend.llm.source_verification import get_footer_attribution
except ImportError:
    from llm.production_cleaner import production_grade_cleanup
    from llm.source_verification import get_footer_attribution

MONTH_NAMES = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
]

MONTH_NAMES_HI = {
    "जनवरी": "january", "फरवरी": "february", "मार्च": "march",
    "अप्रैल": "april", "मई": "may", "जून": "june",
    "जुलाई": "july", "अगस्त": "august", "सितंबर": "september",
    "अक्टूबर": "october", "नवंबर": "november", "दिसंबर": "december",
}

TABLE_STYLE = (
    'border-collapse:collapse;width:100%;margin:16px 0;'
    'box-shadow:0 2px 8px rgba(0,61,130,0.12);border-radius:8px;overflow:hidden;'
    "font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;"
)
THEAD_STYLE = 'background:linear-gradient(135deg,#003d82 0%,#0056b3 100%);color:white;'
TH_STYLE = 'padding:14px 12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;'

LEADERSHIP_CANONICAL = {
    "director": {"name": "Prof. Dinesh Prasad Saklani", "title": "Director, NCERT"},
    "joint_director": {"name": "Prof. Amarendra Behera", "title": "Joint Director, CIET-NCERT"},
    "head_dict": {"name": "Prof. Indu Kumar", "title": "Head, DICT & TD, CIET-NCERT"},
    "national_coordinator": {"name": "Dr. Rajesh D.", "title": "Associate Professor, CIET-NCERT, National Coordinator VSK"},
}

BILINGUAL_LABELS = {
    "en": {
        "education_report": "Education Intelligence Report",
        "key_statistics": "Key Statistics",
        "key_highlights": "Key Highlights",
        "major_activities": "Major Activities & Initiatives",
        "notable_events": "Notable Events",
        "state_performance": "State-wise Performance",
        "metric": "Metric",
        "value": "Value",
        "event": "Event",
        "date": "Date",
        "description": "Description",
        "participants": "Participants",
        "state_ut": "State / UT",
        "attendance": "Attendance",
        "apaar_coverage": "APAAR Coverage",
        "schools": "Schools",
        "teachers": "Teachers",
        "students": "Students",
        "apaar_ids": "APAAR IDs Generated",
        "attendance_rate": "Attendance Rate",
        "rvsk_title": "Rashtriya Vidya Samiksha Kendra (RVSK)",
        "current_progress": "Current Progress (As of January 31, 2026)",
        "six_a_framework": "6A Educational Data Framework",
        "pillar": "Pillar",
        "integration_status": "Integration Status",
        "coverage": "Coverage",
        "national_programs": "13 National Programs Supported",
        "leadership": "RVSK Leadership",
        "name": "Name",
        "designation": "Designation",
        "technical_title": "Technical Developments & Infrastructure",
        "dashboard_features": "Dashboard Features",
        "infrastructure_upgrades": "Infrastructure Upgrades",
        "apaar_milestones": "APAAR Registration Milestones",
        "month": "Month",
        "registrations": "Registrations",
        "states_active": "States Active",
        "growth": "Growth",
        "kpi_title": "Key Performance Indicators",
        "indicator": "Indicator",
        "parameter": "Parameter",
        "state_engagement_title": "State Engagement Overview",
        "top_performing": "Top Performing States",
        "consent_framework": "Consent Framework",
        "director_message": "Director's Message",
        "no_data_title": "No relevant information found in the official newsletter data.",
        "no_data_suggest": "Please try asking about:",
        "no_data_items": [
            "Monthly statistics and activities (April 2025 - January 2026)",
            "APAAR ID generation progress and milestones",
            "State performance and attendance rates",
            "Technical developments and infrastructure",
            "Learning outcomes and key performance indicators",
            "RVSK leadership and 6A Framework",
        ],
        "based_on": "Based on official newsletter data",
        "analysis_insights": "Analysis & Insights",
        "not_available": "This information is not available in the current RVSK newsletters.",
        "activity": "Activity / Initiative",
        "rank": "#",
    },
    "hi": {
        "education_report": "शिक्षा गुप्तचर रिपोर्ट",
        "key_statistics": "मुख्य सांख्यिकी",
        "key_highlights": "मुख्य विशेषताएं",
        "major_activities": "प्रमुख गतिविधियां एवं पहल",
        "notable_events": "उल्लेखनीय कार्यक्रम",
        "state_performance": "राज्य-वार प्रदर्शन",
        "metric": "मापदंड",
        "value": "मान",
        "event": "कार्यक्रम",
        "date": "तिथि",
        "description": "विवरण",
        "participants": "प्रतिभागी",
        "state_ut": "राज्य / केंद्र शासित प्रदेश",
        "attendance": "उपस्थिति",
        "apaar_coverage": "APAAR कवरेज",
        "schools": "स्कूल",
        "teachers": "शिक्षक",
        "students": "छात्र",
        "apaar_ids": "APAAR IDs जनित",
        "attendance_rate": "उपस्थिति दर",
        "rvsk_title": "राष्ट्रीय विद्या समीक्षा केंद्र (RVSK)",
        "current_progress": "वर्तमान प्रगति (31 जनवरी 2026 तक)",
        "six_a_framework": "6A शैक्षिक डेटा फ्रेमवर्क",
        "pillar": "स्तंभ",
        "integration_status": "एकीकरण स्थिति",
        "coverage": "कवरेज",
        "national_programs": "13 राष्ट्रीय कार्यक्रम समर्थित",
        "leadership": "RVSK नेतृत्व",
        "name": "नाम",
        "designation": "पदनाम",
        "technical_title": "तकनीकी विकास एवं अवसंरचना",
        "dashboard_features": "डैशबोर्ड सुविधाएं",
        "infrastructure_upgrades": "अवसंरचना उन्नयन",
        "apaar_milestones": "APAAR पंजीकरण मील के पत्थर",
        "month": "माह",
        "registrations": "पंजीकरण",
        "states_active": "सक्रिय राज्य",
        "growth": "वृद्धि",
        "kpi_title": "मुख्य प्रदर्शन संकेतक",
        "indicator": "संकेतक",
        "parameter": "पैरामीटर",
        "state_engagement_title": "राज्य जुड़ाव अवलोकन",
        "top_performing": "शीर्ष प्रदर्शन करने वाले राज्य",
        "consent_framework": "सहमति ढांचा",
        "director_message": "निदेशक का संदेश",
        "no_data_title": "आधिकारिक न्यूज़लेटर डेटा में कोई प्रासंगिक जानकारी नहीं मिली।",
        "no_data_suggest": "कृपया इनके बारे में पूछने का प्रयास करें:",
        "no_data_items": [
            "मासिक सांख्यिकी और गतिविधियां (अप्रैल 2025 - जनवरी 2026)",
            "APAAR ID निर्माण प्रगति और मील के पत्थर",
            "राज्य प्रदर्शन और उपस्थिति दर",
            "तकनीकी विकास और अवसंरचना",
            "सीखने के परिणाम और प्रमुख प्रदर्शन संकेतक",
            "RVSK नेतृत्व और 6A Framework",
        ],
        "based_on": "आधिकारिक न्यूज़लेटर डेटा पर आधारित",
        "analysis_insights": "विश्लेषण एवं अंतर्दृष्टि",
        "not_available": "यह जानकारी वर्तमान RVSK न्यूज़लेटर में उपलब्ध नहीं है।",
        "activity": "गतिविधि / पहल",
        "rank": "क्र.",
    },
}


def _row_bg(i: int) -> str:
    return "#ffffff" if i % 2 == 0 else "#f8f9fa"


def _td(value: str, bold: bool = False, color: str = "#333") -> str:
    fw = "font-weight:600;" if bold else ""
    return f'<td style="padding:12px;border-bottom:1px solid #e0e0e0;{fw}color:{color};">{value}</td>'


def _html_table(headers: list[str], rows: list[list[str]], *,
                col_styles: list[dict] | None = None) -> str:
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


HINGLISH_KEYWORDS = [
    "kya", "hai", "hain", "mein", "ka", "ki", "ke", "ko", "se", "par",
    "kitne", "kitni", "kaun", "kaise", "kahan", "kab", "kyun", "kyon",
    "batao", "bataiye", "bataen", "dijiye", "karein", "karo",
    "aur", "ya", "lekin", "agar", "toh", "nahi", "nahin",
    "shiksha", "vidyalaya", "school", "adhyapak", "chhatra",
    "upasthiti", "pradesh", "rajya", "sarkar", "mantralaya",
    "vikas", "yojana", "karyakram",
    "kitna", "kaisa", "sabhi", "sab", "kuch", "bahut",
    "samiksha", "vidya", "kendra",
]


def _detect_language(query: str) -> str:
    devanagari_count = sum(1 for ch in query if '\u0900' <= ch <= '\u097F')
    latin_count = sum(1 for ch in query if 'a' <= ch.lower() <= 'z')
    if devanagari_count > 0 and devanagari_count >= latin_count * 0.3:
        return "hi"
    words = query.lower().split()
    hinglish_hits = sum(1 for w in words if w in HINGLISH_KEYWORDS)
    if len(words) > 0 and hinglish_hits / len(words) >= 0.25:
        return "hi"
    return "en"


def _wants_brief(query: str) -> bool:
    brief_en = ["briefly", "brief", "short", "summary", "summarize", "in short", "one line"]
    brief_hi = ["संक्षेप", "संक्षिप्त", "छोटा", "सारांश"]
    q = query.lower()
    return any(kw in q for kw in brief_en + brief_hi)


class ChatRequest(BaseModel):
    query: str
    language: str = "en"


class ChatHandler:
    def __init__(self, rag_system, llm_handler):
        self.rag = rag_system
        self.llm = llm_handler
        self.router = APIRouter(prefix="/api", tags=["chat"])
        self.router.add_api_route("/chat", self.chat, methods=["POST"])

    def _L(self, key: str, lang: str) -> str:
        return BILINGUAL_LABELS.get(lang, BILINGUAL_LABELS["en"]).get(key, key)

    @staticmethod
    def _detect_month_in_query(query: str) -> str | None:
        q = query.lower()
        for m in MONTH_NAMES:
            if m in q:
                year_match = re.search(r'(202[4-9]|2030)', q)
                year = year_match.group(1) if year_match else "2025"
                if m == "january" and "2026" not in q:
                    year = "2026"
                return f"{m.capitalize()} {year}"
        for hi_month, en_month in MONTH_NAMES_HI.items():
            if hi_month in query:
                year_match = re.search(r'(202[4-9]|2030)', query)
                year = year_match.group(1) if year_match else "2025"
                if en_month == "january" and "2026" not in query:
                    year = "2026"
                return f"{en_month.capitalize()} {year}"
        return None

    def _find_month_data(self, month_name: str) -> dict[str, Any] | None:
        return self.rag.get_month(month_name)

    def _format_monthly_data(self, md: dict[str, Any], lang: str = "en") -> str:
        month = md.get("month", "Unknown")
        parts: list[str] = []

        parts.append(f'<h3 style="color:#003d82;margin:0 0 16px 0;">{month} — {self._L("education_report", lang)}</h3>')

        stats = [
            (self._L("schools", lang), f"{md.get('schools', 0):,}"),
            (self._L("teachers", lang), f"{md.get('teachers', 0):,}"),
            (self._L("students", lang), f"{md.get('students', 0):,}"),
            (self._L("apaar_ids", lang), f"{md.get('apaar_ids', 0):,}"),
            (self._L("attendance_rate", lang), f"{md.get('attendance_rate', 0)}%"),
        ]
        parts.append(f'<p style="margin:8px 0;"><strong>{self._L("key_statistics", lang)}:</strong></p>')
        parts.append(_html_table(
            [self._L("metric", lang), self._L("value", lang)],
            [[s[0], s[1]] for s in stats],
            col_styles=[{"bold": True, "color": "#003d82"}, {"bold": True}],
        ))

        highlights = md.get("highlights", [])
        if highlights:
            parts.append(f'<p style="margin:20px 0 8px;"><strong>{self._L("key_highlights", lang)}:</strong></p><ul style="margin:0;padding-left:24px;">')
            for h in highlights:
                parts.append(f'<li style="margin:6px 0;line-height:1.7;">{h}</li>')
            parts.append("</ul>")

        activities = md.get("activities", [])
        if activities:
            parts.append(f'<p style="margin:20px 0 8px;"><strong>{self._L("major_activities", lang)}:</strong></p>')
            parts.append(_html_table(
                [self._L("rank", lang), self._L("activity", lang)],
                [[str(i + 1), a] for i, a in enumerate(activities)],
                col_styles=[{"bold": True, "color": "#003d82"}, {}],
            ))

        events = md.get("events", [])
        if events:
            parts.append(f'<p style="margin:20px 0 8px;"><strong>{self._L("notable_events", lang)}:</strong></p>')
            rows = []
            for e in events:
                rows.append([
                    e.get("name", ""),
                    e.get("date", ""),
                    e.get("description", ""),
                    f'{e.get("participants", 0):,}',
                ])
            parts.append(_html_table(
                [self._L("event", lang), self._L("date", lang), self._L("description", lang), self._L("participants", lang)],
                rows,
                col_styles=[
                    {"bold": True, "color": "#003d82"},
                    {"color": "#FF6600"},
                    {},
                    {"bold": True, "color": "#28a745"},
                ],
            ))

        states = md.get("states", {})
        if states:
            parts.append(f'<p style="margin:20px 0 8px;"><strong>{self._L("state_performance", lang)}:</strong></p>')
            state_rows = []
            for state, data in states.items():
                att = data.get("attendance", "N/A")
                state_rows.append([
                    state,
                    f'{att}%',
                    f'{data.get("apaar_coverage", "N/A")}%',
                    f'{data.get("schools", 0):,}',
                ])
            parts.append(_html_table(
                [self._L("state_ut", lang), self._L("attendance", lang), self._L("apaar_coverage", lang), self._L("schools", lang)],
                state_rows,
                col_styles=[
                    {"bold": True, "color": "#003d82"},
                    {"bold": True, "color": "#28a745"},
                    {"bold": True},
                    {},
                ],
            ))

        return "\n".join(parts)

    def _format_technical_data(self, tech_data: dict[str, Any], lang: str = "en") -> str:
        if not isinstance(tech_data, dict):
            return f"<p>{self._L('not_available', lang)}</p>"

        parts = [f'<h3 style="color:#003d82;margin:0 0 16px 0;">{self._L("technical_title", lang)}</h3>']

        features = tech_data.get("dashboard_features", [])
        if features:
            parts.append(f'<p style="margin:12px 0 8px;"><strong>{self._L("dashboard_features", lang)}:</strong></p>')
            parts.append(_html_table(
                [self._L("rank", lang), "Feature"],
                [[str(i + 1), f] for i, f in enumerate(features)],
                col_styles=[{"bold": True, "color": "#003d82"}, {}],
            ))

        upgrades = tech_data.get("infrastructure_upgrades", [])
        if upgrades:
            parts.append(f'<p style="margin:20px 0 8px;"><strong>{self._L("infrastructure_upgrades", lang)}:</strong></p>')
            parts.append(_html_table(
                [self._L("rank", lang), "Upgrade"],
                [[str(i + 1), u] for i, u in enumerate(upgrades)],
                col_styles=[{"bold": True, "color": "#003d82"}, {}],
            ))

        milestones = tech_data.get("apaar_milestones", [])
        if milestones:
            parts.append(f'<p style="margin:20px 0 8px;"><strong>{self._L("apaar_milestones", lang)}:</strong></p>')
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
                [self._L("month", lang), self._L("registrations", lang), self._L("states_active", lang), self._L("growth", lang)],
                rows,
                col_styles=[
                    {"bold": True, "color": "#003d82"},
                    {"bold": True},
                    {},
                    {"bold": True, "color": "#28a745"},
                ],
            ))

        return "\n".join(parts)

    def _format_kpi_data(self, kpi_data: dict[str, Any], category: str, lang: str = "en") -> str:
        category_name = category.replace("_", " ").title()
        if not isinstance(kpi_data, dict) or not kpi_data:
            return f"<p>{self._L('not_available', lang)}</p>"

        rows = [[key.replace("_", " ").title(), str(value)] for key, value in kpi_data.items()]
        return (
            f'<h3 style="color:#003d82;margin:0 0 16px 0;">{self._L("kpi_title", lang)}: {category_name}</h3>'
            + _html_table([self._L("indicator", lang), self._L("value", lang)], rows,
                          col_styles=[{"bold": True, "color": "#003d82"}, {"bold": True}])
        )

    def _format_director_message(self, msg: dict[str, Any], lang: str = "en") -> str:
        name = msg.get("name", "Director")
        position = msg.get("position", "Director, Dept. of School Education & Literacy")
        message = msg.get("message", "")
        paragraphs = "".join(
            f'<p style="margin-bottom:12px;line-height:1.8;">{p.strip()}</p>'
            for p in message.split("\n\n") if p.strip()
        )
        return (
            f'<h3 style="color:#003d82;margin:0 0 16px 0;">{self._L("director_message", lang)}</h3>'
            f'<p><strong>{name}</strong><br><em>{position}</em></p>{paragraphs}'
        )

    def _format_state_engagement(self, eng: dict[str, Any], lang: str = "en") -> str:
        if not isinstance(eng, dict):
            return f"<p>{self._L('not_available', lang)}</p>"

        parts = [f'<h3 style="color:#003d82;margin:0 0 16px 0;">{self._L("state_engagement_title", lang)}</h3>']

        summary = eng.get("correspondence_summary", {})
        if summary:
            rows = [
                ["Total States / UTs", str(summary.get("total_states_uts", 0))],
                ["Active Participants", str(summary.get("active_participants", 0))],
                ["MOUs Signed", str(summary.get("mou_signed", 0))],
                ["Advanced Implementation", str(summary.get("implementation_advanced", 0))],
                ["Pilot Phase", str(summary.get("pilot_phase", 0))],
            ]
            parts.append(_html_table([self._L("parameter", lang), self._L("value", lang)], rows,
                                     col_styles=[{"bold": True, "color": "#003d82"}, {"bold": True}]))

        top = eng.get("top_performing_states", [])
        if top:
            parts.append(f'<p style="margin:20px 0 8px;"><strong>{self._L("top_performing", lang)}:</strong></p>')
            rows = [
                [s["name"], f'{s["apaar_coverage"]}%', f'{s["attendance"]}%', f'{s["digital_readiness"]}%']
                for s in top[:5]
            ]
            parts.append(_html_table(
                [self._L("state_ut", lang), self._L("apaar_coverage", lang), self._L("attendance", lang), "Digital Readiness"], rows,
                col_styles=[{"bold": True, "color": "#003d82"}, {"bold": True}, {"bold": True}, {}],
            ))

        consent = eng.get("consent_framework", {})
        if consent:
            parts.append(f'<p style="margin:20px 0 8px;"><strong>{self._L("consent_framework", lang)}:</strong></p>')
            rows = [
                ["Total Consents Collected", f'{consent.get("total_consents_collected", 0):,}'],
                ["Digital Consent Rate", f'{consent.get("digital_consent_rate", 0)}%'],
                ["Parent Awareness Programs", f'{consent.get("parent_awareness_programs", 0):,}'],
                ["Data Privacy Compliance", str(consent.get("data_privacy_compliance", "N/A"))],
            ]
            parts.append(_html_table([self._L("parameter", lang), self._L("value", lang)], rows,
                                     col_styles=[{"bold": True, "color": "#003d82"}, {"bold": True}]))

        return "\n".join(parts)

    def _format_rvsk_data(self, rvsk: dict[str, Any], lang: str = "en") -> str:
        parts = [f'<h3 style="color:#003d82;margin:0 0 16px 0;">{self._L("rvsk_title", lang)}</h3>']

        progress = rvsk.get("current_progress", {})
        if progress:
            rows = [
                ["States/UTs Operationalized", str(progress.get("states_uts_operationalized", ""))],
                ["CABs Operational", str(progress.get("cabs_operational", ""))],
                ["Total Operational VSKs", str(progress.get("total_operational_vsks", ""))],
                ["Schools Connected", str(progress.get("schools_connected", ""))],
                ["Teachers Linked", str(progress.get("teachers_linked", ""))],
                ["Students Tracked", str(progress.get("students_tracked", ""))],
                ["Schools Integrated (RVSK)", str(progress.get("schools_integrated_rvsk", ""))],
                ["Total APAAR IDs Generated", str(progress.get("total_apaar_ids", ""))],
                ["Attendance Integration", f'{progress.get("states_attendance_integrated", "")} States/UTs'],
                ["Assessment Integration", f'{progress.get("states_assessment_integrated", "")} States/UTs'],
            ]
            parts.append(f'<p style="margin:8px 0;"><strong>{self._L("current_progress", lang)}:</strong></p>')
            parts.append(_html_table([self._L("parameter", lang), self._L("value", lang)], rows,
                                     col_styles=[{"bold": True, "color": "#003d82"}, {"bold": True}]))

        six_a = rvsk.get("six_a_framework", {})
        if six_a:
            rows = [[k.replace("_", " ").title(), v.get("status", ""), v.get("coverage", "—")]
                    for k, v in six_a.items()]
            parts.append(f'<p style="margin:20px 0 8px;"><strong>{self._L("six_a_framework", lang)}:</strong></p>')
            parts.append(_html_table(
                [self._L("pillar", lang), self._L("integration_status", lang), self._L("coverage", lang)], rows,
                col_styles=[{"bold": True, "color": "#003d82"}, {}, {"bold": True}]))

        highlights = rvsk.get("key_highlights", [])
        if highlights:
            parts.append(f'<p style="margin:20px 0 8px;"><strong>{self._L("key_highlights", lang)}:</strong></p><ul style="margin:0;padding-left:24px;">')
            for h in highlights:
                parts.append(f'<li style="margin:6px 0;line-height:1.7;">{h}</li>')
            parts.append("</ul>")

        programs = rvsk.get("national_programs", [])
        if programs:
            parts.append(f'<p style="margin:20px 0 8px;"><strong>{self._L("national_programs", lang)}:</strong></p>')
            parts.append(f'<p style="line-height:1.8;">{", ".join(programs)}</p>')

        leaders = rvsk.get("leadership", {})
        if leaders:
            rows = [[LEADERSHIP_CANONICAL.get(k, {}).get("name", v.get("name", "")),
                     LEADERSHIP_CANONICAL.get(k, {}).get("title", v.get("title", ""))]
                    for k, v in leaders.items()]
            parts.append(f'<p style="margin:20px 0 8px;"><strong>{self._L("leadership", lang)}:</strong></p>')
            parts.append(_html_table([self._L("name", lang), self._L("designation", lang)], rows,
                                     col_styles=[{"bold": True, "color": "#003d82"}, {}]))

        return "\n".join(parts)

    def _format_leadership_answer(self, lang: str = "en") -> str:
        rvsk = self.rag.data.get("rvsk_data", {})
        leaders = rvsk.get("leadership", {})
        if not leaders:
            return f"<p>{self._L('not_available', lang)}</p>"

        rows = [[LEADERSHIP_CANONICAL.get(k, {}).get("name", v.get("name", "")),
                 LEADERSHIP_CANONICAL.get(k, {}).get("title", v.get("title", ""))]
                for k, v in leaders.items()]

        title = self._L("leadership", lang)
        return (
            f'<h3 style="color:#003d82;margin:0 0 16px 0;">{title}</h3>'
            + _html_table([self._L("name", lang), self._L("designation", lang)], rows,
                          col_styles=[{"bold": True, "color": "#003d82"}, {}])
        )

    def _format_dpdp_answer(self, lang: str = "en") -> str:
        if lang == "hi":
            return (
                '<h3 style="color:#003d82;margin:0 0 16px 0;">DPDP अधिनियम 2023 — RVSK/VSK में अनुपालन</h3>'
                '<p style="margin:8px 0 12px;line-height:1.7;">डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम, 2023 भारत का व्यापक डेटा गोपनीयता कानून है। '
                'RVSK/VSK प्लेटफ़ॉर्म इस अधिनियम के सिद्धांतों का पालन करते हुए शैक्षिक डेटा का प्रबंधन करता है:</p>'
                + _html_table(
                    ["DPDP सिद्धांत", "RVSK/VSK में कार्यान्वयन"],
                    [
                        ["डेटा न्यूनीकरण", "केवल आवश्यक शैक्षिक डेटा (उपस्थिति, मूल्यांकन, APAAR ID) एकत्र किया जाता है। 6A Framework के अंतर्गत विशिष्ट डेटा क्षेत्र परिभाषित हैं।"],
                        ["उद्देश्य सीमा", "डेटा केवल शैक्षिक निगरानी, नीति निर्माण और सीखने के परिणामों में सुधार के लिए उपयोग किया जाता है।"],
                        ["पहुँच नियंत्रण", "भूमिका-आधारित डैशबोर्ड: राज्य, जिला और ब्लॉक स्तर पर विभिन्न पहुँच स्तर। अधिकारी केवल अपने क्षेत्र का डेटा देख सकते हैं।"],
                        ["सहमति ढांचा", "APAAR ID निर्माण के लिए अभिभावक/अभिभावक की सहमति आवश्यक। डिजिटल सहमति दर ट्रैक की जाती है।"],
                        ["डेटा सुरक्षा", "UDISE+ और LGD नामावली का 28 राज्यों/केंद्र शासित प्रदेशों में संरेखण। Privacy-by-design सिद्धांत लागू।"],
                        ["ऑडिट ट्रेल", "डेटा पहुँच और संशोधनों की लॉगिंग। बहु-स्तरीय एस्केलेशन प्रणाली (जैसे ओडिशा मॉडल) पारदर्शिता सुनिश्चित करती है।"],
                        ["डेटा गुणवत्ता", "मूल्यांकन मॉड्यूल में 91.7% डेटा गुणवत्ता। RVSK आंतरिक पोर्टल सभी राज्यों/केंद्र शासित प्रदेशों के साथ UAT पूर्ण।"],
                    ],
                    col_styles=[{"bold": True, "color": "#003d82"}, {}],
                )
                + '<p style="margin:16px 0 4px;line-height:1.7;"><strong>कार्यक्षेत्र सीमाएं:</strong> '
                'DPDP अधिनियम 2023 के विशिष्ट अनुपालन प्रमाणन की जानकारी वर्तमान न्यूज़लेटर डेटा में स्पष्ट रूप से प्रलेखित नहीं है। '
                'उपरोक्त मैपिंग प्लेटफ़ॉर्म की मौजूदा प्रथाओं पर आधारित है जो DPDP सिद्धांतों के अनुरूप हैं।</p>'
            )

        return (
            '<h3 style="color:#003d82;margin:0 0 16px 0;">DPDP Act 2023 — Compliance in RVSK/VSK</h3>'
            '<p style="margin:8px 0 12px;line-height:1.7;">The Digital Personal Data Protection (DPDP) Act, 2023 is India\'s comprehensive data privacy legislation. '
            'The RVSK/VSK platform manages educational data in alignment with the Act\'s principles:</p>'
            + _html_table(
                ["DPDP Principle", "Implementation in RVSK/VSK"],
                [
                    ["Data Minimization", "Only essential educational data (attendance, assessment, APAAR ID) is collected. The 6A Framework defines specific data domains to prevent excessive data collection."],
                    ["Purpose Limitation", "Data is used exclusively for educational monitoring, policy formulation, and improving learning outcomes — not for unrelated purposes."],
                    ["Access Control", "Role-based dashboards at State, District, and Block levels. Officials can only view data within their jurisdictional scope."],
                    ["Consent Framework", "Parental/guardian consent is required for APAAR ID generation. Digital consent rates are tracked across States/UTs."],
                    ["Data Security", "UDISE+ and LGD nomenclature alignment across 28 States/UTs. Privacy-by-design principles applied to all 6A Framework data handling."],
                    ["Audit Trails", "Data access and modifications are logged. Multi-level escalation systems (e.g., Odisha model: 7 days → Headmaster, 15 → BEO, 30 → DEO) ensure transparency."],
                    ["Data Quality", "91.7% data quality achieved in the Assessment module. Internal RVSK portal completed UAT with all States/UTs for data validation."],
                ],
                col_styles=[{"bold": True, "color": "#003d82"}, {}],
            )
            + '<p style="margin:16px 0 4px;line-height:1.7;"><strong>Scope Limitations:</strong> '
            'Specific DPDP Act 2023 compliance certifications are not explicitly documented in the current newsletter data. '
            'The above mapping is based on the platform\'s existing practices that align with DPDP principles.</p>'
        )

    def _format_six_a_answer(self, lang: str = "en") -> str:
        rvsk = self.rag.data.get("rvsk_data", {})
        six_a = rvsk.get("six_a_framework", {})
        if not six_a:
            return f"<p>{self._L('not_available', lang)}</p>"

        title = self._L("six_a_framework", lang)
        intro = {
            "en": "The 6A Framework is the core educational data architecture of RVSK, covering six pillars of school education monitoring:",
            "hi": "6A Framework, RVSK का मूल शैक्षिक डेटा ढांचा है, जो स्कूली शिक्षा निगरानी के छह स्तंभों को कवर करता है:",
        }

        rows = [[k.replace("_", " ").title(), v.get("status", ""), v.get("coverage", "—")]
                for k, v in six_a.items()]

        return (
            f'<h3 style="color:#003d82;margin:0 0 16px 0;">{title}</h3>'
            f'<p style="margin:8px 0 12px;line-height:1.7;">{intro.get(lang, intro["en"])}</p>'
            + _html_table(
                [self._L("pillar", lang), self._L("integration_status", lang), self._L("coverage", lang)], rows,
                col_styles=[{"bold": True, "color": "#003d82"}, {}, {"bold": True}])
        )

    def _render_no_data(self, lang: str = "en") -> str:
        labels = BILINGUAL_LABELS.get(lang, BILINGUAL_LABELS["en"])
        items = "".join(f'<li>{item}</li>' for item in labels["no_data_items"])
        return (
            f'<p><strong>{labels["no_data_title"]}</strong></p>'
            f'<p>{labels["no_data_suggest"]}</p>'
            f'<ul>{items}</ul>'
        )

    def _try_structured_format(self, results: list[dict], query: str, lang: str = "en") -> str | None:
        target_month = self._detect_month_in_query(query)
        if target_month:
            month_data = self._find_month_data(target_month)
            if month_data:
                return self._format_monthly_data(month_data, lang)

        q_lower = query.lower()

        leadership_keywords_en = ["leadership", "leader", "director", "joint director", "head dict",
                                  "who leads", "who is the director", "who runs", "saklani", "behera", "indu kumar"]
        leadership_keywords_hi = ["नेतृत्व", "निदेशक", "संयुक्त निदेशक", "कौन है", "प्रमुख"]
        if any(kw in q_lower for kw in leadership_keywords_en) or any(kw in query for kw in leadership_keywords_hi):
            if not any(kw in q_lower for kw in ["message", "vision", "संदेश"]):
                return self._format_leadership_answer(lang)

        dpdp_keywords = ["dpdp", "data protection", "digital personal data", "dpdp act", "dpdp 2023",
                         "privacy", "data privacy", "डेटा संरक्षण", "गोपनीयता", "डीपीडीपी"]
        if any(kw in q_lower for kw in dpdp_keywords) or any(kw in query for kw in dpdp_keywords):
            return self._format_dpdp_answer(lang)

        six_a_keywords_en = ["6a framework", "6a", "six a", "attendance assessment administration",
                             "accreditation adaptive artificial"]
        six_a_keywords_hi = ["6a फ्रेमवर्क", "6a", "छह स्तंभ"]
        if any(kw in q_lower for kw in six_a_keywords_en) or any(kw in query for kw in six_a_keywords_hi):
            return self._format_six_a_answer(lang)

        priority = {
            "month": 1, "rvsk": 2, "kpi": 3, "state_engagement": 4,
            "technical": 5, "director_message": 6, "detailed_context": 99,
        }

        best = None
        best_pri = 999
        for r in results:
            t = r["metadata"].get("type", "")
            pri = priority.get(t, 100)
            if pri < best_pri:
                best = r
                best_pri = pri

        if best and best_pri < 99:
            chunk_type = best["metadata"].get("type", "")
            data = best["metadata"].get("data", {})

            if chunk_type == "month":
                return self._format_monthly_data(data, lang)
            elif chunk_type == "rvsk":
                return self._format_rvsk_data(data, lang)
            elif chunk_type == "technical":
                return self._format_technical_data(data, lang)
            elif chunk_type == "kpi":
                return self._format_kpi_data(data, best["metadata"].get("category", "general"), lang)
            elif chunk_type == "director_message":
                return self._format_director_message(data, lang)
            elif chunk_type == "state_engagement":
                return self._format_state_engagement(data, lang)

        rvsk_keywords = ["rvsk", "rashtriya vidya samiksha", "capacity building workshop",
                         "dpdp", "data protection", "best practice", "early warning system",
                         "facial recognition", "apaar for teacher", "institutionaliz",
                         "राष्ट्रीय विद्या समीक्षा", "विद्या समीक्षा केंद्र"]
        if any(kw in q_lower for kw in rvsk_keywords) or any(kw in query for kw in rvsk_keywords):
            rvsk_data = self.rag.data.get("rvsk_data")
            if rvsk_data:
                return self._format_rvsk_data(rvsk_data, lang)

        tech_keywords = ["technical", "dashboard", "infrastructure", "upgrade", "feature", "system", "platform",
                         "तकनीकी", "डैशबोर्ड", "अवसंरचना"]
        if any(kw in q_lower for kw in tech_keywords):
            tech_data = self.rag.data.get("technical_developments")
            if tech_data:
                return self._format_technical_data(tech_data, lang)

        kpi_keywords = ["kpi", "performance indicator", "learning outcome", "equity", "growth metric",
                        "प्रदर्शन संकेतक", "सीखने के परिणाम"]
        if any(kw in q_lower for kw in kpi_keywords):
            kpis = self.rag.data.get("key_performance_indicators", {})
            if kpis:
                parts = []
                for cat, data in kpis.items():
                    parts.append(self._format_kpi_data(data, cat, lang))
                return "\n".join(parts)

        state_keywords = ["state engagement", "state performance", "top state", "top performing",
                          "राज्य प्रदर्शन", "शीर्ष राज्य"]
        if any(kw in q_lower for kw in state_keywords) or any(kw in query for kw in state_keywords):
            eng_data = self.rag.data.get("state_engagement")
            if eng_data:
                return self._format_state_engagement(eng_data, lang)

        director_keywords_en = ["director's message", "director message", "vision"]
        director_keywords_hi = ["निदेशक का संदेश", "संदेश"]
        if any(kw in q_lower for kw in director_keywords_en) or any(kw in query for kw in director_keywords_hi):
            msg_data = self.rag.data.get("director_message")
            if msg_data:
                return self._format_director_message(msg_data, lang)

        return None

    async def chat(self, payload: ChatRequest) -> dict[str, Any]:
        query = payload.query.strip()
        if not query:
            return {"answer": self._render_no_data("en"), "mode": "rag_only", "sources": []}

        detected_lang = _detect_language(query)
        language = detected_lang if detected_lang == "hi" else payload.language

        results = self.rag.search(query, top_k=5)
        if not results or results[0]["score"] <= 0:
            return {"answer": self._render_no_data(language), "mode": "rag_only", "sources": []}

        answer = self._try_structured_format(results, query, language)

        if not answer:
            label = self._L("based_on", language)
            answer = f'<p><strong>{label}:</strong></p><ul>'
            seen_texts = set()
            for r in results[:3]:
                txt = r.get("text", "").replace("\n", " ").strip()
                if txt and txt not in seen_texts:
                    seen_texts.add(txt)
                    if len(txt) > 350:
                        txt = txt[:347] + "..."
                    answer += f'<li style="margin:8px 0;line-height:1.7;">{txt}</li>'
            answer += "</ul>"

        context = "\n\n".join(item["text"] for item in results[:3])
        llm_text = self.llm.summarize(query, context, language=language)
        mode = "rag_only"

        if llm_text and llm_text.strip():
            llm_cleaned = production_grade_cleanup(llm_text)
            if len(llm_cleaned) > 150:
                if "<table" in llm_cleaned.lower():
                    answer = llm_cleaned
                else:
                    insight_label = self._L("analysis_insights", language)
                    answer += (
                        '\n<hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;">'
                        f'\n<p style="margin:12px 0 8px;"><strong>{insight_label}:</strong></p>'
                        f'\n<div style="padding:12px 16px;background:#f8f9fa;border-left:4px solid #003d82;'
                        f'border-radius:4px;line-height:1.7;">{llm_cleaned}</div>'
                    )
            mode = "hybrid"

        answer += '\n\n' + get_footer_attribution()

        return {
            "answer": answer,
            "mode": mode,
            "sources": [r["source"] for r in results[:3]],
        }
