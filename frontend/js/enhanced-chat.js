/**
 * Enhanced Chat Widget with Language Selection
 * Ministry of Education Newsletter AI Assistant
 * Production-grade with Hindi / English bilingual support
 */

let chatLanguage = localStorage.getItem('chatLang') || null;
let hasSelectedLanguage = !!chatLanguage;

// ===== Language Selection =====
function showLanguageSelect() {
    const sel = document.getElementById('chatLangSelect');
    const msgs = document.getElementById('chatMessages');
    const quick = document.getElementById('quickQueries');
    const input = document.getElementById('chatInputArea');
    if (sel) sel.style.display = 'flex';
    if (msgs) msgs.style.display = 'none';
    if (quick) quick.style.display = 'none';
    if (input) input.style.display = 'none';
}

function showChatInterface() {
    const sel = document.getElementById('chatLangSelect');
    const msgs = document.getElementById('chatMessages');
    const quick = document.getElementById('quickQueries');
    const input = document.getElementById('chatInputArea');
    if (sel) { sel.style.opacity = '0'; setTimeout(() => sel.style.display = 'none', 300); }
    if (msgs) { msgs.style.display = 'flex'; msgs.style.animation = 'fadeInUp 0.4s ease-out'; }
    if (quick) { quick.style.display = 'flex'; quick.style.animation = 'fadeInUp 0.4s ease-out 0.1s both'; }
    if (input) { input.style.display = 'flex'; input.style.animation = 'fadeInUp 0.4s ease-out 0.2s both'; }
    updateChatInterfaceLanguage();
}

function selectChatLanguage(lang) {
    chatLanguage = lang;
    hasSelectedLanguage = true;
    localStorage.setItem('chatLang', lang);

    // Clear existing messages
    const msgs = document.getElementById('chatMessages');
    if (msgs) msgs.innerHTML = '';

    // Add welcome message in chosen language
    const welcomeMsg = lang === 'hi'
        ? 'नमस्ते! मैं आपका न्यूज़लेटर AI सहायक हूँ। मैं अप्रैल 2025 से जनवरी 2026 तक शिक्षा सांख्यिकी, APAAR IDs, उपस्थिति दर, राज्य प्रदर्शन और पहल के बारे में आपके प्रश्नों में मदद कर सकता हूँ।'
        : 'Hello! I\'m your Newsletter AI Assistant. I can help you with questions about education statistics, APAAR IDs, attendance rates, state performance, and initiatives from April 2025 to January 2026.';
    addChatMessage(welcomeMsg, 'bot');

    showChatInterface();

    const statusEl = document.getElementById('chatStatusText');
    if (statusEl) statusEl.textContent = lang === 'hi' ? 'ऑनलाइन' : 'Online';
}

function updateChatInterfaceLanguage() {
    const lang = chatLanguage || 'en';
    const input = document.getElementById('chatInput');
    if (input) {
        input.placeholder = lang === 'hi'
            ? 'शिक्षा डेटा, सांख्यिकी या पहल के बारे में पूछें...'
            : 'Ask about education data, statistics, or initiatives...';
    }
    // Update quick query button labels
    document.querySelectorAll('.quick-query-btn span[data-en]').forEach(span => {
        span.textContent = span.getAttribute(lang === 'hi' ? 'data-hi' : 'data-en') || span.textContent;
    });
}

// ===== Chat Widget Init Override =====
const _origInit = window.initializeChatWidget;

