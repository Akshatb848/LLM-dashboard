from __future__ import annotations

import os
from typing import Any

import requests

# Import enhanced system prompt and formatter
try:
    from backend.llm.system_prompt import get_enhanced_system_prompt, get_structured_prompt, detect_query_type, detect_chapter
    from backend.llm.response_formatter import ensure_structured_format, add_source_urls
except ImportError:
    # Fallback if module structure is different
    from llm.system_prompt import get_enhanced_system_prompt, get_structured_prompt, detect_query_type, detect_chapter
    from llm.response_formatter import ensure_structured_format, add_source_urls


class LLMHandler:
    def __init__(self) -> None:
        self.ollama_url = os.getenv("OLLAMA_URL", "")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3.1")
        self.enabled = bool(self.ollama_url)
        self.system_prompt = get_enhanced_system_prompt()

    def status(self) -> dict[str, Any]:
        return {
            "enabled": self.enabled,
            "provider": "ollama" if self.enabled else "disabled",
            "model": self.ollama_model if self.enabled else None,
            "enhanced_prompt": True,
            "query_type_detection": True,
            "structured_responses": True,
        }

    def summarize(self, question: str, context: str) -> str | None:
        """
        Enhanced summarization with structured responses and contextual questions
        """
        if not self.enabled:
            return None

        # Detect query type and chapter for better context
        query_type = detect_query_type(question)
        chapter = detect_chapter(question)

        # Use structured prompt for better responses
        prompt = get_structured_prompt(question, context)

        try:
            response = requests.post(
                f"{self.ollama_url.rstrip('/')}/api/generate",
                json={
                    "model": self.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,  # Low temperature for factual accuracy
                        "top_p": 0.9,
                        "top_k": 40,
                        "repeat_penalty": 1.1,
                        "num_predict": 1024,  # Allow longer responses for structured format
                    }
                },
                timeout=30,  # Increased timeout for longer responses
            )
            response.raise_for_status()
            payload = response.json()
            llm_response = payload.get("response", "").strip()

            # Post-process to ensure structure with source URLs
            if llm_response:
                return self._ensure_structured_response(llm_response, query_type, question, chapter)

            return None

        except Exception as e:
            print(f"LLM Error: {e}")
            return None

    def _ensure_structured_response(self, response: str, query_type: str, query: str = "", chapter: str = "general") -> str:
        """
        Ensure the response follows the structured format with source URLs
        """
        # If response is too short, it might not be valid
        if len(response) < 50:
            return response

        # Use response formatter to ensure structure and add URLs
        try:
            structured_response = ensure_structured_format(response, query, query_type, chapter)

            # Ensure source URLs are present
            structured_response = add_source_urls(structured_response)

            # Add query type tag for frontend rendering (hidden comment)
            structured_response = f"<!-- Query Type: {query_type} | Chapter: {chapter} -->\n{structured_response}"

            return structured_response
        except Exception:
            # Fallback: just add source URLs
            return add_source_urls(response)
