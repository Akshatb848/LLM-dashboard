"""Smoke tests for the retrieval-only (no LLM) path and its no-hallucination guardrail."""
from pathlib import Path

from fastapi.testclient import TestClient

from backend.main import app
from backend.rag.rag_system import RagSystem

client = TestClient(app)
DATA_PATH = Path(__file__).resolve().parents[1] / "backend" / "data" / "newsletter_data.json"


def test_health_reports_rag_only_mode_without_llm(monkeypatch):
    monkeypatch.delenv("OLLAMA_URL", raising=False)
    data = client.get("/api/health").json()
    assert data["status"] == "ok"
    assert data["chunks_loaded"] > 0
    assert data["mode"] == "rag_only"


def test_retrieval_returns_ranked_chunks_from_bundled_data():
    rag = RagSystem(str(DATA_PATH))
    rag.initialize()
    results = rag.search("APAAR ID generation", top_k=3)
    assert 1 <= len(results) <= 3
    scores = [r["score"] for r in results]
    assert scores == sorted(scores, reverse=True)
    assert any("apaar" in r["text"].lower() for r in results)


def test_out_of_scope_question_is_refused_not_invented():
    res = client.post("/api/chat", json={"query": "What is the capital of France?"})
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] == "rag_only"
    assert "No relevant information" in data["answer"]
    assert "Paris" not in data["answer"]


def test_unknown_month_returns_404():
    res = client.get("/api/newsletter/March%201999")
    assert res.status_code == 404
