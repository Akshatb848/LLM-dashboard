from backend.llm.llm_handler import LLMHandler


class DummyResponse:
    def raise_for_status(self):
        return None

    def json(self):
        return {"response": "Verified editorial summary."}


def test_llm_summarize_with_mock(monkeypatch):
    monkeypatch.setenv('OLLAMA_URL', 'http://mock-ollama')
    handler = LLMHandler()

    def fake_post(*args, **kwargs):
        return DummyResponse()

    monkeypatch.setattr('backend.llm.llm_handler.requests.post', fake_post)
    out = handler.summarize('question', 'context')
    assert out == 'Verified editorial summary.'
