/**
 * Enhanced Chat Widget with Language Selection, Themes, Search, Help, Nav
 * Ministry of Education — Rashtriya Vidya Samiksha Kendra
 */

/* ================================================================
   CHAT LANGUAGE STATE
   ================================================================ */
let chatLanguage = localStorage.getItem('chatLang') || null;
let hasSelectedLanguage = !!chatLanguage;

/* ================================================================
   CHAT VIEW MANAGEMENT  (called by chat-widget.js on every open)
   ================================================================ */

/** Master function: decides whether to show language picker or chat interface.
 *  Called every time the widget opens — guarantees correct state. */
function _showCorrectChatView() {
    if (hasSelectedLanguage && chatLanguage) {
        _showChatInterface();
    } else {
        _showLanguageSelect();
    }
}

function _showLanguageSelect() {
    const sel  = document.getElementById('chatLangSelect');
    const msgs = document.getElementById('chatMessages');
    const qry  = document.getElementById('quickQueries');
    const inp  = document.getElementById('chatInputArea');
    if (sel)  { sel.style.display = 'flex';  sel.style.opacity = '1'; }
    if (msgs) { msgs.style.display = 'none'; }
    if (qry)  { qry.style.display  = 'none'; }
    if (inp)  { inp.style.display  = 'none'; }
}

function _showChatInterface() {
    const sel  = document.getElementById('chatLangSelect');
    const msgs = document.getElementById('chatMessages');
    const qry  = document.getElementById('quickQueries');
    const inp  = document.getElementById('chatInputArea');

    if (sel)  { sel.style.display = 'none';  sel.style.opacity = '1'; }
    if (msgs) { msgs.style.display = 'flex'; }
    if (qry)  { qry.style.display  = 'flex'; }
    if (inp)  { inp.style.display  = 'flex'; }

    _updateChatInterfaceLanguage();

    // If no messages yet (first open after language select), add welcome
    if (msgs && msgs.children.length === 0) {
        _addWelcomeMessage();
    }

    // Focus input after a tiny delay for the DOM to settle
    const chatInput = document.getElementById('chatInput');
    if (chatInput) setTimeout(() => chatInput.focus(), 120);
}

function _addWelcomeMessage() {
    const msg = chatLanguage === 'hi'
        ? 'नमस्ते! मैं आपका न्यूज़लेटर AI सहायक हूँ। मैं अप्रैल 2025 से जनवरी 2026 तक शिक्षा सांख्यिकी, APAAR IDs, उपस्थिति दर, राज्य प्रदर्शन और पहलों के बारे में आपके प्रश्नों में मदद कर सकता हूँ।'
        : 'Hello! I\'m your Newsletter AI Assistant. I can help you with questions about education statistics, APAAR IDs, attendance rates, state performance, and initiatives from April 2025 to January 2026.';
    if (typeof addChatMessage === 'function') addChatMessage(msg, 'bot');
}

function _selectChatLanguage(lang) {
    chatLanguage = lang;
    hasSelectedLanguage = true;
    localStorage.setItem('chatLang', lang);

    // Clear any existing messages and add fresh welcome
    const msgs = document.getElementById('chatMessages');
    if (msgs) msgs.innerHTML = '';

    _showChatInterface();

    const statusEl = document.getElementById('chatStatusText');
    if (statusEl) statusEl.textContent = lang === 'hi' ? 'ऑनलाइन' : 'Online';
}

function _updateChatInterfaceLanguage() {
    const lang = chatLanguage || 'en';
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.placeholder = lang === 'hi'
            ? 'शिक्षा डेटा, सांख्यिकी या पहल के बारे में पूछें...'
            : 'Ask about education data, statistics, or initiatives...';
    }
    document.querySelectorAll('.quick-query-btn span[data-en]').forEach(span => {
        span.textContent = span.getAttribute(lang === 'hi' ? 'data-hi' : 'data-en') || span.textContent;
    });
}

/* ================================================================
   INIT — layers on top of chat-widget.js initializeChatWidget
   ================================================================ */
const _origChatInit = window.initializeChatWidget;

