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

        // Render answer with Markdown support (for tables and formatting)
        if (typeof marked !== 'undefined') {
            // Configure marked for safe HTML rendering
            marked.setOptions({
                breaks: true,
                gfm: true,  // GitHub Flavored Markdown (tables, etc.)
                headerIds: false,
                mangle: false
            });
            const htmlContent = marked.parse(data.answer);
            answerElement.innerHTML = htmlContent;
            answerElement.style.whiteSpace = 'normal';
        } else {
            // Fallback to plain text if marked.js not loaded
            answerElement.textContent = data.answer;
        }

        modeElement.textContent = data.mode.toUpperCase();

        if (data.sources && data.sources.length > 0) {
            sourcesElement.textContent = `📚 Sources: ${data.sources.join(', ')}`;
        } else {
            sourcesElement.textContent = '📚 Sources: Newsletter data from April 2025 - January 2026';
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
