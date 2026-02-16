"""
Production-Grade Response Cleaner
Ensures professional, government-grade output for Ministry of Education
"""

import re
from typing import Dict, List


def remove_all_emojis(text: str) -> str:
    """
    Remove ALL emojis for production-grade government output
    """
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"
        "\U0001F300-\U0001F5FF"
        "\U0001F680-\U0001F6FF"
        "\U0001F1E0-\U0001F1FF"
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "]+",
        flags=re.UNICODE
    )
    text = emoji_pattern.sub('', text)

    # Remove specific emoji characters
    for emoji in ['📊', '🏛️', '✅', '🤖', '📚', '🌐', '⚡', '🎯', '✨', '🔍',
                  '💡', '🚀', '📈', '📉', '🔔', '🔑', '⚠️', '🚨', '📋', '❓', '📚',
                  '🔍', '💡']:
        text = text.replace(emoji, '')

    # Clean up excessive spaces left by emoji removal
    text = re.sub(r'  +', ' ', text)
    text = re.sub(r'^ +', '', text, flags=re.MULTILINE)

    return text


def production_grade_cleanup(response: str) -> str:
    """
    Clean up response for production-grade government output
    - Removes emojis
    - Removes AI/chatbot language
    - Preserves HTML tables intact
    """
    # Step 1: Remove all emojis
    cleaned = remove_all_emojis(response)

    # Step 2: Remove chatbot/AI self-references
    ai_phrases = [
        r'(?i)I\'m an? (?:AI|assistant|chatbot)[^.]*\.',
        r'(?i)As an? (?:AI|assistant|chatbot)[^.]*\.',
        r'(?i)I cannot (?:help|assist|provide)[^.]*\.',
        r'(?i)Let me (?:help|assist|explain)[^.]*\.',
        r'(?i)I(?:\'ll| will) (?:help|assist)[^.]*\.',
    ]

    for pattern in ai_phrases:
        cleaned = re.sub(pattern, '', cleaned)

    # Step 3: Remove "ANALYSIS:" header if present
    cleaned = cleaned.replace('ANALYSIS:\n', '')

    # Step 4: Clean up verification URLs to be more concise
    cleaned = re.sub(
        r'Verification:.*?verify.*?information',
        'Data Verification: Available via official API and Ministry website',
        cleaned,
        flags=re.IGNORECASE
    )

    # Step 5: Clean up empty lines
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)

    return cleaned.strip()


def intelligent_data_visualization(response: str, query: str) -> str:
    """
    Intelligently add HTML tables based on query type.
    Only processes responses that don't already contain HTML tables.
    """
    # Skip if response already has HTML tables
    if '<table' in response.lower():
        return response

    query_lower = query.lower()

    is_statistics_query = any(word in query_lower for word in [
        'statistics', 'numbers', 'data', 'metrics', 'count', 'total', 'how many'
    ])
    is_comparison_query = any(word in query_lower for word in [
        'compare', 'comparison', 'versus', 'vs', 'difference'
    ])

    enhanced = response

    # For statistics queries, extract bullet point data into tables
    if is_statistics_query or is_comparison_query:
        bullet_data = _extract_bullet_point_data(response)
        if bullet_data and len(bullet_data) >= 2:
            table_html = _format_bullet_data_as_html_table(bullet_data)
            if table_html:
                enhanced += '\n' + table_html

    return enhanced


def _extract_bullet_point_data(text: str) -> List[Dict]:
    """
    Extract statistical data from bullet points
    """
    bullet_data = []
    bullet_pattern = r'[•\-\*]\s*([^\n]+)'
    matches = re.findall(bullet_pattern, text)

    for match in matches:
        has_numbers = bool(re.search(r'\d+(?:,\d{3})*', match))
        if has_numbers:
            metrics = {}
            for metric_name, pattern in {
                'Schools': r'[Ss]chools?\s+(\d+(?:,\d{3})*)',
                'Teachers': r'[Tt]eachers?\s+(\d+(?:,\d{3})*)',
                'Students': r'[Ss]tudents?\s+(\d+(?:,\d{3})*)',
                'APAAR IDs': r'APAAR IDs?\s+(\d+(?:,\d{3})*)',
                'Attendance': r'[Aa]ttendance\s+(\d+\.?\d*%)',
            }.items():
                m = re.search(pattern, match)
                if m:
                    metrics[metric_name] = m.group(1)
            if metrics:
                bullet_data.append({'text': match, 'metrics': metrics})

    return bullet_data


def _format_bullet_data_as_html_table(bullet_data: List[Dict]) -> str:
    """
    Convert bullet point data to an HTML table
    """
    if not bullet_data:
        return ""

    all_metrics = {}
    for item in bullet_data:
        all_metrics.update(item['metrics'])

    if not all_metrics:
        return ""

    rows_html = ""
    for i, (metric, value) in enumerate(all_metrics.items()):
        bg = "#ffffff" if i % 2 == 0 else "#f8f9fa"
        rows_html += f'''<tr style="background:{bg};">
<td style="padding:12px;border-bottom:1px solid #e0e0e0;font-weight:500;color:#003d82;">{metric}</td>
<td style="padding:12px;border-bottom:1px solid #e0e0e0;color:#333;font-weight:600;">{value}</td>
</tr>'''

    return f'''
<p><strong>Statistical Summary:</strong></p>
<table style="border-collapse:collapse;width:100%;margin:16px 0;box-shadow:0 2px 8px rgba(0,61,130,0.12);border-radius:8px;overflow:hidden;">
<thead>
<tr style="background:linear-gradient(135deg,#003d82 0%,#0056b3 100%);color:white;">
<th style="padding:14px 12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">Metric</th>
<th style="padding:14px 12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">Value</th>
</tr>
</thead>
<tbody>
{rows_html}
</tbody>
</table>
'''
