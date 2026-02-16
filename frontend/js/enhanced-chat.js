/**
 * Enhanced Chat Widget - English Only Version
 * Ministry of Education Newsletter AI Assistant
 */

// Force English language only
let chatLanguage = 'en';
let hasSelectedLanguage = true; // Always true for English-only mode

// Override the original initializeChatWidget
const originalInitializeChatWidget = window.initializeChatWidget;

window.initializeChatWidget = function() {
    // Call original initialization
    if (originalInitializeChatWidget) {
        originalInitializeChatWidget();
    }

    // Override sendChatMessage to include language in API request
    const originalSendChatMessage = window.sendChatMessage;
    window.sendChatMessage = async function() {
        const chatInput = document.getElementById('chatInput');
        const chatMessages = document.getElementById('chatMessages');
        const chatSendBtn = document.getElementById('chatSendBtn');

        const message = chatInput.value.trim();
        if (!message) return;

        // Disable input while processing
        chatInput.disabled = true;
        chatSendBtn.disabled = true;

        // Add user message to chat
        addChatMessage(message, 'user');

        // Clear input
        chatInput.value = '';

        // Show typing indicator
        const typingIndicator = addTypingIndicator();

        try {
            // Send request to backend - always English
            const response = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: message,
                    language: 'en' // Always English
                })
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();

            // Remove typing indicator
            typingIndicator.remove();

            // Add bot response to chat
            addChatMessage(data.answer, 'bot');

            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;

        } catch (error) {
            console.error('Chat error:', error);
            typingIndicator.remove();
            addChatMessage('Sorry, I encountered an error. Please try again.', 'bot');
        } finally {
            // Re-enable input
            chatInput.disabled = false;
            chatSendBtn.disabled = false;
            chatInput.focus();
        }
    };
};

// Enhanced message rendering with beautiful formatting
window.addChatMessage = function(message, type = 'bot') {
    const chatMessages = document.getElementById('chatMessages');

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = type === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';

    const content = document.createElement('div');
    content.className = 'message-content enhanced-message';

    if (type === 'bot') {
        // Enhanced bot message formatting
        content.innerHTML = enhanceChatResponse(message);
    } else {
        // User message
        const p = document.createElement('p');
        p.textContent = message;
        content.appendChild(p);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);

    chatMessages.appendChild(messageDiv);

    // Scroll to bottom with smooth animation
    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
    });
};

// Enhance chat responses with beautiful formatting
function enhanceChatResponse(rawText) {
    let html = rawText;

    // If response contains HTML tables, render HTML directly without markdown parsing
    const hasHtmlTable = /<table[\s>]/i.test(html);

    if (!hasHtmlTable && typeof marked !== 'undefined' && marked.parse) {
        // Parse markdown content (no HTML tables present)
        try {
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: false,
                mangle: false
            });
            html = marked.parse(html);
        } catch (e) {
            console.warn('[VSK] Markdown parse error in chat:', e);
        }
    } else if (hasHtmlTable) {
        // For HTML table responses: convert non-HTML parts to formatted HTML
        // Process line breaks and bold markers outside of table tags
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\n\n/g, '<br><br>');
        html = html.replace(/\n(?!<)/g, '<br>');
        // Clean up <br> right before/after tables
        html = html.replace(/<br>\s*<table/g, '<table');
        html = html.replace(/<\/table>\s*<br>/g, '</table>');
    }

    // Wrap in enhanced response container
    let enhanced = `<div class="enhanced-response">${html}</div>`;

    // Style enhancements (safe for both HTML and markdown-rendered content)
    enhanced = enhanced.replace(/<h([1-6])>(.*?)<\/h\1>/g,
        '<h$1 style="color:#003d82;margin:16px 0 12px 0;font-weight:600;">$2</h$1>');

    enhanced = enhanced.replace(/<strong>(.*?)<\/strong>/g,
        '<strong style="color:#003d82;font-weight:700;">$1</strong>');

    return enhanced;
}

// Enhanced month-wise filtering with dynamic KPI updates
window.filterByTimePeriod = function(period) {
    const metricCards = document.querySelectorAll('.metric-card');
    const metricsHeader = document.querySelector('.metrics-period span');

    // Month data mapping (based on newsletter data)
    const monthData = {
        'all': { period: 'As of January 2026', schools: '948,000', teachers: '4.37M', students: '112.5M', apaar: '235M', attendance: '96.8%', digital: '87.3%' },
        'april-2025': { period: 'As of April 2025', schools: '915,000', teachers: '4.23M', students: '106.7M', apaar: '120M', attendance: '95.8%', digital: '74.8%' },
        'may-2025': { period: 'As of May 2025', schools: '920,000', teachers: '4.26M', students: '107.8M', apaar: '135M', attendance: '96.0%', digital: '76.2%' },
        'june-2025': { period: 'As of June 2025', schools: '923,000', teachers: '4.28M', students: '108.5M', apaar: '150M', attendance: '96.1%', digital: '78.5%' },
        'july-2025': { period: 'As of July 2025', schools: '927,000', teachers: '4.29M', students: '109.2M', apaar: '165M', attendance: '96.2%', digital: '80.1%' },
        'august-2025': { period: 'As of August 2025', schools: '930,000', teachers: '4.30M', students: '109.8M', apaar: '180M', attendance: '96.3%', digital: '82.0%' },
        'september-2025': { period: 'As of September 2025', schools: '935,000', teachers: '4.31M', students: '110.2M', apaar: '195M', attendance: '96.2%', digital: '83.5%' },
        'october-2025': { period: 'As of October 2025', schools: '938,000', teachers: '4.32M', students: '110.5M', apaar: '207M', attendance: '96.2%', digital: '84.8%' },
        'november-2025': { period: 'As of November 2025', schools: '942,000', teachers: '4.34M', students: '111.2M', apaar: '218M', attendance: '96.4%', digital: '85.9%' },
        'december-2025': { period: 'As of December 2025', schools: '945,000', teachers: '4.35M', students: '111.8M', apaar: '227M', attendance: '96.6%', digital: '86.7%' },
        'january-2026': { period: 'As of January 2026', schools: '948,000', teachers: '4.37M', students: '112.5M', apaar: '235M', attendance: '96.8%', digital: '87.3%' }
    };

    const data = monthData[period] || monthData['all'];

    // Update header
    if (metricsHeader) {
        metricsHeader.textContent = data.period;
    }

    // Update each metric card
    document.querySelector('.schools-card .metric-value').textContent = data.schools;
    document.querySelector('.teachers-card .metric-value').textContent = data.teachers;
    document.querySelector('.students-card .metric-value').textContent = data.students;
    document.querySelector('.apaar-card .metric-value').textContent = data.apaar;
    document.querySelector('.attendance-card .metric-value').textContent = data.attendance;
    document.querySelector('.digital-card .metric-value').textContent = data.digital;

    // Add animation
    metricCards.forEach((card, index) => {
        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = 'fadeInUp 0.5s ease-out';
        }, index * 50);
    });

    const periodName = period.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    showNotification(`Showing data for ${period === 'all' ? 'all months' : periodName}`, 'success');
    announceToScreenReader(`Data updated for ${period === 'all' ? 'all months' : periodName}`);
};

console.log('✅ Enhanced chat with language selection initialized');