window.initializeChatWidget = function() {
    if (_origInit) _origInit();

    // Language selection button handlers
    document.querySelectorAll('.lang-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => selectChatLanguage(btn.dataset.lang));
    });

    // Language switch button in header
    const langSwitch = document.getElementById('chatLangSwitch');
    if (langSwitch) {
        langSwitch.addEventListener('click', () => {
            hasSelectedLanguage = false;
            chatLanguage = null;
            localStorage.removeItem('chatLang');
            showLanguageSelect();
        });
    }

    // Open chat from AI Assistant section
    const openFromSection = document.getElementById('openChatFromSection');
    if (openFromSection) {
        openFromSection.addEventListener('click', () => {
            const widget = document.getElementById('chatWidget');
            const chatInput = document.getElementById('chatInput');
            if (widget) {
                widget.classList.add('active');
                widget.setAttribute('aria-hidden', 'false');
            }
            if (hasSelectedLanguage) {
                showChatInterface();
                if (chatInput) setTimeout(() => chatInput.focus(), 300);
            } else {
                showLanguageSelect();
            }
        });
    }

    // On chat FAB click — show language select if not yet chosen
    const chatFab = document.getElementById('chatFabButton');
    if (chatFab) {
        const origClick = chatFab.onclick;
        chatFab.addEventListener('click', () => {
            setTimeout(() => {
                if (hasSelectedLanguage) {
                    showChatInterface();
                } else {
                    showLanguageSelect();
                }
            }, 50);
        });
    }

    // If language was previously selected, restore chat interface
    if (hasSelectedLanguage && chatLanguage) {
        // Will be shown when chat opens
    }

    // Override sendChatMessage to include chosen language
    window.sendChatMessage = async function() {
        const chatInput = document.getElementById('chatInput');
        const chatMessages = document.getElementById('chatMessages');
        const chatSendBtn = document.getElementById('chatSendBtn');
        if (!chatInput || !chatMessages) return;

        const message = chatInput.value.trim();
        if (!message) return;

        chatInput.disabled = true;
        if (chatSendBtn) chatSendBtn.disabled = true;

        addChatMessage(message, 'user');
        chatInput.value = '';

        const typingIndicator = addTypingIndicator();

        try {
            const response = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: message, language: chatLanguage || 'en' })
            });
            if (!response.ok) throw new Error('Failed to get response');
            const data = await response.json();
            typingIndicator.remove();
            addChatMessage(data.answer, 'bot');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (error) {
            console.error('Chat error:', error);
            typingIndicator.remove();
            const errMsg = chatLanguage === 'hi'
                ? 'क्षमा करें, एक त्रुटि हुई। कृपया पुनः प्रयास करें।'
                : 'Sorry, I encountered an error. Please try again.';
            addChatMessage(errMsg, 'bot');
        } finally {
            chatInput.disabled = false;
            if (chatSendBtn) chatSendBtn.disabled = false;
            chatInput.focus();
        }
    };

    // Quick query buttons — use language-appropriate query
    document.querySelectorAll('.quick-query-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const q = (chatLanguage === 'hi' ? btn.dataset.queryHi : btn.dataset.query) || btn.dataset.query;
            const chatInput = document.getElementById('chatInput');
            if (chatInput) { chatInput.value = q; sendChatMessage(); }
        });
    });
};