window.initializeChatWidget = function() {
    if (_origChatInit) _origChatInit();

    // Language choice buttons
    document.querySelectorAll('.lang-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => _selectChatLanguage(btn.dataset.lang));
    });

    // Language switch button in chat header
    const langSwitch = document.getElementById('chatLangSwitch');
    if (langSwitch) {
        langSwitch.addEventListener('click', () => {
            hasSelectedLanguage = false;
            chatLanguage = null;
            localStorage.removeItem('chatLang');
            _showLanguageSelect();
        });
    }

    // "Start Conversation" button in the AI-Assistant section
    const openFromSection = document.getElementById('openChatFromSection');
    if (openFromSection) {
        openFromSection.addEventListener('click', () => openChatWidget());
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
            if (!response.ok) throw new Error('Failed');
            const data = await response.json();
            typingIndicator.remove();
            addChatMessage(data.answer, 'bot');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (err) {
            console.error('Chat error:', err);
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

    // Quick query buttons with language-aware queries
    document.querySelectorAll('.quick-query-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const q = (chatLanguage === 'hi' ? btn.dataset.queryHi : btn.dataset.query) || btn.dataset.query;
            const chatInput = document.getElementById('chatInput');
            if (chatInput) { chatInput.value = q; sendChatMessage(); }
        });
    });
};

/* ================================================================
   ENHANCED MESSAGE RENDERING
   ================================================================ */
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
        content.innerHTML = _enhanceBotResponse(message);
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

function _enhanceBotResponse(rawText) {
    let html = rawText;
    const hasHtmlTable = /<table[\s>]/i.test(html);
    if (!hasHtmlTable && typeof marked !== 'undefined' && marked.parse) {
        try { marked.setOptions({ breaks:true, gfm:true, headerIds:false, mangle:false }); html = marked.parse(html); } catch(e) {}
    } else if (hasHtmlTable) {
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\n\n/g, '<br><br>');
        html = html.replace(/\n(?!<)/g, '<br>');
        html = html.replace(/<br>\s*<table/g, '<table');
        html = html.replace(/<\/table>\s*<br>/g, '</table>');
    }
    return `<div class="enhanced-response">${html}</div>`;
}

/* ================================================================
   THEME SYSTEM — 4 GoI Layouts + Dark Mode
   ================================================================ */
function initializeThemeSystem() {
    const savedTheme = localStorage.getItem('govTheme') || 'nic-blue';
    document.body.setAttribute('data-theme', savedTheme);
    document.querySelectorAll('.theme-option').forEach(b =>
        b.classList.toggle('active', b.dataset.theme === savedTheme));

    const trigger = document.querySelector('.theme-trigger');
    const dropdown = document.getElementById('themeDropdown');
    if (trigger && dropdown) {
        trigger.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.toggle('open'); });
        document.addEventListener('click', () => dropdown.classList.remove('open'));
    }

    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.body.setAttribute('data-theme', btn.dataset.theme);
            localStorage.setItem('govTheme', btn.dataset.theme);
            document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            dropdown?.classList.remove('open');
        });
    });

    // Dark mode
    const darkToggle = document.getElementById('themeToggle');
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) document.body.classList.add('dark-mode');
    _updateDarkIcon(isDark);
    if (darkToggle) {
        darkToggle.addEventListener('click', () => {
            const d = document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', d);
            _updateDarkIcon(d);
        });
    }
}
function _updateDarkIcon(d) {
    const i = document.querySelector('#themeToggle i');
    if (i) i.className = d ? 'fas fa-sun' : 'fas fa-moon';
}

/* ================================================================
   SEARCH MODAL  (Ctrl+K or search button)
   ================================================================ */
function initializeSearchSystem() {
    // Build the search data index from the page and from the RVSK data
    const searchIndex = _buildSearchIndex();

    const btn = document.querySelector('.search-btn');
    if (!btn) return;

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
                        autocomplete="off">
                    <div id="searchModalResults" class="modal-search-results">
                        <p class="search-placeholder"><i class="fas fa-search"></i> Type to search across all newsletter data</p>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('.modal-panel-close').addEventListener('click', () => overlay.classList.remove('active'));
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });

        const input = document.getElementById('searchModalInput');
        let debounce;
        input.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => _performSearch(input.value, searchIndex), 200);
        });
        input.addEventListener('keydown', e => { if (e.key === 'Escape') overlay.classList.remove('active'); });
    }

    btn.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        const ov = document.getElementById('searchOverlay');
        ov.classList.add('active');
        setTimeout(() => document.getElementById('searchModalInput')?.focus(), 150);
    });

    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchOverlay')?.classList.add('active');
            setTimeout(() => document.getElementById('searchModalInput')?.focus(), 150);
        }
    });
}

