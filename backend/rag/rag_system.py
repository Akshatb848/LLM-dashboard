from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

try:
    import faiss  # type: ignore
except Exception:  # pragma: no cover
    faiss = None


class RagSystem:
    def __init__(self, data_path: str) -> None:
        self.data_path = Path(data_path)
        self.vectorizer = TfidfVectorizer(stop_words="english")
        self.data: dict[str, Any] = {}
        self.newsletters: list[dict[str, Any]] = []
        self.chunks: list[dict[str, Any]] = []
        self.index = None
        self.chunk_matrix: np.ndarray | None = None
        self.using_faiss = False

    def initialize(self) -> None:
        with self.data_path.open("r", encoding="utf-8") as f:
            self.data = json.load(f)
        self.newsletters = self.data.get("months", [])
        self.chunks = self._build_chunks(self.data)

        # Load detailed context file if available
        context_path = self.data_path.parent / "detailed_context.txt"
        if context_path.exists():
            with context_path.open("r", encoding="utf-8") as f:
                detailed_context = f.read()
                # Split into sections for better retrieval
                sections = detailed_context.split("=" * 78)
                for section in sections:
                    section = section.strip()
                    if section and len(section) > 100:
                        # Further split large sections into paragraphs
                        paragraphs = section.split("\n\n")
                        for para in paragraphs:
                            para = para.strip()
                            if para and len(para) > 50:
                                self.chunks.append({
                                    "text": para,
                                    "metadata": {"type": "detailed_context", "data": {}}
                                })

        corpus = [chunk["text"] for chunk in self.chunks]
        tfidf = self.vectorizer.fit_transform(corpus)
        dense = tfidf.astype(np.float32).toarray()
        self.chunk_matrix = dense

        if faiss is not None and dense.size > 0:
            self.index = faiss.IndexFlatIP(dense.shape[1])
            normalized = dense.copy()
            faiss.normalize_L2(normalized)
            self.index.add(normalized)
            self.using_faiss = True
        else:
            self.index = None
            self.using_faiss = False

    def _build_chunks(self, data: dict[str, Any]) -> list[dict[str, Any]]:
        chunks: list[dict[str, Any]] = []

        # Add director's message as a chunk
        if "director_message" in data:
            msg = data["director_message"]
            text = f"Director's Message from {msg['name']}, {msg['position']}: {msg['message']}"
            chunks.append({"text": text, "metadata": {"type": "director_message", "data": msg}})

        # Add monthly data chunks
        for month in data.get("months", []):
            states_line = ", ".join(
                f"{state} attendance {vals['attendance']}%, APAAR coverage {vals['apaar_coverage']}%, schools {vals.get('schools', 'N/A')}"
                for state, vals in month.get("states", {}).items()
            )
            activities_line = "; ".join(month.get("activities", []))
            text = (
                f"{month['month']} newsletter. Schools {month['schools']}, teachers {month['teachers']}, "
                f"students {month['students']}, APAAR IDs {month['apaar_ids']}, attendance {month['attendance_rate']}%. "
                f"Highlights: {'; '.join(month.get('highlights', []))}. "
                f"Activities: {activities_line}. "
                f"Events: {'; '.join(e['name'] + ' on ' + e['date'] + ': ' + e['description'] for e in month.get('events', []))}. "
                f"State performance: {states_line}."
            )
            chunks.append({"text": text, "metadata": {"type": "month", "data": month}})

        # Add technical developments
        if "technical_developments" in data:
            tech = data["technical_developments"]
            features_text = "Dashboard features: " + "; ".join(tech.get("dashboard_features", []))
            chunks.append({"text": features_text, "metadata": {"type": "technical", "data": tech}})

            upgrades_text = "Infrastructure upgrades: " + "; ".join(tech.get("infrastructure_upgrades", []))
            chunks.append({"text": upgrades_text, "metadata": {"type": "technical", "data": tech}})

            milestones_text = "APAAR milestones: " + "; ".join(
                f"{m['month']}: {m['registrations']} registrations across {m['states_active']} states"
                for m in tech.get("apaar_milestones", [])
            )
            chunks.append({"text": milestones_text, "metadata": {"type": "technical", "data": tech}})

        # Add KPIs
        if "key_performance_indicators" in data:
            kpis = data["key_performance_indicators"]
            for category, values in kpis.items():
                kpi_text = f"{category}: " + "; ".join(
                    f"{k}: {v}" for k, v in values.items()
                )
                chunks.append({"text": kpi_text, "metadata": {"type": "kpi", "category": category, "data": values}})

        # Add state engagement data
        if "state_engagement" in data:
            engagement = data["state_engagement"]
            summary = engagement.get("correspondence_summary", {})
            summary_text = f"State engagement: {summary.get('total_states_uts', 0)} states/UTs, {summary.get('active_participants', 0)} active, {summary.get('mou_signed', 0)} MOUs signed"
            chunks.append({"text": summary_text, "metadata": {"type": "state_engagement", "data": engagement}})

            top_states_text = "Top performing states: " + "; ".join(
                f"{s['name']}: APAAR {s['apaar_coverage']}%, attendance {s['attendance']}%, digital readiness {s['digital_readiness']}%"
                for s in engagement.get("top_performing_states", [])
            )
            chunks.append({"text": top_states_text, "metadata": {"type": "state_engagement", "data": engagement}})

        # Add RVSK data chunks
        if "rvsk_data" in data:
            rvsk = data["rvsk_data"]

            # RVSK overview
            progress = rvsk.get("current_progress", {})
            rvsk_overview = (
                f"Rashtriya Vidya Samiksha Kendra (RVSK) is the centralized national platform at CIET-NCERT, "
                f"launched on {rvsk.get('launch_date', 'March 9, 2023')}. "
                f"As of January 31, 2026: {progress.get('states_uts_operationalized', 35)} States/UTs operationalized, "
                f"{progress.get('total_operational_vsks', 38)} operational VSKs (35 States/UTs + 3 CABs), "
                f"{progress.get('schools_connected', '11.51 Lakh')} schools connected, "
                f"{progress.get('teachers_linked', '51.38 Lakh')} teachers linked, "
                f"{progress.get('students_tracked', '13.44 Crore')} students tracked, "
                f"{progress.get('total_apaar_ids', '15,67,37,923')} total APAAR IDs generated."
            )
            chunks.append({"text": rvsk_overview, "metadata": {"type": "rvsk", "data": rvsk}})

            # 6A Framework
            six_a = rvsk.get("six_a_framework", {})
            six_a_text = "RVSK 6A Educational Data Framework: " + "; ".join(
                f"{k.replace('_', ' ').title()}: {v.get('status', '')}" for k, v in six_a.items()
            )
            chunks.append({"text": six_a_text, "metadata": {"type": "rvsk", "data": rvsk}})

            # National programs
            programs = rvsk.get("national_programs", [])
            if programs:
                prog_text = f"RVSK supports 13 National Programs: {', '.join(programs)}"
                chunks.append({"text": prog_text, "metadata": {"type": "rvsk", "data": rvsk}})

            # Key highlights
            highlights = rvsk.get("key_highlights", [])
            if highlights:
                hl_text = "RVSK key highlights April 2025 to January 2026: " + "; ".join(highlights)
                chunks.append({"text": hl_text, "metadata": {"type": "rvsk", "data": rvsk}})

            # RVSK Capacity Building
            cb = rvsk.get("capacity_building_2025", {})
            if cb:
                cb_text = (
                    f"RVSK Capacity Building Workshop 2.0, {cb.get('date', 'August 2025')}: "
                    f"{cb.get('batches', 5)} batches, {cb.get('participants', 165)} participants from "
                    f"{cb.get('states_uts_covered', 36)} States/UTs. Curriculum: {', '.join(cb.get('curriculum', []))}"
                )
                chunks.append({"text": cb_text, "metadata": {"type": "rvsk", "data": rvsk}})

            # Best practices
            bp = rvsk.get("best_practices_by_region", {})
            for region, states in bp.items():
                if isinstance(states, dict):
                    bp_text = f"RVSK best practices in {region.replace('_', ' ').title()} region: " + "; ".join(
                        f"{s.replace('_', ' ')}: {practice}" for s, practice in states.items()
                    )
                    chunks.append({"text": bp_text, "metadata": {"type": "rvsk", "data": rvsk}})

            # DPDP compliance
            dpdp = rvsk.get("dpdp_compliance", {})
            if dpdp:
                dpdp_text = f"DPDP Act 2023 compliance for VSKs: " + "; ".join(dpdp.get("areas", []))
                chunks.append({"text": dpdp_text, "metadata": {"type": "rvsk", "data": rvsk}})

            # APAAR for teachers
            apt = rvsk.get("apaar_for_teachers", {})
            if apt:
                apt_text = f"APAAR for Teachers: {apt.get('description', '')}. Benefits: " + "; ".join(apt.get("benefits", []))
                chunks.append({"text": apt_text, "metadata": {"type": "rvsk", "data": rvsk}})

            # Leadership
            leaders = rvsk.get("leadership", {})
            if leaders:
                leader_text = (
                    "RVSK Leadership: "
                    "Prof. Dinesh Prasad Saklani (Director, NCERT); "
                    "Prof. Amarendra Behera (Joint Director, CIET-NCERT); "
                    "Prof. Indu Kumar (Head, DICT & TD, CIET-NCERT); "
                    "Dr. Rajesh D. (Associate Professor, CIET-NCERT, National Coordinator VSK)"
                )
                chunks.append({"text": leader_text, "metadata": {"type": "rvsk", "data": rvsk}})

                leader_text_hi = (
                    "RVSK नेतृत्व leadership निदेशक director संयुक्त निदेशक joint director: "
                    "Prof. Dinesh Prasad Saklani (निदेशक, NCERT); "
                    "Prof. Amarendra Behera (संयुक्त निदेशक, CIET-NCERT); "
                    "Prof. Indu Kumar (प्रमुख, DICT & TD, CIET-NCERT); "
                    "Dr. Rajesh D. (सहयोगी प्रोफेसर, CIET-NCERT, राष्ट्रीय समन्वयक VSK)"
                )
                chunks.append({"text": leader_text_hi, "metadata": {"type": "rvsk", "data": rvsk}})

            six_a_hi = (
                "6A Framework 6A फ्रेमवर्क छह स्तंभ: "
                "Attendance उपस्थिति, Assessment मूल्यांकन, Administration प्रशासन, "
                "Accreditation मान्यता, Adaptive Learning अनुकूली शिक्षा, "
                "Artificial Intelligence कृत्रिम बुद्धिमत्ता"
            )
            chunks.append({"text": six_a_hi, "metadata": {"type": "rvsk", "data": rvsk}})

            rvsk_hi = (
                "राष्ट्रीय विद्या समीक्षा केंद्र RVSK VSK विद्या समीक्षा: "
                f"{progress.get('states_uts_operationalized', 35)} राज्य/केंद्र शासित प्रदेश, "
                f"{progress.get('total_operational_vsks', 38)} VSK संचालित (35 राज्य/केंद्र शासित प्रदेश + 3 CABs), "
                f"APAAR IDs: {progress.get('total_apaar_ids', '')}. "
                "स्कूल शिक्षा school education शिक्षा मंत्रालय ministry of education"
            )
            chunks.append({"text": rvsk_hi, "metadata": {"type": "rvsk", "data": rvsk}})

        return chunks

    def search(self, query: str, top_k: int = 3) -> list[dict[str, Any]]:
        if not query.strip() or self.chunk_matrix is None or len(self.chunks) == 0:
            return []

        q = self.vectorizer.transform([query]).astype(np.float32).toarray()
        if self.using_faiss and self.index is not None:
            qn = q.copy()
            faiss.normalize_L2(qn)
            scores, indices = self.index.search(qn, min(top_k, len(self.chunks)))
            pairs = zip(indices[0], scores[0], strict=False)
        else:
            scores = (self.chunk_matrix @ q.T).flatten()
            top_indices = np.argsort(scores)[::-1][:top_k]
            pairs = [(i, float(scores[i])) for i in top_indices]

        results = []
        for i, score in pairs:
            if i < 0:
                continue

            # Generate appropriate source based on chunk type
            metadata = self.chunks[i]["metadata"]
            chunk_type = metadata.get("type", "month")

            if chunk_type == "month":
                source = f"official_newsletter::{metadata['data']['month']}"
            elif chunk_type == "director_message":
                source = "official_newsletter::director_message"
            elif chunk_type == "technical":
                source = "official_newsletter::technical_developments"
            elif chunk_type == "kpi":
                category = metadata.get("category", "general")
                source = f"official_newsletter::kpi_{category}"
            elif chunk_type == "state_engagement":
                source = "official_newsletter::state_engagement"
            else:
                source = "official_newsletter::general"

            results.append(
                {
                    "score": float(score),
                    "text": self.chunks[i]["text"],
                    "metadata": metadata,
                    "source": source,
                }
            )
        return results

    def list_months(self) -> list[str]:
        return [m["month"] for m in self.newsletters]

    def get_month(self, month_name: str) -> dict[str, Any] | None:
        target = month_name.strip().lower()
        for month in self.newsletters:
            if month["month"].lower() == target:
                return month
        return None
