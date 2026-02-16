from backend.llm.llm_handler import LLMHandler


class DummyResponse:
    def raise_for_status(self):
        return None

    def json(self):
        return {"response": "Verified editorial summary."}


class DummyLongResponse:
    def raise_for_status(self):
        return None

    def json(self):
        return {
            "response": "**Summary:** The APAAR ID registration shows significant growth from April 2025 to January 2026. "
                        "Starting at 120 million registrations in April 2025, the system achieved 235 million registrations "
                        "by January 2026, representing a 95.8% increase. This growth was driven by systematic state-level "
                        "integration and enhanced digital infrastructure across 36 states and union territories."
        }


def test_llm_summarize_with_mock(monkeypatch):
    monkeypatch.setenv('OLLAMA_URL', 'http://mock-ollama')
    handler = LLMHandler()

    def fake_post(*args, **kwargs):
        return DummyResponse()

    monkeypatch.setattr('backend.llm.llm_handler.requests.post', fake_post)
    out = handler.summarize('question', 'context')
    # Short responses are returned as-is
    assert 'Verified editorial summary' in out


def test_llm_summarize_long_response(monkeypatch):
    monkeypatch.setenv('OLLAMA_URL', 'http://mock-ollama')
    handler = LLMHandler()

    def fake_post(*args, **kwargs):
        return DummyLongResponse()

    monkeypatch.setattr('backend.llm.llm_handler.requests.post', fake_post)
    out = handler.summarize('APAAR growth statistics', 'context data here')
    assert out is not None
    assert 'APAAR' in out or 'registration' in out


def test_llm_disabled_without_url():
    handler = LLMHandler()
    assert handler.enabled is False
    result = handler.summarize('test question', 'test context')
    assert result is None


def test_llm_status_disabled():
    handler = LLMHandler()
    status = handler.status()
    assert status['enabled'] is False
    assert status['provider'] == 'disabled'


def test_llm_status_enabled(monkeypatch):
    monkeypatch.setenv('OLLAMA_URL', 'http://mock-ollama')
    handler = LLMHandler()
    status = handler.status()
    assert status['enabled'] is True
    assert status['provider'] == 'ollama'