function _buildSearchIndex() {
    const items = [
        // Core metrics
        { title:'Total Schools', value:'948,000 schools integrated', icon:'fa-school', section:'#home' },
        { title:'Total Teachers', value:'4.37M / 51.38 Lakh teachers linked', icon:'fa-chalkboard-teacher', section:'#home' },
        { title:'Total Students', value:'112.5M / 13.44 Crore students tracked', icon:'fa-user-graduate', section:'#home' },
        { title:'APAAR IDs', value:'235M registrations; 15.67 Crore APAAR IDs (RVSK)', icon:'fa-id-card', section:'#home' },
        { title:'Attendance Rate', value:'96.8% national average', icon:'fa-clipboard-check', section:'#home' },
        { title:'Digital Readiness', value:'87.3% schools with ICT facilities', icon:'fa-laptop', section:'#home' },
        // RVSK data
        { title:'RVSK Overview', value:'Rashtriya Vidya Samiksha Kendra — 37 operational VSKs, 35 States/UTs', icon:'fa-landmark', section:'#rvsk-section' },
        { title:'6A Framework', value:'Attendance, Assessment, Administration, Accreditation, Adaptive Learning, AI', icon:'fa-layer-group', section:'#rvsk-section' },
        { title:'13 National Programs', value:'PM SHRI, NAS, DIKSHA, NISHTHA, PM POSHAN, UDISE+, NIPUN BHARAT, APAAR...', icon:'fa-flag', section:'#rvsk-section' },
        { title:'Capacity Building Workshop', value:'August 2025 — 5 batches, 165 participants from 36 States/UTs', icon:'fa-users-cog', section:'#rvsk-section' },
        { title:'DPDP Act 2023 Compliance', value:'Data governance, security audits, consent forms, privacy-by-design', icon:'fa-shield-alt', section:'#rvsk-section' },
        { title:'APAAR for Teachers', value:'12-digit teacher ID, CPD tracking, DigiLocker credentials', icon:'fa-id-badge', section:'#rvsk-section' },
        { title:'Early Warning System', value:'Gujarat, Odisha, Telangana — 7/15/30 day absence escalation', icon:'fa-exclamation-triangle', section:'#rvsk-section' },
        // States
        { title:'Kerala Performance', value:'98.4% attendance, 98.6% APAAR coverage', icon:'fa-map-marker-alt', section:'#analytics' },
        { title:'Gujarat VSK 2.0', value:'33 District VSKs, 254 Block VSKs, AI-powered EWS', icon:'fa-map-marker-alt', section:'#rvsk-section' },
        { title:'Tamil Nadu', value:'97.4% attendance, Ennum Ezhuthum FLN tracking', icon:'fa-map-marker-alt', section:'#analytics' },
        { title:'Odisha', value:'Early Warning System with multi-level escalation', icon:'fa-map-marker-alt', section:'#rvsk-section' },
        { title:'DNH & DD', value:'NAS ranking improved from bottom 5 to top 5 nationally', icon:'fa-trophy', section:'#rvsk-section' },
        { title:'Andhra Pradesh & Telangana', value:'Facial Recognition System for attendance', icon:'fa-camera', section:'#rvsk-section' },
        { title:'Jammu & Kashmir', value:'Smart Attendance chatbot, Digital Studio', icon:'fa-map-marker-alt', section:'#rvsk-section' },
        { title:'West Bengal', value:'Heat maps for infrastructure; became 37th VSK in July 2025', icon:'fa-map-marker-alt', section:'#rvsk-section' },
        // Charts
        { title:'APAAR ID Growth Chart', value:'Line chart — April 2025 to January 2026', icon:'fa-chart-line', section:'#analytics' },
        { title:'Attendance Trend', value:'Monthly attendance rate chart', icon:'fa-chart-area', section:'#analytics' },
        { title:'Student Enrollment', value:'Enrollment growth chart', icon:'fa-chart-bar', section:'#analytics' },
        { title:'Top Performing States', value:'State-wise comparison chart', icon:'fa-trophy', section:'#analytics' },
        // Other sections
        { title:'Director\'s Message', value:'Dinesh Prasad Saklani, Director NCERT', icon:'fa-user-tie', section:'.director-message' },
        { title:'NEP 2020', value:'National Education Policy implementation milestones', icon:'fa-book', section:'#rvsk-section' },
        { title:'AI in Education', value:'AI chatbot for attendance, ethical safeguards, predictive analytics', icon:'fa-robot', section:'#rvsk-section' },
    ];
    return items;
}

