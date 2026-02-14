// API Configuration
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000'
  : window.location.origin;

// Global State
let newsletterData = null;
let currentMonthIndex = 0;
let charts = {};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
    await loadNewsletterData();
    if (newsletterData) {
        loadDirectorMessage();
        loadHighlightsSummary();
        initializeCalendar();
        loadAnalytics();
        loadTechnicalDevelopments();
        loadKPIs();
        initializeChatbot();
        initializeScrollAnimations();
        initializeCounterAnimations();
        initializeEnhancedUI();
        initializeMetricCards();
        initializeAccessibility();
    }
});

// Load Newsletter Data
async function loadNewsletterData() {
    try {
        const response = await fetch(`${API_BASE}/api/analytics/full-data`);
        if (!response.ok) throw new Error('Failed to load data');
        newsletterData = await response.json();
    } catch (error) {
        console.error('Error loading newsletter data:', error);
        // Fallback: Show error message
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h2>Unable to load newsletter data</h2>
                <p>The backend service may be unavailable. Please try again later.</p>
            </div>
        `;
    }
}

// Load Director's Message
function loadDirectorMessage() {
    const message = newsletterData.director_message;
    document.getElementById('directorName').textContent = message.name;
    document.getElementById('directorPosition').textContent = message.position;
    document.getElementById('directorMessage').textContent = message.message;
}

// Load Highlights Summary
function loadHighlightsSummary() {
    const months = newsletterData.months;
    const latestMonth = months[months.length - 1];

    const highlights = [
        {
            value: latestMonth.schools.toLocaleString(),
            label: 'Total Schools'
        },
        {
            value: (latestMonth.teachers / 1000000).toFixed(2) + 'M',
            label: 'Teachers'
        },
        {
            value: (latestMonth.students / 1000000).toFixed(1) + 'M',
            label: 'Students'
        },
        {
            value: (latestMonth.apaar_ids / 1000000).toFixed(0) + 'M',
            label: 'APAAR IDs Generated'
        },
        {
            value: latestMonth.attendance_rate + '%',
            label: 'Attendance Rate'
        },
        {
            value: newsletterData.key_performance_indicators.overall_growth.apaar_adoption,
            label: 'APAAR Adoption'
        }
    ];

    const container = document.getElementById('highlightsSummary');
    container.innerHTML = highlights.map(h => `
        <div class="highlight-card">
            <h4>${h.value}</h4>
            <p>${h.label}</p>
        </div>
    `).join('');
}

// Calendar Navigation
function initializeCalendar() {
    currentMonthIndex = newsletterData.months.length - 1; // Start with latest month
    displayMonth(currentMonthIndex);

    document.getElementById('prevMonth').addEventListener('click', () => {
        if (currentMonthIndex > 0) {
            currentMonthIndex--;
            displayMonth(currentMonthIndex);
        }
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        if (currentMonthIndex < newsletterData.months.length - 1) {
            currentMonthIndex++;
            displayMonth(currentMonthIndex);
        }
    });
}

function displayMonth(index) {
    const month = newsletterData.months[index];

    // Update month title
    document.getElementById('currentMonth').textContent = month.month;

    // Update stats
    document.getElementById('monthSchools').textContent = month.schools.toLocaleString();
    document.getElementById('monthTeachers').textContent = (month.teachers / 1000000).toFixed(2) + 'M';
    document.getElementById('monthStudents').textContent = (month.students / 1000000).toFixed(1) + 'M';
    document.getElementById('monthApaar').textContent = (month.apaar_ids / 1000000).toFixed(0) + 'M';
    document.getElementById('monthAttendance').textContent = month.attendance_rate + '%';

    // Update highlights
    const highlightsList = document.getElementById('monthHighlightsList');
    highlightsList.innerHTML = month.highlights.map(h => `<li>${h}</li>`).join('');

    // Update activities
    const activitiesList = document.getElementById('monthActivitiesList');
    activitiesList.innerHTML = month.activities.map(a => `<li>${a}</li>`).join('');

    // Update events
    const eventsList = document.getElementById('monthEventsList');
    eventsList.innerHTML = month.events.map(e => `
        <div class="event-card">
            <h5>${e.name}</h5>
            <div class="event-date">📅 ${e.date}</div>
            <div class="event-description">${e.description}</div>
            <div class="event-participants">👥 ${e.participants.toLocaleString()} participants</div>
        </div>
    `).join('');

    // Update states table
    const statesTable = document.getElementById('monthStatesTable');
    const stateEntries = Object.entries(month.states);
    statesTable.innerHTML = `
        <div class="states-table">
            <table>
                <thead>
                    <tr>
                        <th>State/UT</th>
                        <th>Attendance Rate</th>
                        <th>APAAR Coverage</th>
                        <th>Schools</th>
                    </tr>
                </thead>
                <tbody>
                    ${stateEntries.map(([state, data]) => `
                        <tr>
                            <td><strong>${state}</strong></td>
                            <td>${data.attendance}%</td>
                            <td>${data.apaar_coverage}%</td>
                            <td>${data.schools.toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Load Analytics Charts
function loadAnalytics() {
    createAPAARChart();
    createAttendanceChart();
    createStudentsChart();
    createInfrastructureChart();
    createStatesChart();
}

function createAPAARChart() {
    const ctx = document.getElementById('apaarChart').getContext('2d');
    const data = newsletterData.technical_developments.apaar_milestones;

    charts.apaar = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.month),
            datasets: [{
                label: 'APAAR ID Registrations (Millions)',
                data: data.map(d => d.registrations / 1000000),
                borderColor: '#FF9933',
                backgroundColor: 'rgba(255, 153, 51, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Registrations (Millions)'
                    }
                }
            }
        }
    });
}

function createAttendanceChart() {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    const months = newsletterData.months;

    charts.attendance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(m => m.month),
            datasets: [{
                label: 'Attendance Rate (%)',
                data: months.map(m => m.attendance_rate),
                borderColor: '#138808',
                backgroundColor: 'rgba(19, 136, 8, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 93,
                    max: 98,
                    title: {
                        display: true,
                        text: 'Attendance Rate (%)'
                    }
                }
            }
        }
    });
}

function createStudentsChart() {
    const ctx = document.getElementById('studentsChart').getContext('2d');
    const months = newsletterData.months;

    charts.students = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months.map(m => m.month),
            datasets: [{
                label: 'Students (Millions)',
                data: months.map(m => m.students / 1000000),
                backgroundColor: '#003366',
                borderColor: '#003366',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Students (Millions)'
                    }
                }
            }
        }
    });
}

function createInfrastructureChart() {
    const ctx = document.getElementById('infrastructureChart').getContext('2d');
    const months = newsletterData.months;

    charts.infrastructure = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(m => m.month),
            datasets: [
                {
                    label: 'Schools (Thousands)',
                    data: months.map(m => m.schools / 1000),
                    borderColor: '#17a2b8',
                    backgroundColor: 'rgba(23, 162, 184, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Teachers (Millions)',
                    data: months.map(m => m.teachers / 1000000),
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Schools (Thousands)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Teachers (Millions)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function createStatesChart() {
    const ctx = document.getElementById('statesChart').getContext('2d');
    const states = newsletterData.state_engagement.top_performing_states;

    charts.states = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: states.map(s => s.name),
            datasets: [
                {
                    label: 'APAAR Coverage (%)',
                    data: states.map(s => s.apaar_coverage),
                    backgroundColor: '#FF9933'
                },
                {
                    label: 'Attendance (%)',
                    data: states.map(s => s.attendance),
                    backgroundColor: '#138808'
                },
                {
                    label: 'Digital Readiness (%)',
                    data: states.map(s => s.digital_readiness),
                    backgroundColor: '#000080'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 85,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Percentage (%)'
                    }
                }
            }
        }
    });
}

// Load Technical Developments
function loadTechnicalDevelopments() {
    const tech = newsletterData.technical_developments;

    // Dashboard features
    const featuresList = document.getElementById('dashboardFeaturesList');
    featuresList.innerHTML = tech.dashboard_features.map(f => `<li>${f}</li>`).join('');

    // Infrastructure upgrades
    const upgradesList = document.getElementById('infrastructureUpgradesList');
    upgradesList.innerHTML = tech.infrastructure_upgrades.map(u => `<li>${u}</li>`).join('');
}

// Load KPIs
function loadKPIs() {
    const kpis = newsletterData.key_performance_indicators;
    const kpiGrid = document.getElementById('kpiGrid');

    const categories = [
        {
            title: '📈 Overall Growth',
            data: kpis.overall_growth
        },
        {
            title: '🎓 Learning Outcomes',
            data: kpis.learning_outcomes
        },
        {
            title: '⚖️ Equity Indicators',
            data: kpis.equity_indicators
        }
    ];

    kpiGrid.innerHTML = categories.map(cat => `
        <div class="kpi-category">
            <h4>${cat.title}</h4>
            ${Object.entries(cat.data).map(([key, value]) => `
                <div class="kpi-item">
                    <div class="kpi-label">${formatKPILabel(key)}</div>
                    <div class="kpi-value">${value}</div>
                </div>
            `).join('')}
        </div>
    `).join('');
}

function formatKPILabel(key) {
    return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Initialize Chatbot
function initializeChatbot() {
    const submitBtn = document.getElementById('chatSubmit');
    const queryInput = document.getElementById('chatQuery');

    submitBtn.addEventListener('click', () => askQuestion());
    queryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            askQuestion();
        }
    });

    // Example queries
    document.querySelectorAll('.example-query').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const query = e.target.dataset.query;
            queryInput.value = query;
            askQuestion();
        });
    });
}

// Enhance HTML tables with interactive features
function enhanceInteractiveTables(container) {
    const tables = container.querySelectorAll('table');

    tables.forEach(table => {
        // Add smooth scroll for wide tables
        table.style.overflowX = 'auto';
        table.style.display = 'block';
        table.style.maxWidth = '100%';

        // Add row click animation
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach((row, index) => {
            // Stagger animation on load
            row.style.opacity = '0';
            row.style.transform = 'translateY(10px)';

            setTimeout(() => {
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, index * 50);

            // Add click effect
            row.addEventListener('click', function() {
                // Remove previous highlights
                rows.forEach(r => r.style.outline = 'none');

                // Highlight clicked row
                this.style.outline = '2px solid #FF6600';
                this.style.outlineOffset = '-2px';

                // Add ripple effect
                const ripple = document.createElement('div');
                ripple.style.position = 'absolute';
                ripple.style.borderRadius = '50%';
                ripple.style.background = 'rgba(0, 61, 130, 0.3)';
                ripple.style.width = '20px';
                ripple.style.height = '20px';
                ripple.style.animation = 'ripple 0.6s ease-out';
                ripple.style.pointerEvents = 'none';

                this.style.position = 'relative';
                this.appendChild(ripple);

                setTimeout(() => ripple.remove(), 600);
            });

            // Add double-click to copy row data
            row.addEventListener('dblclick', function() {
                const cells = Array.from(this.querySelectorAll('td'));
                const rowData = cells.map(cell => cell.textContent.trim()).join('\t');

                navigator.clipboard.writeText(rowData).then(() => {
                    showCopyNotification('Row data copied!');
                }).catch(err => {
                    console.error('Failed to copy:', err);
                });
            });
        });

        // Add column sorting (optional)
        const headers = table.querySelectorAll('thead th');
        headers.forEach((header, colIndex) => {
            header.style.cursor = 'pointer';
            header.title = 'Click to sort';

            header.addEventListener('click', function() {
                sortTableByColumn(table, colIndex);
            });
        });

        // Add hover tooltips for cells with truncated content
        const cells = table.querySelectorAll('td, th');
        cells.forEach(cell => {
            if (cell.scrollWidth > cell.clientWidth) {
                cell.title = cell.textContent.trim();
            }
        });
    });
}

// Sort table by column
function sortTableByColumn(table, colIndex) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    // Determine sort direction
    const header = table.querySelectorAll('thead th')[colIndex];
    const isAscending = header.dataset.sortOrder !== 'asc';
    header.dataset.sortOrder = isAscending ? 'asc' : 'desc';

    // Sort rows
    rows.sort((a, b) => {
        const aValue = a.querySelectorAll('td')[colIndex].textContent.trim();
        const bValue = b.querySelectorAll('td')[colIndex].textContent.trim();

        // Try numeric comparison first
        const aNum = parseFloat(aValue.replace(/[^0-9.-]/g, ''));
        const bNum = parseFloat(bValue.replace(/[^0-9.-]/g, ''));

        if (!isNaN(aNum) && !isNaN(bNum)) {
            return isAscending ? aNum - bNum : bNum - aNum;
        }

        // Fallback to string comparison
        return isAscending ?
            aValue.localeCompare(bValue) :
            bValue.localeCompare(aValue);
    });

    // Re-append sorted rows
    rows.forEach(row => tbody.appendChild(row));

    // Update sort indicators
    table.querySelectorAll('thead th').forEach(th => {
        th.style.position = 'relative';
        const indicator = th.querySelector('.sort-indicator');
        if (indicator) indicator.remove();
    });

    const indicator = document.createElement('span');
    indicator.className = 'sort-indicator';
    indicator.textContent = isAscending ? ' ▲' : ' ▼';
    indicator.style.marginLeft = '5px';
    indicator.style.fontSize = '0.8em';
    indicator.style.color = '#FF6600';
    header.appendChild(indicator);
}

// Show copy notification
function showCopyNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.background = '#28a745';
    notification.style.color = 'white';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '6px';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    notification.style.zIndex = '10000';
    notification.style.animation = 'slideInUp 0.3s ease-out';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutDown 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Add CSS animations for interactive features
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        0% {
            width: 20px;
            height: 20px;
            opacity: 0.5;
        }
        100% {
            width: 200px;
            height: 200px;
            opacity: 0;
        }
    }

    @keyframes slideInUp {
        from {
            transform: translateY(100px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    @keyframes slideOutDown {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(100px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

async function askQuestion() {
    const query = document.getElementById('chatQuery').value.trim();
    if (!query) return;

    const answerElement = document.getElementById('chatAnswer');
    const sourcesElement = document.getElementById('chatSources');
    const modeElement = document.getElementById('responseMode');

    answerElement.textContent = 'Analyzing your question...';
    sourcesElement.textContent = '';
    modeElement.textContent = '';

    try {
        const response = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) throw new Error('Failed to get response');

        const data = await response.json();

        // CRITICAL FIX: Render answer with Markdown support for tables
        // Check if marked.js is loaded
        if (typeof marked !== 'undefined' && marked.parse) {
            // Configure marked for GitHub Flavored Markdown (tables)
            marked.setOptions({
                breaks: true,
                gfm: true,              // Enable GitHub Flavored Markdown
                tables: true,           // Enable table parsing
                headerIds: false,
                mangle: false,
                sanitize: false         // Allow HTML in markdown
            });

            try {
                // Parse markdown to HTML
                const htmlContent = marked.parse(data.answer);
                answerElement.innerHTML = htmlContent;

                // Override white-space to allow proper HTML rendering
                answerElement.style.whiteSpace = 'normal';
                answerElement.style.overflowX = 'auto';

                // Enhance HTML tables with interactive features
                enhanceInteractiveTables(answerElement);

                console.log('Markdown parsed successfully with tables');
            } catch (error) {
                console.error('Markdown parsing error:', error);
                // Fallback to plain text
                answerElement.textContent = data.answer;
            }
        } else {
            console.warn('Marked.js not loaded - tables will not render properly');
            // Fallback to plain text
            answerElement.textContent = data.answer;
        }

        modeElement.textContent = data.mode.toUpperCase();

        if (data.sources && data.sources.length > 0) {
            sourcesElement.textContent = `Sources: ${data.sources.join(', ')}`;
        } else {
            sourcesElement.textContent = 'Sources: Newsletter data from April 2025 - January 2026';
        }
    } catch (error) {
        console.error('Error asking question:', error);
        answerElement.textContent = 'Unable to process your question at this time. Please try again.';
        sourcesElement.textContent = '❌ Error: Backend service unavailable';
        modeElement.textContent = 'ERROR';
        modeElement.style.background = '#dc3545';
    }
}

// Utility function to format numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Scroll-based Animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Trigger counter animation if element has counter
                if (entry.target.classList.contains('stat-value')) {
                    animateCounter(entry.target);
                }
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('animate-on-scroll');
        observer.observe(section);
    });

    // Observe cards
    document.querySelectorAll('.highlight-card, .stat-card, .event-card, .tech-card, .kpi-category').forEach(card => {
        card.classList.add('animate-on-scroll');
        observer.observe(card);
    });
}

// Counter Animation for Statistics
function initializeCounterAnimations() {
    // Will be triggered by intersection observer
}

function animateCounter(element) {
    const text = element.textContent;
    const hasM = text.includes('M');
    const hasK = text.includes('K');
    const hasPercent = text.includes('%');

    // Extract number
    let targetNum = parseFloat(text.replace(/[^\d.]/g, ''));
    if (isNaN(targetNum)) return;

    let currentNum = 0;
    const increment = targetNum / 50; // 50 frames
    const duration = 1000; // 1 second
    const frameTime = duration / 50;

    element.classList.add('counting');

    const counter = setInterval(() => {
        currentNum += increment;
        if (currentNum >= targetNum) {
            currentNum = targetNum;
            clearInterval(counter);
            element.classList.remove('counting');
        }

        let displayValue = currentNum.toFixed(hasM || hasK ? 1 : 0);
        if (hasM) displayValue += 'M';
        if (hasK) displayValue += 'K';
        if (hasPercent) displayValue += '%';

        element.textContent = displayValue;
    }, frameTime);
}

// Add ripple effect to buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('ripple') || e.target.closest('.ripple')) {
        const button = e.target.classList.contains('ripple') ? e.target : e.target.closest('.ripple');
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple-effect');

        button.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }
});

// Add glow effect to active elements
function addGlowToActiveElements() {
    const currentMonthElement = document.getElementById('currentMonth');
    if (currentMonthElement) {
        currentMonthElement.parentElement.classList.add('glow');
    }
}

// Enhance chart animations
function enhanceChartAnimations() {
    document.querySelectorAll('.chart-container').forEach(container => {
        container.classList.add('chart-animate');
    });
}

// ========== ENHANCED UI FUNCTIONALITY ==========

// Initialize Enhanced UI Features
function initializeEnhancedUI() {
    initializeThemeToggle();
    initializeLanguageToggle();
    initializeFeedbackModal();
    initializeExportButtons();
    initializeNavigationHighlight();
    initializeSearchFunctionality();
}

// Theme Toggle (Dark/Light Mode)
function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';

    document.body.classList.toggle('dark-mode', savedTheme === 'dark');
    updateThemeIcon(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            const newTheme = isDark ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
            
            // Announce to screen readers
            announceToScreenReader(`Switched to ${newTheme} mode`);
        });
    }
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Language Toggle
function initializeLanguageToggle() {
    const langButtons = document.querySelectorAll('.lang-btn');

    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const lang = btn.dataset.lang;

            // Use translation system
            if (typeof switchLanguage === 'function') {
                switchLanguage(lang);
            } else {
                document.documentElement.lang = lang;
                announceToScreenReader(`Language changed to ${lang === 'en' ? 'English' : 'Hindi'}`);
            }
        });
    });
}

// Feedback Modal
function initializeFeedbackModal() {
    const feedbackBtn = document.getElementById('feedbackButton');
    const modal = document.getElementById('feedbackModal');
    const closeBtn = modal?.querySelector('.modal-close');
    const form = document.getElementById('feedbackForm');

    if (feedbackBtn && modal) {
        feedbackBtn.addEventListener('click', () => {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
        });

        closeBtn?.addEventListener('click', () => {
            closeFeedbackModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeFeedbackModal();
            }
        });

        form?.addEventListener('submit', handleFeedbackSubmit);
    }
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
}

function handleFeedbackSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('feedbackName').value,
        email: document.getElementById('feedbackEmail').value,
        type: document.getElementById('feedbackType').value,
        message: document.getElementById('feedbackMessage').value
    };

    // Here you would send feedback to backend
    console.log('Feedback submitted:', formData);
    
    showNotification('Thank you for your feedback!', 'success');
    closeFeedbackModal();
    e.target.reset();
}

// Export Buttons
function initializeExportButtons() {
    document.getElementById('exportCSV')?.addEventListener('click', () => exportData('csv'));
    document.getElementById('exportExcel')?.addEventListener('click', () => exportData('excel'));
    document.getElementById('exportPDF')?.addEventListener('click', () => exportData('pdf'));
}

function exportData(format) {
    if (!newsletterData) {
        showNotification('No data available to export', 'error');
        return;
    }

    switch(format) {
        case 'csv':
            exportToCSV();
            break;
        case 'excel':
            exportToExcel();
            break;
        case 'pdf':
            exportToPDF();
            break;
    }
}

function exportToCSV() {
    const data = newsletterData.monthly_data;
    let csv = 'Month,Schools,Teachers,Students,APAAR IDs,Attendance\n';
    
    data.forEach(month => {
        csv += `${month.month},${month.schools},${month.teachers},${month.students},${month.apaar_ids},${month.attendance_rate}\n`;
    });

    downloadFile(csv, 'newsletter-data.csv', 'text/csv');
    showNotification('CSV exported successfully!', 'success');
}

function exportToExcel() {
    // Simplified Excel export (would need library like SheetJS for full functionality)
    exportToCSV(); // Fallback to CSV
    showNotification('Excel export functionality coming soon!', 'info');
}

function exportToPDF() {
    showNotification('PDF export functionality coming soon!', 'info');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Navigation Highlight
function initializeNavigationHighlight() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const target = link.getAttribute('href').substring(1);
            scrollToSection(target);
        });
    });
}

function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Search Functionality
function initializeSearchFunctionality() {
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = prompt('Search the dashboard:');
            if (query) {
                performSearch(query);
            }
        });
    }
}

function performSearch(query) {
    // Simplified search - would be enhanced with proper search implementation
    console.log('Searching for:', query);
    showNotification(`Searching for "${query}"...`, 'info');
}

// Initialize Metric Cards with Mini Charts
function initializeMetricCards() {
    if (!newsletterData) return;

    const monthlyData = newsletterData.monthly_data;
    
    // Create mini sparkline charts
    createMiniChart('schoolsTrend', monthlyData.map(m => m.schools), '#FF6600');
    createMiniChart('teachersTrend', monthlyData.map(m => m.teachers), '#28a745');
    createMiniChart('studentsTrend', monthlyData.map(m => m.students), '#003d82');
    createMiniChart('apaarTrend', monthlyData.map(m => m.apaar_ids), '#ffc107');
    createMiniChart('attendanceTrend', monthlyData.map(m => parseFloat(m.attendance_rate)), '#17a2b8');
}

function createMiniChart(canvasId, data, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(data.length).fill(''),
            datasets: [{
                data: data,
                borderColor: color,
                backgroundColor: `${color}33`,
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });
}

// Initialize Accessibility Features
function initializeAccessibility() {
    initializeAccessibilityPanel();
    initializeFontSizeControl();
    initializeHighContrast();
    initializeKeyboardNavigation();
}

function initializeAccessibilityPanel() {
    const accessibilityToggle = document.getElementById('accessibilityToggle');
    const panel = document.getElementById('accessibilityPanel');
    const closeBtn = panel?.querySelector('.panel-close');

    if (accessibilityToggle && panel) {
        accessibilityToggle.addEventListener('click', () => {
            const isActive = panel.classList.toggle('active');
            panel.setAttribute('aria-hidden', !isActive);
        });

        closeBtn?.addEventListener('click', () => {
            panel.classList.remove('active');
            panel.setAttribute('aria-hidden', 'true');
        });
    }

    // Font Size Slider
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSizeValue = document.getElementById('fontSizeValue');

    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', (e) => {
            const size = e.target.value;
            document.body.style.fontSize = `${size}px`;
            fontSizeValue.textContent = `${size}px`;
            localStorage.setItem('fontSize', size);
        });

        // Load saved font size
        const savedSize = localStorage.getItem('fontSize') || 16;
        document.body.style.fontSize = `${savedSize}px`;
        fontSizeSlider.value = savedSize;
        fontSizeValue.textContent = `${savedSize}px`;
    }

    // Line Height Slider
    const lineHeightSlider = document.getElementById('lineHeightSlider');
    const lineHeightValue = document.getElementById('lineHeightValue');

    if (lineHeightSlider) {
        lineHeightSlider.addEventListener('input', (e) => {
            const height = e.target.value;
            document.body.style.lineHeight = height;
            lineHeightValue.textContent = height;
            localStorage.setItem('lineHeight', height);
        });

        // Load saved line height
        const savedHeight = localStorage.getItem('lineHeight') || 1.6;
        document.body.style.lineHeight = savedHeight;
        lineHeightSlider.value = savedHeight;
        lineHeightValue.textContent = savedHeight;
    }
}

function initializeFontSizeControl() {
    const fontSizeToggle = document.getElementById('fontSizeToggle');
    let currentSize = parseInt(localStorage.getItem('fontSize')) || 16;

    if (fontSizeToggle) {
        fontSizeToggle.addEventListener('click', () => {
            currentSize = currentSize >= 20 ? 14 : currentSize + 2;
            document.body.style.fontSize = `${currentSize}px`;
            localStorage.setItem('fontSize', currentSize);
            announceToScreenReader(`Font size changed to ${currentSize} pixels`);
        });
    }
}

function initializeHighContrast() {
    const highContrastBtn = document.getElementById('accessibilityToggle');
    const savedContrast = localStorage.getItem('highContrast') === 'true';

    document.body.classList.toggle('high-contrast', savedContrast);

    if (highContrastBtn) {
        highContrastBtn.addEventListener('click', () => {
            const isHighContrast = document.body.classList.toggle('high-contrast');
            localStorage.setItem('highContrast', isHighContrast);
            announceToScreenReader(`High contrast mode ${isHighContrast ? 'enabled' : 'disabled'}`);
        });
    }
}

function initializeKeyboardNavigation() {
    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeFeedbackModal();
            const accessibilityPanel = document.getElementById('accessibilityPanel');
            if (accessibilityPanel) {
                accessibilityPanel.classList.remove('active');
                accessibilityPanel.setAttribute('aria-hidden', 'true');
            }
        }
    });

    // Tab key focus management
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });

    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' :
                     type === 'error' ? 'fas fa-exclamation-circle' :
                     'fas fa-info-circle';
    
    notification.prepend(icon);
    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideInUp 0.3s ease-out;
        max-width: 400px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutDown 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Screen Reader Announcements
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
}

// Add CSS for screen reader only content
const srOnlyStyle = document.createElement('style');
srOnlyStyle.textContent = `
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0,0,0,0);
        white-space: nowrap;
        border: 0;
    }
    
    body.keyboard-navigation *:focus {
        outline: 3px solid #FF6600;
        outline-offset: 2px;
    }
`;
document.head.appendChild(srOnlyStyle);

console.log('✅ Enhanced UI features initialized');
