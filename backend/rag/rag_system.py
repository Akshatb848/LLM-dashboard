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
            results.append(
                {
                    "score": float(score),
                    "text": self.chunks[i]["text"],
                    "metadata": self.chunks[i]["metadata"],
                    "source": f"official_newsletter::{self.chunks[i]['metadata']['month']}",
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
