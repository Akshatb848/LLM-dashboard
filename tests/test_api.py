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
    assert 'answer' in data
    assert 'sources' in data
    assert 'mode' in data
    # Response should contain relevant content about April 2025
    assert len(data['answer']) > 50


def test_chat_empty_query():
    res = client.post('/api/chat', json={'query': ''})
    assert res.status_code == 200
    data = res.json()
    assert 'No relevant information' in data['answer']


def test_chat_with_language():
    res = client.post('/api/chat', json={'query': 'APAAR statistics', 'language': 'en'})
    assert res.status_code == 200
    data = res.json()
    assert 'answer' in data
    assert len(data['answer']) > 50


def test_full_data_endpoint():
    res = client.get('/api/analytics/full-data')
    assert res.status_code == 200
    data = res.json()
    assert 'months' in data
    assert 'director_message' in data
    assert len(data['months']) == 10


def test_analytics_overview():
    res = client.get('/api/analytics/overview')
    assert res.status_code == 200
    data = res.json()
    assert 'attendance_trend' in data
    assert 'apaar_trend' in data


def test_newsletter_months():
    res = client.get('/api/newsletter/months')
    assert res.status_code == 200
    data = res.json()
    assert 'months' in data
    assert len(data['months']) == 10


def test_newsletter_month_detail():
    res = client.get('/api/newsletter/April%202025')
    assert res.status_code == 200
    data = res.json()
    assert data['month'] == 'April 2025'
    assert 'schools' in data
    assert 'teachers' in data
