"""
Response Formatter for Structured LLM Outputs
Ensures all responses include proper source URLs and verification links
"""

def add_source_urls(response: str, newsletter_month: str = None) -> str:
    """
    Enhance response with source URLs for verification
    """
    base_url = "https://llm-dashboard-backend-8gb0.onrender.com"
    gov_url = "https://www.education.gov.in"

    # If response doesn't have source section, add it
    if "**Data Source:**" not in response and "**Source:**" not in response:
        source_section = f"""

**Data Source:**
Newsletter: {newsletter_month or "VSK Newsletter (April 2025 - January 2026)"}
📊 Live Data API: {base_url}/api/analytics/full-data
🏛️ Official Website: {gov_url}/en/documents-reports-category/newsletter
✅ Verification: Users can access the live API or official Ministry website to verify this information
"""
        response += source_section

    # Enhance existing source section with URLs if not present
    elif "https://" not in response:
        response = response.replace(
            "**Data Source:**",
            f"**Data Source:**\n📊 Live Data API: {base_url}/api/analytics/full-data\n🏛️ Official Website: {gov_url}/en/documents-reports-category/newsletter\n"
        )

    return response


def format_table_response(data: list[dict], headers: list[str]) -> str:
    """
    Format data as Markdown table
    """
    if not data or not headers:
        return ""

    # Build table header
    header_row = "| " + " | ".join(headers) + " |"
    separator = "| " + " | ".join(["---" for _ in headers]) + " |"

    # Build data rows
    rows = []
    for item in data:
        row_values = [str(item.get(h, "N/A")) for h in headers]
        row = "| " + " | ".join(row_values) + " |"
        rows.append(row)

    table = "\n".join([header_row, separator] + rows)
    return f"\n{table}\n"


def generate_contextual_questions(query: str, query_type: str, chapter: str) -> list[str]:
    """
    Generate 3 contextual follow-up questions based on query
    """
    questions = []

    # Temporal question
    if "month" in query.lower() or "january" in query.lower():
        questions.append("How did this metric change from April 2025 to January 2026?")
    else:
        questions.append("What was the month-over-month trend for this metric?")

    # Geographic/Category question
    if "state" in query.lower():
        questions.append("How do other states compare in this metric?")
    elif "teacher" in query.lower():
        questions.append("What is the student-teacher ratio across different states?")
    elif "apaar" in query.lower():
        questions.append("Which states have the highest APAAR adoption rates?")
    else:
        questions.append("How does this metric vary across different states or regions?")

    # Analytical question
    if query_type == "statistical":
        questions.append("What initiatives or policies contributed to these numbers?")
    elif query_type == "temporal":
        questions.append("What factors explain this trend or change?")
    elif chapter == "digital":
        questions.append("How does digital infrastructure correlate with learning outcomes?")
    else:
        questions.append("What are the key challenges and opportunities identified?")

    return questions[:3]  # Ensure exactly 3 questions


def ensure_structured_format(response: str, query: str, query_type: str, chapter: str) -> str:
    """
    Ensure response follows the mandatory structured format
    """
    # Check if response already has structure
    has_summary = "**Summary:**" in response or "Summary:" in response
    has_source = "**Data Source:**" in response or "**Source:**" in response
    has_questions = "**Related Questions" in response

    # If response is well-structured, just enhance with URLs
    if has_summary and has_source and has_questions:
        return add_source_urls(response)

    # If response lacks structure, add it
    structured_response = response

    # Add summary if missing
    if not has_summary:
        structured_response = f"**Summary:**\n{response.split('\n')[0]}\n\n{response}"

    # Add source URLs
    structured_response = add_source_urls(structured_response)

    # Add contextual questions if missing
    if not has_questions:
        questions = generate_contextual_questions(query, query_type, chapter)
        questions_section = "\n**Related Questions You Might Ask:**\n"
        for i, q in enumerate(questions, 1):
            questions_section += f"{i}. {q}\n"
        structured_response += questions_section

    return structured_response


def format_comparison_table(data_dict: dict, title: str = "Comparison") -> str:
    """
    Format a comparison dictionary as a table
    """
    if not data_dict:
        return ""

    headers = ["Metric", "Value"]
    rows = []
    for key, value in data_dict.items():
        rows.append(f"| {key} | {value} |")

    table = f"**{title}**\n\n"
    table += "| " + " | ".join(headers) + " |\n"
    table += "| " + " | ".join(["---" for _ in headers]) + " |\n"
    table += "\n".join(rows)

    return table


def format_state_comparison(states_data: dict) -> str:
    """
    Format state-wise data as a ranked table
    """
    if not states_data:
        return ""

    table = "\n**State-wise Comparison:**\n\n"
    table += "| Rank | State | Attendance | APAAR Coverage | Schools |\n"
    table += "|------|-------|------------|----------------|----------|\n"

    # Sort by attendance (or any metric)
    sorted_states = sorted(
        states_data.items(),
        key=lambda x: x[1].get('attendance', 0),
        reverse=True
    )

    for rank, (state, data) in enumerate(sorted_states, 1):
        attendance = data.get('attendance', 'N/A')
        apaar = data.get('apaar_coverage', 'N/A')
        schools = data.get('schools', 'N/A')
        table += f"| {rank} | {state} | {attendance}% | {apaar}% | {schools:,} |\n"

    return table
