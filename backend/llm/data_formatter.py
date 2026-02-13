"""
Intelligent Data Formatter - Automatically converts numerical data to tables
Detects patterns like "Schools X, Teachers Y, Students Z" and formats as tables
"""

import re
from typing import Dict, List, Tuple


def detect_statistical_patterns(text: str) -> List[Dict]:
    """
    Detect patterns of statistical data in plain text
    Returns list of detected data blocks with their type
    """
    patterns = []

    # Pattern 1: "Schools 945000, teachers 4350000, students 111800000"
    # Matches: metric value, metric value, metric value
    stat_pattern = r'(?:Schools?|Teachers?|Students?|APAAR IDs?|Attendance|Enrollment)\s+(\d[\d,]*\.?\d*%?)'
    matches = re.findall(stat_pattern, text, re.IGNORECASE)

    if len(matches) >= 3:
        patterns.append({
            'type': 'key_metrics',
            'matches': matches,
            'text': text
        })

    # Pattern 2: "April 2025: 120M registrations (28 states)"
    # Monthly data with growth patterns
    monthly_pattern = r'((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}):\s*(\d+M?)\s*(?:registrations?|students?|schools?)?\s*(?:\([^)]+\))?'
    monthly_matches = re.findall(monthly_pattern, text, re.IGNORECASE)

    if len(monthly_matches) >= 3:
        patterns.append({
            'type': 'monthly_data',
            'matches': monthly_matches,
            'text': text
        })

    # Pattern 3: State names followed by percentages
    # "Kerala 98.6%, Tamil Nadu 96.3%, Gujarat 95.8%"
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
    Example: "Schools 945000, teachers 4350000" -> {"Schools": "945,000", "Teachers": "4,350,000"}
    """
    metrics = {}

    # Define metric patterns
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
            # Format numbers with commas
            if '%' not in value:
                try:
                    num = int(value.replace(',', ''))
                    value = f"{num:,}"
                except ValueError:
                    pass
            metrics[metric_name] = value

    return metrics


def extract_monthly_data_from_text(text: str) -> List[Dict]:
    """
    Extract monthly data patterns
    Example: "April 2025: 120M registrations (28 states)" -> [{month, value, states}]
    """
    monthly_data = []

    # Pattern for monthly data
    pattern = r'((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}):\s*(\d+M?)\s*(?:registrations?|schools?|students?)?\s*\([^)]*?(\d+)\s*states?[^)]*\)'

    matches = re.findall(pattern, text, re.IGNORECASE)

    for month, value, states in matches:
        monthly_data.append({
            'month': month,
            'value': value,
            'states': states
        })

    # Also try simpler pattern without states
    if not monthly_data:
        simple_pattern = r'((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}):\s*(\d+M?)'
        simple_matches = re.findall(simple_pattern, text, re.IGNORECASE)

        for month, value in simple_matches:
            monthly_data.append({
                'month': month,
                'value': value,
                'states': 'N/A'
            })

    return monthly_data


def format_as_table(data: Dict, table_type: str = 'key_metrics') -> str:
    """
    Convert detected data into Markdown table format
    """
    if table_type == 'key_metrics' and isinstance(data, dict):
        if not data:
            return ""

        table = "\n**Key Metrics:**\n\n"
        table += "| Metric | Value |\n"
        table += "|--------|-------|\n"

        for metric, value in data.items():
            table += f"| {metric} | {value} |\n"

        return table + "\n"

    elif table_type == 'monthly_data' and isinstance(data, list):
        if not data:
            return ""

        table = "\n**Monthly Data:**\n\n"
        table += "| Month | Value | States Active |\n"
        table += "|-------|-------|---------------|\n"

        for item in data:
            month = item.get('month', 'N/A')
            value = item.get('value', 'N/A')
            states = item.get('states', 'N/A')
            table += f"| {month} | {value} | {states} |\n"

        return table + "\n"

    return ""


def auto_format_response(response: str) -> str:
    """
    Automatically detect numerical data and convert to tables
    This is the main function called from chat handler
    """
    # If response already has tables, return as is
    if '|' in response and '---' in response:
        return response

    formatted_response = response

    # Extract and format key metrics (Schools, Teachers, Students, etc.)
    metrics = extract_key_metrics_from_text(response)
    if metrics:
        # Find where to insert the table (after first paragraph or before "Highlights:")
        insert_pos = response.find('\n\n')
        if insert_pos == -1:
            insert_pos = response.find('Highlights:')
        if insert_pos == -1:
            insert_pos = response.find('ADDITIONAL CONTEXT:')

        if insert_pos > 0:
            table = format_as_table(metrics, 'key_metrics')
            formatted_response = response[:insert_pos] + "\n" + table + response[insert_pos:]
        else:
            # Append at the end
            table = format_as_table(metrics, 'key_metrics')
            formatted_response = response + "\n" + table

    # Extract and format monthly data
    monthly_data = extract_monthly_data_from_text(response)
    if monthly_data and len(monthly_data) >= 3:
        # Look for "Monthly Growth Pattern:" or similar
        monthly_section_pos = formatted_response.find('Monthly Growth Pattern:')
        if monthly_section_pos == -1:
            monthly_section_pos = formatted_response.find('APAAR milestones:')

        if monthly_section_pos > 0:
            # Find the end of the section (next major heading or double newline)
            section_end = formatted_response.find('\n\n', monthly_section_pos)
            if section_end == -1:
                section_end = formatted_response.find('ADDITIONAL CONTEXT:', monthly_section_pos)
            if section_end == -1:
                section_end = len(formatted_response)

            # Replace the section with table
            table = format_as_table(monthly_data, 'monthly_data')
            formatted_response = (
                formatted_response[:monthly_section_pos] +
                "Monthly Growth Pattern:\n" +
                table +
                formatted_response[section_end:]
            )

    return formatted_response


def enhance_response_with_tables(response: str, query: str = "") -> str:
    """
    Main enhancement function - adds tables and improves formatting
    Called from chat handler before returning response
    """
    # Step 1: Auto-format detected data
    enhanced = auto_format_response(response)

    # Step 2: Clean up formatting
    # Remove excessive newlines
    enhanced = re.sub(r'\n{4,}', '\n\n', enhanced)

    # Step 3: Ensure proper structure
    # If response doesn't have "**Summary:**", add it
    if "**Summary:**" not in enhanced and "RESPONSE:" in enhanced:
        enhanced = enhanced.replace("RESPONSE:", "**Summary:**")

    # Step 4: Add visual separators for sections
    enhanced = enhanced.replace('ADDITIONAL CONTEXT:', '\n---\n\n**Additional Context:**')
    enhanced = enhanced.replace('Based on official newsletter data:', '**Based on official newsletter data:**')

    return enhanced
