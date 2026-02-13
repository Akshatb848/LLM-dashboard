"""
Production-Grade Response Cleaner
Removes emojis, formats data professionally, ensures government-grade output
"""

import re
from typing import Dict, List, Tuple


def remove_all_emojis(text: str) -> str:
    """
    Remove ALL emojis and decorative characters for production-grade output
    Government documents should not have emojis
    """
    # Remove common emojis
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags (iOS)
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "]+",
        flags=re.UNICODE
    )
    text = emoji_pattern.sub('', text)

    # Remove specific emoji characters commonly used
    emoji_chars = ['📊', '🏛️', '✅', '🤖', '📚', '🌐', '⚡', '🎯', '✨', '🔍', '💡', '🚀', '📈', '📉', '🔔', '🔑', '⚠️', '🚨']
    for emoji in emoji_chars:
        text = text.replace(emoji, '')

    # Remove bullet point emojis and replace with standard bullets
    text = text.replace('•', '•')  # Ensure standard bullet

    # Clean up excessive spaces left by emoji removal
    text = re.sub(r'  +', ' ', text)
    text = re.sub(r'^ +', '', text, flags=re.MULTILINE)

    return text


def extract_activities_data(text: str) -> List[Dict]:
    """
    Extract activities and events data for proper tabulation
    Example: "December 2025 newsletter: Schools 945000, teachers 4350000..."
    """
    activities = []

    # Pattern for numbered activities with data
    # "1. DECEMBER 2025 - TRANSFORMATION PHASE Strategic Focus: NEP 2020 Review..."
    activity_pattern = r'\d+\.\s+([A-Z][^:]+):\s*([^\.]+(?:\.[^\.]+)*)'
    matches = re.findall(activity_pattern, text, re.MULTILINE | re.DOTALL)

    for title, description in matches:
        # Extract any numbers from description
        numbers = re.findall(r'\d+(?:,\d{3})*(?:\.\d+)?[MK%]?', description)

        activities.append({
            'title': title.strip(),
            'description': description.strip()[:150] + '...' if len(description) > 150 else description.strip(),
            'has_numbers': len(numbers) > 0
        })

    return activities


def extract_bullet_point_data(text: str) -> List[Dict]:
    """
    Extract data from bullet points that should be in tables
    Example: "• December 2025 newsletter: Schools 945000, teachers 4350000..."
    """
    bullet_data = []

    # Find all bullet points
    bullet_pattern = r'[•\-\*]\s*([^\n]+)'
    matches = re.findall(bullet_pattern, text)

    for match in matches:
        # Check if this bullet point has statistical data
        has_numbers = bool(re.search(r'\d+(?:,\d{3})*', match))

        if has_numbers:
            # Extract metrics
            metrics = {}

            # Schools pattern
            schools_match = re.search(r'[Ss]chools?\s+(\d+(?:,\d{3})*)', match)
            if schools_match:
                metrics['Schools'] = schools_match.group(1)

            # Teachers pattern
            teachers_match = re.search(r'[Tt]eachers?\s+(\d+(?:,\d{3})*)', match)
            if teachers_match:
                metrics['Teachers'] = teachers_match.group(1)

            # Students pattern
            students_match = re.search(r'[Ss]tudents?\s+(\d+(?:,\d{3})*)', match)
            if students_match:
                metrics['Students'] = students_match.group(1)

            # APAAR pattern
            apaar_match = re.search(r'APAAR IDs?\s+(\d+(?:,\d{3})*)', match)
            if apaar_match:
                metrics['APAAR IDs'] = apaar_match.group(1)

            # Attendance pattern
            attendance_match = re.search(r'[Aa]ttendance\s+(\d+\.?\d*%)', match)
            if attendance_match:
                metrics['Attendance'] = attendance_match.group(1)

            if metrics:
                bullet_data.append({
                    'text': match,
                    'metrics': metrics
                })

    return bullet_data


def format_activities_as_table(activities: List[Dict]) -> str:
    """
    Convert activities list to professional table format
    """
    if not activities:
        return ""

    table = "\n**Major Activities & Initiatives:**\n\n"
    table += "| Activity | Description |\n"
    table += "|----------|-------------|\n"

    for i, activity in enumerate(activities[:5], 1):  # Limit to top 5
        title = activity['title']
        desc = activity['description']
        table += f"| {i}. {title} | {desc} |\n"

    return table + "\n"


