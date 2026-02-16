/**
 * Enhanced Chat Widget with Language Selection & Beautiful Responses
 */

// Chat language preference
let chatLanguage = 'en';
let hasSelectedLanguage = false;

// Override the original initializeChatWidget to add language selection
const originalInitializeChatWidget = window.initializeChatWidget;

window.initializeChatWidget = function() {
    // Call original initialization
    if (originalInitializeChatWidget) {
        originalInitializeChatWidget();
    }

    // Add language selection UI
    addLanguageSelectionToChatWidget();

    // Override sendChatMessage to include language
    const originalSendChatMessage = window.sendChatMessage;
    window.sendChatMessage = function() {
        if (!hasSelectedLanguage) {
            showNotification('Please select your preferred language first', 'info');
            return;
        }
        if (originalSendChatMessage) {
            originalSendChatMessage();
        }
    };
};

// Add language selection to chat widget
function addLanguageSelectionToChatWidget() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    // Clear welcome message
    chatMessages.innerHTML = '';

    // Add language selection message
    const langSelectMessage = document.createElement('div');
    langSelectMessage.className = 'chat-message bot-message language-selection-message';
    langSelectMessage.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <p style="margin-bottom: 16px; font-weight: 600; color: #003d82;">
                Welcome to Newsletter AI Assistant!<br>
                समाचार पत्र AI सहायक में आपका स्वागत है!
            </p>
            <p style="margin-bottom: 12px;">Please select your preferred language for responses:</p>
            <p style="margin-bottom: 16px;">कृपया प्रतिक्रियाओं के लिए अपनी पसंदीदा भाषा चुनें:</p>
            <div class="language-selection-buttons" style="display: flex; gap: 12px;">
                <button class="chat-lang-btn" data-lang="en" style="
                    flex: 1;
                    padding: 14px 20px;
                    background: linear-gradient(135deg, #003d82, #0056b3);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(0,61,130,0.2);
                ">
                    <i class="fas fa-language"></i> English
                </button>
                <button class="chat-lang-btn" data-lang="hi" style="
                    flex: 1;
                    padding: 14px 20px;
                    background: linear-gradient(135deg, #FF6600, #ff8533);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(255,102,0,0.2);
                ">
                    <i class="fas fa-language"></i> हिंदी
                </button>
            </div>
        </div>
    `;

    chatMessages.appendChild(langSelectMessage);

    // Add event listeners to language buttons
    document.querySelectorAll('.chat-lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            chatLanguage = this.dataset.lang;
            hasSelectedLanguage = true;

            // Add confirmation message
            const confirmMsg = document.createElement('div');
            confirmMsg.className = 'chat-message bot-message';
            confirmMsg.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p style="font-weight: 600; color: #28a745;">
                        ${chatLanguage === 'en' ?
                            '✓ Language set to English. How can I help you today?' :
                            '✓ भाषा हिंदी में सेट की गई। आज मैं आपकी कैसे मदद कर सकता हूं?'}
                    </p>
                    <p style="margin-top: 8px; font-size: 13px; color: #666;">
                        ${chatLanguage === 'en' ?
                            'Ask me about APAAR IDs, attendance rates, state performance, or any education statistics from April 2025 to January 2026.' :
                            'मुझसे APAAR IDs, उपस्थिति दर, राज्य प्रदर्शन, या अप्रैल 2025 से जनवरी 2026 तक की किसी भी शिक्षा सांख्यिकी के बारे में पूछें।'}
                    </p>
                </div>
            `;
            chatMessages.appendChild(confirmMsg);

            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Enable input
            document.getElementById('chatInput').disabled = false;
            document.getElementById('chatSendBtn').disabled = false;

            showNotification(
                chatLanguage === 'en' ? 'Language set to English' : 'भाषा हिंदी में सेट की गई',
                'success'
            );
        });

        // Add hover effect
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05) translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        });

        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) translateY(0)';
            this.style.boxShadow = this.dataset.lang === 'en' ?
                '0 2px 8px rgba(0,61,130,0.2)' :
                '0 2px 8px rgba(255,102,0,0.2)';
        });
    });

    // Disable input until language is selected
    document.getElementById('chatInput').disabled = true;
    document.getElementById('chatSendBtn').disabled = true;
    document.getElementById('chatInput').placeholder =
        'Please select language first / कृपया पहले भाषा चुनें...';
}

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
function enhanceChatResponse(html) {
    let enhanced = html;

    // Add response container
    enhanced = `<div class="enhanced-response">${enhanced}</div>`;

    // Enhance headers
    enhanced = enhanced.replace(/<h([1-6])>(.*?)<\/h\1>/g,
        '<h$1 style="color: #003d82; margin: 16px 0 12px 0; font-weight: 600; display: flex; align-items: center; gap: 8px;">' +
        '<i class="fas fa-angle-double-right" style="color: #FF6600; font-size: 0.8em;"></i>$2</h$1>');

    // Enhance strong text
    enhanced = enhanced.replace(/<strong>(.*?)<\/strong>/g,
        '<strong style="color: #003d82; font-weight: 700;">$1</strong>');

    // Enhance lists
    enhanced = enhanced.replace(/<ul>/g,
        '<ul style="margin: 12px 0; padding-left: 24px;">');
    enhanced = enhanced.replace(/<li>/g,
        '<li style="margin: 8px 0; line-height: 1.6; color: #333;">');

    // Add icons to common keywords
    enhanced = enhanced.replace(/\b(Schools?)\b/g, '<i class="fas fa-school" style="color: #FF6600; font-size: 0.9em;"></i> $1');
    enhanced = enhanced.replace(/\b(Teachers?)\b/g, '<i class="fas fa-chalkboard-teacher" style="color: #28a745; font-size: 0.9em;"></i> $1');
    enhanced = enhanced.replace(/\b(Students?)\b/g, '<i class="fas fa-user-graduate" style="color: #003d82; font-size: 0.9em;"></i> $1');
    enhanced = enhanced.replace(/\b(APAAR ID[s]?)\b/g, '<i class="fas fa-id-card" style="color: #ffc107; font-size: 0.9em;"></i> $1');
    enhanced = enhanced.replace(/\b(Attendance)\b/g, '<i class="fas fa-clipboard-check" style="color: #17a2b8; font-size: 0.9em;"></i> $1');

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
