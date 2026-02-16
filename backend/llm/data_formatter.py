"""
Intelligent Data Formatter - Converts numerical data to well-formatted tables
Supports both Markdown and HTML table output for the VSK Newsletter platform
"""

import re
from typing import Dict, List


def detect_statistical_patterns(text: str) -> List[Dict]:
    """
    Detect patterns of statistical data in plain text
    """
    patterns = []

    stat_pattern = r'(?:Schools?|Teachers?|Students?|APAAR IDs?|Attendance|Enrollment)\s+(\d[\d,]*\.?\d*%?)'
    matches = re.findall(stat_pattern, text, re.IGNORECASE)

    if len(matches) >= 3:
        patterns.append({
            'type': 'key_metrics',
            'matches': matches,
            'text': text
        })

    monthly_pattern = r'((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}):\s*(\d+M?)\s*(?:registrations?|students?|schools?)?\s*(?:\([^)]+\))?'
    monthly_matches = re.findall(monthly_pattern, text, re.IGNORECASE)

    if len(monthly_matches) >= 3:
        patterns.append({
            'type': 'monthly_data',
            'matches': monthly_matches,
            'text': text
        })

    state_pattern = r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(\d+\.?\d*%)'
    state_matches = re.findall(state_pattern, text)

    if len(state_matches) >= 2:
        patterns.append({
            'type': 'state_data',
            'matches': state_matches,
            'text': text
        })

    return patterns


def extract_key_metrics_from_text(text: str) -> Dict[str, str]:
    """
    Extract key metrics like Schools, Teachers, Students from plain text
    """
    metrics = {}

    metric_patterns = {
        'Schools': r'Schools?\s+(\d[\d,]*)',
        'Teachers': r'Teachers?\s+(\d[\d,]*)',
        'Students': r'Students?\s+(\d[\d,]*)',
        'APAAR IDs': r'APAAR IDs?\s+(\d[\d,]*)',
        'Attendance': r'Attendance\s+(\d+\.?\d*%)',
        'Enrollment': r'Enrollment\s+(\d[\d,]*)',
    }

    for metric_name, pattern in metric_patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            value = match.group(1)
            if '%' not in value:
                try:
                    num = int(value.replace(',', ''))
                    value = f"{num:,}"
                except ValueError:
                    pass
            metrics[metric_name] = value

    return metrics


def format_metrics_as_html_table(metrics: Dict[str, str], title: str = "Key Metrics") -> str:
    """
    Format metrics as a styled HTML table matching the VSK color scheme
    """
    if not metrics:
        return ""

    rows_html = ""
    for i, (metric, value) in enumerate(metrics.items()):
        bg = "#ffffff" if i % 2 == 0 else "#f8f9fa"
        rows_html += f'''<tr style="background:{bg};">
<td style="padding:12px;border-bottom:1px solid #e0e0e0;font-weight:500;color:#003d82;">{metric}</td>
<td style="padding:12px;border-bottom:1px solid #e0e0e0;color:#333;font-weight:600;">{value}</td>
</tr>'''

    return f'''
<p><strong>{title}:</strong></p>
<table style="border-collapse:collapse;width:100%;margin:16px 0;box-shadow:0 2px 8px rgba(0,61,130,0.12);border-radius:8px;overflow:hidden;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
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


def format_monthly_data_as_html_table(monthly_data: List[Dict], title: str = "Monthly Trend") -> str:
    """
    Format monthly data as an HTML table
    """
    if not monthly_data:
        return ""

    rows_html = ""
    for i, item in enumerate(monthly_data):
        bg = "#ffffff" if i % 2 == 0 else "#f8f9fa"
        month = item.get('month', 'N/A')
        value = item.get('value', 'N/A')
        states = item.get('states', 'N/A')
        rows_html += f'''<tr style="background:{bg};">
<td style="padding:12px;border-bottom:1px solid #e0e0e0;font-weight:500;color:#003d82;">{month}</td>
<td style="padding:12px;border-bottom:1px solid #e0e0e0;color:#333;font-weight:600;">{value}</td>
<td style="padding:12px;border-bottom:1px solid #e0e0e0;color:#333;">{states}</td>
</tr>'''

    return f'''
<p><strong>{title}:</strong></p>
<table style="border-collapse:collapse;width:100%;margin:16px 0;box-shadow:0 2px 8px rgba(0,61,130,0.12);border-radius:8px;overflow:hidden;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<thead>
<tr style="background:linear-gradient(135deg,#003d82 0%,#0056b3 100%);color:white;">
<th style="padding:14px 12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">Month</th>
<th style="padding:14px 12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">Value</th>
<th style="padding:14px 12px;text-align:left;font-weight:600;border-bottom:3px solid #FF6600;">States Active</th>
</tr>
</thead>
<tbody>
{rows_html}
</tbody>
</table>
'''


def enhance_response_with_tables(response: str, query: str = "") -> str:
    """
    Main enhancement function - detects inline statistics and converts to HTML tables.
    Only adds tables for data not already in table format.
    """
    # If response already has HTML tables, skip auto-formatting
    if '<table' in response.lower():
        return response

    enhanced = response

    # Extract and format key metrics
    metrics = extract_key_metrics_from_text(response)
    if metrics and len(metrics) >= 2:
        table_html = format_metrics_as_html_table(metrics)
        # Insert table after first paragraph
        insert_pos = enhanced.find('\n\n')
        if insert_pos > 0:
            enhanced = enhanced[:insert_pos] + "\n" + table_html + enhanced[insert_pos:]
        else:
            enhanced += "\n" + table_html

    # Clean up excessive newlines
    enhanced = re.sub(r'\n{4,}', '\n\n', enhanced)

    # Convert section headers to bold
    enhanced = enhanced.replace('ADDITIONAL CONTEXT:', '\n---\n\n**Additional Context:**')
    enhanced = enhanced.replace('Based on official newsletter data:', '**Based on official newsletter data:**')

    return enhanced