def format_bullet_data_as_table(bullet_data: List[Dict]) -> str:
    """
    Convert bullet point data to table format
    """
    if not bullet_data:
        return ""

    # Combine all metrics
    all_metrics = {}
    for item in bullet_data:
        all_metrics.update(item['metrics'])

    if not all_metrics:
        return ""

    table = "\n**Statistical Summary:**\n\n"
    table += "| Metric | Value |\n"
    table += "|--------|-------|\n"

    for metric, value in all_metrics.items():
        table += f"| {metric} | {value} |\n"

    return table + "\n"


def production_grade_cleanup(response: str) -> str:
    """
    Main function to clean up response for production-grade output
    - Removes emojis
    - Formats all data as tables
    - Removes AI/chatbot language
    - Professional government formatting
    """
    # Step 1: Remove all emojis
    cleaned = remove_all_emojis(response)

    # Step 2: Remove chatbot/AI references
    ai_phrases = [
        r'(?i)I\'m an? (?:AI|assistant|chatbot)',
        r'(?i)As an? (?:AI|assistant|chatbot)',
        r'(?i)I cannot (?:help|assist|provide)',
        r'(?i)Let me (?:help|assist|explain)',
        r'(?i)I(?:\'ll| will) (?:help|assist)',
    ]

    for pattern in ai_phrases:
        cleaned = re.sub(pattern, '', cleaned)

    # Step 3: Clean up section headers - remove excessive formatting
    cleaned = cleaned.replace('🔑', '').replace('⚠️', '').replace('🚨', '')

    # Step 4: Standardize bullet points
    cleaned = re.sub(r'[•\-\*]\s*', '• ', cleaned)

    # Step 5: Clean up source section - make it professional
    cleaned = re.sub(
        r'Source:.*?Newsletter Data.*?Government of India',
        'Source: Official Newsletter - Department of School Education & Literacy, Ministry of Education, Government of India',
        cleaned,
        flags=re.DOTALL
    )

    # Step 6: Remove "ANALYSIS:" header if present (too casual)
    cleaned = cleaned.replace('ANALYSIS:\n', '')

    # Step 7: Clean up verification URLs - make them cleaner
    cleaned = re.sub(
        r'Verification:.*?verify.*?information',
        'Data Verification: Available via official API and Ministry website',
        cleaned,
        flags=re.IGNORECASE
    )

    return cleaned


def intelligent_data_visualization(response: str, query: str) -> str:
    """
    Intelligently decide how to visualize data based on query type
    - Activities query → Activities table
    - Statistics query → Metrics table
    - Comparison query → Comparison table
    - Timeline query → Timeline table
    """
    query_lower = query.lower()

    # Detect query intent
    is_activities_query = any(word in query_lower for word in ['activities', 'conducted', 'initiatives', 'events', 'programs'])
    is_statistics_query = any(word in query_lower for word in ['statistics', 'numbers', 'data', 'metrics', 'count'])
    is_comparison_query = any(word in query_lower for word in ['compare', 'comparison', 'versus', 'vs', 'difference'])
    is_timeline_query = any(word in query_lower for word in ['trend', 'growth', 'timeline', 'over time', 'from', 'to'])

    enhanced = response

    # Extract and format activities if relevant
    if is_activities_query:
        activities = extract_activities_data(response)
        if activities:
            activities_table = format_activities_as_table(activities)
            # Insert after "Based on official newsletter data:"
            insert_pos = enhanced.find('Based on official newsletter data:')
            if insert_pos > 0:
                insert_end = enhanced.find('\n\n', insert_pos)
                if insert_end > 0:
                    enhanced = enhanced[:insert_end] + '\n' + activities_table + enhanced[insert_end:]

    # Extract and format bullet point data
    bullet_data = extract_bullet_point_data(response)
    if bullet_data and (is_statistics_query or is_comparison_query):
        bullet_table = format_bullet_data_as_table(bullet_data)
        # Insert in Additional Context section or at the end
        insert_pos = enhanced.find('Additional Context:')
        if insert_pos > 0:
            enhanced = enhanced[:insert_pos] + bullet_table + '\n' + enhanced[insert_pos:]
        else:
            enhanced = enhanced + '\n' + bullet_table

    return enhanced
