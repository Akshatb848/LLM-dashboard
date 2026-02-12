from __future__ import annotations

import os
from typing import Any

import requests


class LLMHandler:
    def __init__(self) -> None:
        self.ollama_url = os.getenv("OLLAMA_URL", "")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3.1")
        self.enabled = bool(self.ollama_url)

    def status(self) -> dict[str, Any]:
        return {
            "enabled": self.enabled,
            "provider": "ollama" if self.enabled else "disabled",
            "model": self.ollama_model if self.enabled else None,
        }

    def summarize(self, question: str, context: str) -> str | None:
        if not self.enabled:
            return None

        prompt = (
            "You are generating official Ministry of Education newsletter outputs. "
            "Use only provided context, never invent information, and keep a factual public-sector tone.\n"
            f"Question: {question}\n"
            f"Context:\n{context}\n"
            "Return concise response under headings only from the context."
        )
        try:
            response = requests.post(
                f"{self.ollama_url.rstrip('/')}/api/generate",
                json={"model": self.ollama_model, "prompt": prompt, "stream": False, "options": {"temperature": 0.1}},
                timeout=20,
            )
            response.raise_for_status()
            payload = response.json()
            return payload.get("response", "").strip() or None
        except Exception:
            return None
