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
        self.newsletters: list[dict[str, Any]] = []
        self.chunks: list[dict[str, Any]] = []
        self.index = None
        self.chunk_matrix: np.ndarray | None = None
        self.using_faiss = False

    def initialize(self) -> None:
        with self.data_path.open("r", encoding="utf-8") as f:
            payload = json.load(f)
        self.newsletters = payload.get("months", [])
        self.chunks = self._build_chunks(self.newsletters)

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

    def _build_chunks(self, months: list[dict[str, Any]]) -> list[dict[str, Any]]:
        chunks: list[dict[str, Any]] = []
        for month in months:
            states_line = ", ".join(
                f"{state} attendance {vals['attendance']}%, APAAR coverage {vals['apaar_coverage']}%"
                for state, vals in month.get("states", {}).items()
            )
            text = (
                f"{month['month']} newsletter. Schools {month['schools']}, teachers {month['teachers']}, "
                f"students {month['students']}, APAAR IDs {month['apaar_ids']}, attendance {month['attendance_rate']}%. "
                f"Highlights: {'; '.join(month.get('highlights', []))}. "
                f"Events: {'; '.join(e['name'] + ' on ' + e['date'] for e in month.get('events', []))}. "
                f"State performance: {states_line}."
            )
            chunks.append({"text": text, "metadata": month})
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