function _performSearch(query, index) {
    const container = document.getElementById('searchModalResults');
    if (!container) return;
    if (!query || query.length < 2) {
        container.innerHTML = '<p class="search-placeholder"><i class="fas fa-search"></i> Type to search across all newsletter data</p>';
        return;
    }
    const q = query.toLowerCase();
    const results = index.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q)
    );

    if (results.length === 0) {
        container.innerHTML = `<p class="search-placeholder"><i class="fas fa-exclamation-circle"></i> No results for "<strong>${query}</strong>"</p>`;
        return;
    }

    container.innerHTML = results.slice(0, 12).map((r, i) => `
        <div class="search-result-row" data-section="${r.section}">
            <div class="search-result-icon"><i class="fas ${r.icon}"></i></div>
            <div class="search-result-info">
                <strong>${_highlightMatch(r.title, q)}</strong>
                <span>${_highlightMatch(r.value, q)}</span>
            </div>
            <i class="fas fa-arrow-right search-result-arrow"></i>
        </div>
    `).join('');

    container.querySelectorAll('.search-result-row').forEach(row => {
        row.addEventListener('click', () => {
            document.getElementById('searchOverlay')?.classList.remove('active');
            const sel = row.dataset.section;
            const target = document.querySelector(sel);
            if (target) {
                target.scrollIntoView({ behavior:'smooth', block:'center' });
                target.style.outline = '3px solid var(--gov-orange, #FF6600)';
                target.style.outlineOffset = '6px';
                setTimeout(() => { target.style.outline = ''; target.style.outlineOffset = ''; }, 2500);
            }
        });
    });
}

function _highlightMatch(text, query) {
    if (!query) return text;
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(re, '<mark style="background:#FFE082;padding:0 2px;border-radius:2px;">$1</mark>');
}

/* ================================================================
   HELP MODAL
   ================================================================ */
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
                    <div class="help-section-card"><h4><i class="fas fa-info-circle"></i> About RVSK Dashboard</h4><p>The Rashtriya Vidya Samiksha Kendra (RVSK) Dashboard provides comprehensive insights into India's school education system covering <strong>948,000+ schools</strong>, <strong>4.37M teachers</strong>, and <strong>112.5M students</strong> from April 2025 to January 2026.</p></div>
                    <div class="help-section-card"><h4><i class="fas fa-palette"></i> Theme Layouts</h4><p>Choose from <strong>4 government-themed layouts</strong> using the palette icon: NIC Blue, India Saffron, Digital India Green, and Parliament Maroon. Toggle dark mode separately.</p></div>
                    <div class="help-section-card"><h4><i class="fas fa-robot"></i> AI Assistant</h4><p>Click the floating chat icon or "AI Assistant" tab. Choose <strong>English or Hindi</strong>. Ask about APAAR IDs, the 6A framework, state best practices, capacity building, attendance, KPIs, or any RVSK data.</p></div>
                    <div class="help-section-card"><h4><i class="fas fa-search"></i> Search (Ctrl+K)</h4><p>Search across all dashboard data including metrics, states, RVSK programs, charts, and newsletter sections. Results highlight and scroll to the matching element.</p></div>
                    <div class="help-section-card"><h4><i class="fas fa-chart-line"></i> Charts</h4><p>Interactive Chart.js visualizations show APAAR growth, attendance trends, enrollment, infrastructure, and state-wise comparisons.</p></div>
                    <div class="help-section-card"><h4><i class="fas fa-keyboard"></i> Shortcuts</h4><ul><li><strong>Ctrl+K</strong> — Open Search</li><li><strong>Escape</strong> — Close modals</li></ul></div>
                    <div class="help-section-card"><h4><i class="fas fa-phone-alt"></i> Contact</h4><p><strong>CIET-NCERT</strong>, Sri Aurobindo Marg, New Delhi 110016<br>Tel: +91-11-2696-2580 | Email: jdciet.ncert@nic.in<br>PMeVIDYA IVRS: #8800440559</p></div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('.modal-panel-close').addEventListener('click', () => overlay.classList.remove('active'));
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });
    }

    btn.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        document.getElementById('helpOverlay')?.classList.add('active');
    });
}

/* ================================================================
   NAVIGATION BUTTONS  (Dashboard / AI Assistant)
   ================================================================ */
function initializeNavButtons() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const href = link.getAttribute('href');
            if (href === '#ai-chat') {
                openChatWidget();
                const sec = document.getElementById('ai-chat');
                if (sec) sec.scrollIntoView({ behavior:'smooth', block:'start' });
            } else if (href === '#home') {
                window.scrollTo({ top:0, behavior:'smooth' });
            } else {
                const t = document.querySelector(href);
                if (t) t.scrollIntoView({ behavior:'smooth', block:'start' });
            }
        });
    });
}

/* ================================================================
   ESCAPE KEY — close all modals
   ================================================================ */
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.getElementById('searchOverlay')?.classList.remove('active');
        document.getElementById('helpOverlay')?.classList.remove('active');
    }
});

/* ================================================================
   MASTER INIT
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
    initializeThemeSystem();
    initializeSearchSystem();
    initializeHelpSystem();
    initializeNavButtons();
});
