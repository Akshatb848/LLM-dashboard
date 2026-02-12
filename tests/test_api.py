from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_health():
    res = client.get('/api/health')
    assert res.status_code == 200
    data = res.json()
    assert data['rag_initialized'] is True


def test_chat_rag_only_response_structure():
    res = client.post('/api/chat', json={'query': 'What happened in April 2025?'})
    assert res.status_code == 200
    data = res.json()
    assert 'Education Intelligence Report' in data['answer']
    assert 'sources' in data


def test_chat_invalid_query():
    res = client.post('/api/chat', json={'query': 'Tell me about lunar colonies in 2040'})
    assert res.status_code == 200
    assert res.json()['answer'] == 'No relevant information found in the official newsletter data.'
