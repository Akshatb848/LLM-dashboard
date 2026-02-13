"""
Source Verification Utility
Provides correct, verifiable URLs for data sources
"""

# Official source URLs
RENDER_API_BASE = "https://llm-dashboard-backend-8gb0.onrender.com"
GOV_WEBSITE_BASE = "https://www.education.gov.in"

# API Endpoints
API_ENDPOINTS = {
    "full_data": f"{RENDER_API_BASE}/api/analytics/full-data",
    "overview": f"{RENDER_API_BASE}/api/analytics/overview",
    "health": f"{RENDER_API_BASE}/api/health",
    "chat": f"{RENDER_API_BASE}/api/chat",
}

# Government Website URLs
GOV_URLS = {
    "newsletter": f"{GOV_WEBSITE_BASE}/en/documents-reports-category/newsletter",
    "main": GOV_WEBSITE_BASE,
    "dsel": f"{GOV_WEBSITE_BASE}/en/school_education",
}

def get_verification_text() -> str:
    """
    Get standardized verification text for responses
    Production-grade, no emojis
    """
    return f"""**Data Verification:**
Live API: {API_ENDPOINTS['full_data']}
Official Source: {GOV_URLS['newsletter']}
Ministry Website: {GOV_URLS['main']}

Users can verify this data by:
1. Accessing the Live API endpoint (JSON format)
2. Visiting the official Ministry of Education newsletter section
3. Contacting the Department of School Education & Literacy"""

def get_source_attribution(newsletter_month: str = None) -> str:
    """
    Get standardized source attribution
    Production-grade, no emojis
    """
    month_text = newsletter_month if newsletter_month else "April 2025 - January 2026"

    return f"""**Data Source:**
Newsletter: {month_text}
Section: Official VSK (Vidya Samiksha Kendra) Newsletter
Live Data API: {API_ENDPOINTS['full_data']}
Official Website: {GOV_URLS['newsletter']}
Verification: Data can be verified via the API endpoint or official Ministry website"""

def verify_url_accessible(url: str) -> bool:
    """
    Check if URL is accessible (for testing)
    """
    import requests
    try:
        response = requests.head(url, timeout=5)
        return response.status_code < 400
    except:
        return False

def get_footer_attribution() -> str:
    """
    Get footer attribution for responses
    Production-grade, no emojis
    """
    return """---
**Source:** Official Newsletter Data (April 2025 - January 2026)
Department of School Education & Literacy, Ministry of Education, Government of India
**Data Verification:** """ + API_ENDPOINTS['full_data']