// ===== Enhanced message rendering =====
window.addChatMessage = function(message, type = 'bot') {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}-message`;
    messageDiv.style.animation = 'msgSlideIn 0.35s ease-out';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = type === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';

    const content = document.createElement('div');
    content.className = 'message-content enhanced-message';

    if (type === 'bot') {
        content.innerHTML = enhanceChatResponse(message);
    } else {
        const p = document.createElement('p');
        p.textContent = message;
        content.appendChild(p);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
};

function enhanceChatResponse(rawText) {
    let html = rawText;
    const hasHtmlTable = /<table[\s>]/i.test(html);

    if (!hasHtmlTable && typeof marked !== 'undefined' && marked.parse) {
        try {
            marked.setOptions({ breaks: true, gfm: true, headerIds: false, mangle: false });
            html = marked.parse(html);
        } catch (e) { /* fallback */ }
    } else if (hasHtmlTable) {
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\n\n/g, '<br><br>');
        html = html.replace(/\n(?!<)/g, '<br>');
        html = html.replace(/<br>\s*<table/g, '<table');
        html = html.replace(/<\/table>\s*<br>/g, '</table>');
    }

    return `<div class="enhanced-response">${html}</div>`;
}

// ===== Theme System =====
function initializeThemeSystem() {
    const savedTheme = localStorage.getItem('govTheme') || 'nic-blue';
    applyGovTheme(savedTheme);

    // Theme picker toggle
    const trigger = document.querySelector('.theme-trigger');
    const dropdown = document.getElementById('themeDropdown');
    if (trigger && dropdown) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });
        document.addEventListener('click', () => dropdown.classList.remove('open'));
    }

    // Theme option buttons
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            applyGovTheme(theme);
            localStorage.setItem('govTheme', theme);
            document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('themeDropdown')?.classList.remove('open');
        });
    });

    // Dark mode toggle
    const darkToggle = document.getElementById('themeToggle');
    const savedDark = localStorage.getItem('darkMode') === 'true';
    if (savedDark) document.body.classList.add('dark-mode');
    updateDarkIcon(savedDark);

    if (darkToggle) {
        darkToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', isDark);
            updateDarkIcon(isDark);
        });
    }
}

function updateDarkIcon(isDark) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

function applyGovTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    const mark = document.querySelector('.theme-option.active');
    document.querySelectorAll('.theme-option').forEach(b => {
        b.classList.toggle('active', b.dataset.theme === theme);
    });
}

// ===== Search Modal =====
function initializeSearchSystem() {
    const btn = document.querySelector('.search-btn');
    if (!btn) return;

    // Create modal if not exists
    if (!document.getElementById('searchOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'searchOverlay';
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-panel search-panel" role="dialog" aria-label="Search Dashboard">
                <div class="modal-panel-header">
                    <h3><i class="fas fa-search"></i> Search Dashboard</h3>
                    <button class="modal-panel-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-panel-body">
                    <input type="text" id="searchModalInput" class="modal-search-input"
                        placeholder="Search schools, teachers, APAAR, states, initiatives..."
                        autocomplete="off" autofocus>
                    <div id="searchModalResults" class="modal-search-results">
                        <p class="search-placeholder"><i class="fas fa-search"></i> Type to search across all newsletter data</p>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        overlay.querySelector('.modal-panel-close').addEventListener('click', () => overlay.classList.remove('active'));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });

        const searchInput = document.getElementById('searchModalInput');
        let debounce;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => performDashboardSearch(searchInput.value), 250);
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') overlay.classList.remove('active');
        });
    }

    btn.addEventListener('click', () => {
        const overlay = document.getElementById('searchOverlay');
        overlay.classList.add('active');
        setTimeout(() => document.getElementById('searchModalInput')?.focus(), 200);
    });

    // Ctrl+K shortcut
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchOverlay')?.classList.add('active');
            setTimeout(() => document.getElementById('searchModalInput')?.focus(), 200);
        }
    });
}

function performDashboardSearch(query) {
    const container = document.getElementById('searchModalResults');
    if (!container) return;
    if (!query || query.length < 2) {
        container.innerHTML = '<p class="search-placeholder"><i class="fas fa-search"></i> Type to search across all newsletter data</p>';
        return;
    }

    const q = query.toLowerCase();
    const results = [];

    // Search metric cards
    document.querySelectorAll('.metric-card').forEach(card => {
        const label = card.querySelector('.metric-label')?.textContent || '';
        const value = card.querySelector('.metric-value')?.textContent || '';
        if (label.toLowerCase().includes(q) || value.toLowerCase().includes(q)) {
            results.push({ icon: 'fa-chart-bar', title: label, value, el: card });
        }
    });

    // Search sections
    document.querySelectorAll('section').forEach(sec => {
        const h = sec.querySelector('h2');
        if (h && h.textContent.toLowerCase().includes(q)) {
            results.push({ icon: 'fa-layer-group', title: h.textContent.trim(), value: '', el: sec });
        }
    });

    // Search newsletter data keywords
    const dataKeywords = [
        { term: 'apaar', title: 'APAAR ID Statistics', value: '235M registrations', section: '#analytics' },
        { term: 'attendance', title: 'Attendance Analytics', value: '96.8% national avg', section: '#analytics' },
        { term: 'school', title: 'School Infrastructure', value: '948,000 schools', section: '#analytics' },
        { term: 'teacher', title: 'Teacher Data', value: '4.37M teachers', section: '#analytics' },
        { term: 'student', title: 'Student Enrollment', value: '112.5M students', section: '#analytics' },
        { term: 'kerala', title: 'Kerala Performance', value: '98.4% attendance', section: '#analytics' },
        { term: 'gujarat', title: 'Gujarat Performance', value: '96.2% attendance', section: '#analytics' },
        { term: 'nep', title: 'NEP 2020 Implementation', value: 'Policy milestones', section: '#analytics' },
        { term: 'digital', title: 'Digital Infrastructure', value: '87.3% readiness', section: '#analytics' },
    ];
    dataKeywords.forEach(kw => {
        if (kw.term.includes(q) || q.includes(kw.term)) {
            results.push({ icon: 'fa-database', title: kw.title, value: kw.value, section: kw.section });
        }
    });

    if (results.length === 0) {
        container.innerHTML = `<p class="search-placeholder"><i class="fas fa-exclamation-circle"></i> No results for "<strong>${query}</strong>"</p>`;
        return;
    }

    container.innerHTML = results.map((r, i) => `
        <div class="search-result-row" data-idx="${i}">
            <div class="search-result-icon"><i class="fas ${r.icon}"></i></div>
            <div class="search-result-info">
                <strong>${r.title}</strong>
                ${r.value ? `<span>${r.value}</span>` : ''}
            </div>
            <i class="fas fa-arrow-right search-result-arrow"></i>
        </div>
    `).join('');

    container.querySelectorAll('.search-result-row').forEach((row, i) => {
        row.addEventListener('click', () => {
            document.getElementById('searchOverlay')?.classList.remove('active');
            const r = results[i];
            const target = r.el || document.querySelector(r.section);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                target.style.outline = '3px solid var(--gov-orange)';
                target.style.outlineOffset = '4px';
                setTimeout(() => { target.style.outline = ''; target.style.outlineOffset = ''; }, 2500);
            }
        });
    });
}

// ===== Help Modal =====
function initializeHelpSystem() {
    const btn = document.querySelector('.help-btn');
    if (!btn) return;

    if (!document.getElementById('helpOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'helpOverlay';
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-panel help-panel" role="dialog" aria-label="Help">
                <div class="modal-panel-header">
                    <h3><i class="fas fa-question-circle"></i> Help & Documentation</h3>
                    <button class="modal-panel-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-panel-body help-body">
                    <div class="help-section-card">
                        <h4><i class="fas fa-info-circle"></i> About This Dashboard</h4>
                        <p>The Vidya Samiksha Kendra (VSK) National Education Dashboard provides insights into India's school education system from <strong>April 2025 to January 2026</strong>. It covers 948,000+ schools across 36 states and UTs.</p>
                    </div>
                    <div class="help-section-card">
                        <h4><i class="fas fa-palette"></i> Theme Layouts</h4>
                        <p>Choose from <strong>4 government-themed layouts</strong> using the palette icon in the top bar: NIC Blue, India Saffron, Digital India Green, and Parliament Maroon. Toggle dark mode with the moon/sun icon.</p>
                    </div>
                    <div class="help-section-card">
                        <h4><i class="fas fa-robot"></i> AI Assistant</h4>
                        <p>Click the <strong>floating chat icon</strong> or the "AI Assistant" tab. Choose English or Hindi. Ask about APAAR IDs, attendance, state performance, technical developments, or KPIs.</p>
                    </div>
                    <div class="help-section-card">
                        <h4><i class="fas fa-search"></i> Search</h4>
                        <p>Click the search icon or press <strong>Ctrl + K</strong> to search across all dashboard data including schools, states, metrics, and initiatives.</p>
                    </div>
                    <div class="help-section-card">
                        <h4><i class="fas fa-chart-line"></i> Charts & Visualizations</h4>
                        <p>Interactive Chart.js visualizations show APAAR growth, attendance trends, enrollment, infrastructure expansion, and state-wise performance comparisons.</p>
                    </div>
                    <div class="help-section-card">
                        <h4><i class="fas fa-keyboard"></i> Keyboard Shortcuts</h4>
                        <ul>
                            <li><strong>Ctrl + K</strong> — Open Search</li>
                            <li><strong>Escape</strong> — Close modals</li>
                            <li><strong>Tab</strong> — Navigate elements</li>
                        </ul>
                    </div>
                    <div class="help-section-card">
                        <h4><i class="fas fa-phone-alt"></i> Contact Support</h4>
                        <p><strong>Email:</strong> vsk@education.gov.in<br>
                        <strong>Phone:</strong> +91-11-23382698<br>
                        <strong>Helpline:</strong> 1800-11-4831 (Toll-Free)</p>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('.modal-panel-close').addEventListener('click', () => overlay.classList.remove('active'));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });
    }

    btn.addEventListener('click', () => document.getElementById('helpOverlay')?.classList.add('active'));
}

// ===== Navigation Buttons =====
function initializeNavButtons() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const href = link.getAttribute('href');
            if (href === '#ai-chat') {
                // Open the chat widget
                const widget = document.getElementById('chatWidget');
                if (widget) {
                    widget.classList.add('active');
                    widget.setAttribute('aria-hidden', 'false');
                    if (hasSelectedLanguage) showChatInterface();
                    else showLanguageSelect();
                }
                // Also scroll to the AI section
                const sec = document.getElementById('ai-chat');
                if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (href === '#home') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const target = document.querySelector(href);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// ===== Escape key for all modals =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('searchOverlay')?.classList.remove('active');
        document.getElementById('helpOverlay')?.classList.remove('active');
    }
});

// ===== Enhanced month-wise filtering =====
window.filterByTimePeriod = function(period) {
    const metricCards = document.querySelectorAll('.metric-card');
    const metricsHeader = document.querySelector('.metrics-period span');
    const monthData = {
        'all': { period: 'As of January 2026', schools: '948,000', teachers: '4.37M', students: '112.5M', apaar: '235M', attendance: '96.8%', digital: '87.3%' },
        'april-2025': { period: 'As of April 2025', schools: '915,000', teachers: '4.23M', students: '106.7M', apaar: '120M', attendance: '95.8%', digital: '74.8%' },
        'january-2026': { period: 'As of January 2026', schools: '948,000', teachers: '4.37M', students: '112.5M', apaar: '235M', attendance: '96.8%', digital: '87.3%' }
    };
    const data = monthData[period] || monthData['all'];
    if (metricsHeader) metricsHeader.textContent = data.period;
    const setVal = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };
    setVal('.schools-card .metric-value', data.schools);
    setVal('.teachers-card .metric-value', data.teachers);
    setVal('.students-card .metric-value', data.students);
    setVal('.apaar-card .metric-value', data.apaar);
    setVal('.attendance-card .metric-value', data.attendance);
    setVal('.digital-card .metric-value', data.digital);
    metricCards.forEach((card, i) => {
        card.style.animation = 'none';
        setTimeout(() => { card.style.animation = 'fadeInUp 0.5s ease-out'; }, i * 60);
    });
};

// ===== Master Init =====
document.addEventListener('DOMContentLoaded', () => {
    initializeThemeSystem();
    initializeSearchSystem();
    initializeHelpSystem();
    initializeNavButtons();
});
