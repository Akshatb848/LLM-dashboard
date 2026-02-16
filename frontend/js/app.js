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
        safeCall(loadDirectorMessage, 'loadDirectorMessage');
        safeCall(loadHighlightsSummary, 'loadHighlightsSummary');
        safeCall(initializeCalendar, 'initializeCalendar');
        safeCall(loadAnalytics, 'loadAnalytics');
        safeCall(loadTechnicalDevelopments, 'loadTechnicalDevelopments');
        safeCall(loadKPIs, 'loadKPIs');
        safeCall(initializeChatbot, 'initializeChatbot');
        safeCall(initializeScrollAnimations, 'initializeScrollAnimations');
        safeCall(initializeCounterAnimations, 'initializeCounterAnimations');
        safeCall(initializeEnhancedUI, 'initializeEnhancedUI');
        safeCall(initializeMetricCards, 'initializeMetricCards');
        safeCall(initializeAccessibility, 'initializeAccessibility');
    }
});

// Safe function caller - prevents one failure from breaking the entire app
function safeCall(fn, name) {
    try {
        fn();
    } catch (e) {
        console.warn(`[VSK] ${name} initialization skipped:`, e.message);
    }
}

// Load Newsletter Data with retry logic
async function loadNewsletterData() {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(`${API_BASE}/api/analytics/full-data`, {
                signal: AbortSignal.timeout(15000)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            newsletterData = await response.json();
            console.log('[VSK] Newsletter data loaded successfully');
            return;
        } catch (error) {
            console.warn(`[VSK] Data load attempt ${attempt}/${maxRetries} failed:`, error.message);
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 2000 * attempt));
            }
        }
    }

    console.error('[VSK] All data load attempts failed');
    // Show non-destructive error banner instead of replacing entire body
    const banner = document.createElement('div');
    banner.style.cssText = 'background:#dc3545;color:white;padding:16px 24px;text-align:center;font-size:14px;position:fixed;top:0;left:0;right:0;z-index:10001;';
    banner.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Unable to load newsletter data. The backend service may be starting up. <button onclick="location.reload()" style="margin-left:16px;background:white;color:#dc3545;border:none;padding:6px 16px;border-radius:4px;cursor:pointer;font-weight:600;">Retry</button>';
    document.body.prepend(banner);
}

// Load Director's Message
function loadDirectorMessage() {
    const message = newsletterData.director_message;
    if (!message) return;

    const nameEl = document.getElementById('directorName');
    const posEl = document.getElementById('directorPosition');
    const msgEl = document.getElementById('directorMessage');

    if (nameEl) nameEl.textContent = message.name || 'Director';
    if (posEl) posEl.textContent = message.position || '';
    if (msgEl) {
        // Render message with paragraph breaks
        const paragraphs = (message.message || '').split('\n\n').filter(p => p.trim());
        msgEl.innerHTML = paragraphs.map(p => `<p style="margin-bottom:12px;">${p.trim()}</p>`).join('');
    }
}

// Load Highlights Summary
function loadHighlightsSummary() {
    const months = newsletterData.months;
    if (!months || !months.length) return;

    const latestMonth = months[months.length - 1];
    const firstMonth = months[0];

    const schoolsGrowth = latestMonth.schools - firstMonth.schools;
    const teachersGrowth = latestMonth.teachers - firstMonth.teachers;
    const studentsGrowth = latestMonth.students - firstMonth.students;
    const apaarGrowth = latestMonth.apaar_ids - firstMonth.apaar_ids;

    const highlights = [
        {
            icon: 'fas fa-school',
            value: latestMonth.schools.toLocaleString(),
            label: 'Total Schools',
            change: `+${schoolsGrowth.toLocaleString()} since Apr 2025`
        },
        {
            icon: 'fas fa-chalkboard-teacher',
            value: (latestMonth.teachers / 1000000).toFixed(2) + 'M',
            label: 'Teachers',
            change: `+${(teachersGrowth / 1000).toFixed(0)}K since Apr 2025`
        },
        {
            icon: 'fas fa-user-graduate',
            value: (latestMonth.students / 1000000).toFixed(1) + 'M',
            label: 'Students',
            change: `+${(studentsGrowth / 1000000).toFixed(1)}M since Apr 2025`
        },
        {
            icon: 'fas fa-id-card',
            value: (latestMonth.apaar_ids / 1000000).toFixed(0) + 'M',
            label: 'APAAR IDs Generated',
            change: `+${(apaarGrowth / 1000000).toFixed(0)}M since Apr 2025`
        },
        {
            icon: 'fas fa-clipboard-check',
            value: latestMonth.attendance_rate + '%',
            label: 'Attendance Rate',
            change: `+${(latestMonth.attendance_rate - firstMonth.attendance_rate).toFixed(1)}% since Apr 2025`
        },
        {
            icon: 'fas fa-chart-line',
            value: newsletterData.key_performance_indicators?.overall_growth?.apaar_adoption || '95.8%',
            label: 'APAAR Adoption',
            change: 'National coverage'
        }
    ];

    const container = document.getElementById('highlightsSummary');
    if (!container) return;
    
    container.innerHTML = highlights.map(h => `
        <div class="highlight-card">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                <i class="${h.icon}" style="font-size:24px;color:#003d82;"></i>
                <h4 style="margin:0;">${h.value}</h4>
            </div>
            <p style="margin:0 0 4px 0;font-weight:600;">${h.label}</p>
            <p style="margin:0;font-size:12px;color:#28a745;"><i class="fas fa-arrow-up"></i> ${h.change}</p>
        </div>
    `).join('');

    // Also update the KPI metric card values with latest data
    updateMetricCardValues(latestMonth, firstMonth);
}

// Update metric card values with actual data
function updateMetricCardValues(latest, first) {
    const setValue = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setValue('totalSchools', latest.schools.toLocaleString());
    setValue('totalTeachers', (latest.teachers / 1000000).toFixed(2) + 'M');
    setValue('totalStudents', (latest.students / 1000000).toFixed(1) + 'M');
    setValue('totalApaar', (latest.apaar_ids / 1000000).toFixed(0) + 'M');
    setValue('totalAttendance', latest.attendance_rate + '%');
}

// Calendar Navigation
function initializeCalendar() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    if (!prevBtn || !nextBtn) return; // Elements not present in current layout

    currentMonthIndex = newsletterData.months.length - 1;
    displayMonth(currentMonthIndex);

    prevBtn.addEventListener('click', () => {
        if (currentMonthIndex > 0) {
            currentMonthIndex--;
            displayMonth(currentMonthIndex);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentMonthIndex < newsletterData.months.length - 1) {
            currentMonthIndex++;
            displayMonth(currentMonthIndex);
        }
    });
}

function displayMonth(index) {
    const month = newsletterData.months[index];
    if (!month) return;

    const setTextSafe = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setTextSafe('currentMonth', month.month);
    setTextSafe('monthSchools', month.schools.toLocaleString());
    setTextSafe('monthTeachers', (month.teachers / 1000000).toFixed(2) + 'M');
    setTextSafe('monthStudents', (month.students / 1000000).toFixed(1) + 'M');
    setTextSafe('monthApaar', (month.apaar_ids / 1000000).toFixed(0) + 'M');
    setTextSafe('monthAttendance', month.attendance_rate + '%');

    const setListSafe = (id, items, renderer) => {
        const el = document.getElementById(id);
        if (el && items) el.innerHTML = items.map(renderer).join('');
    };

    setListSafe('monthHighlightsList', month.highlights, h => `<li>${h}</li>`);
    setListSafe('monthActivitiesList', month.activities, a => `<li>${a}</li>`);
    setListSafe('monthEventsList', month.events, e => `
        <div class="event-card">
            <h5>${e.name}</h5>
            <div class="event-date"><i class="fas fa-calendar-alt"></i> ${e.date}</div>
            <div class="event-description">${e.description}</div>
            <div class="event-participants"><i class="fas fa-users"></i> ${e.participants.toLocaleString()} participants</div>
        </div>
    `);

    const statesTable = document.getElementById('monthStatesTable');
    if (statesTable && month.states) {
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
}

// Load Analytics Charts
function loadAnalytics() {
    // Destroy existing charts before recreating
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    charts = {};

    createAPAARChart();
    createAttendanceChart();
    createStudentsChart();
    createInfrastructureChart();
    createStatesChart();
}

// Enhanced APAAR ID Progress Chart - Professional Conference Style
function createAPAARChart() {
    const ctx = document.getElementById('apaarChart');
    if (!ctx) return;

    const data = newsletterData.technical_developments.apaar_milestones;

    charts.apaar = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: data.map(d => d.month),
            datasets: [{
                label: 'APAAR ID Registrations',
                data: data.map(d => d.registrations / 1000000),
                borderColor: '#FF6600',
                backgroundColor: 'rgba(255, 102, 0, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#FF6600',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'APAAR ID Generation Progress (in Millions)',
                    font: {
                        size: 16,
                        weight: 'bold',
                        family: "'Roboto', sans-serif"
                    },
                    color: '#003d82',
                    padding: 20
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 12,
                            family: "'Roboto', sans-serif"
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 61, 130, 0.9)',
                    titleFont: {
                        size: 14,
                        family: "'Roboto', sans-serif"
                    },
                    bodyFont: {
                        size: 13,
                        family: "'Roboto', sans-serif"
                    },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + 'M';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 61, 130, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            family: "'Roboto', sans-serif"
                        },
                        color: '#666',
                        callback: function(value) {
                            return value + 'M';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Registrations (Millions)',
                        font: {
                            size: 12,
                            weight: 'bold',
                            family: "'Roboto', sans-serif"
                        },
                        color: '#003d82'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 10,
                            family: "'Roboto', sans-serif"
                        },
                        color: '#666',
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Enhanced Attendance Trend Chart
function createAttendanceChart() {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;

    const months = newsletterData.months;

    charts.attendance = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: months.map(m => m.month),
            datasets: [{
                label: 'Attendance Rate',
                data: months.map(m => m.attendance_rate),
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#28a745',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Attendance Trend (%)',
                    font: {
                        size: 16,
                        weight: 'bold',
                        family: "'Roboto', sans-serif"
                    },
                    color: '#003d82',
                    padding: 20
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 12,
                            family: "'Roboto', sans-serif"
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 61, 130, 0.9)',
                    titleFont: {
                        size: 14,
                        family: "'Roboto', sans-serif"
                    },
                    bodyFont: {
                        size: 13,
                        family: "'Roboto', sans-serif"
                    },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 94,
                    max: 98,
                    grid: {
                        color: 'rgba(0, 61, 130, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            family: "'Roboto', sans-serif"
                        },
                        color: '#666',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Attendance Rate (%)',
                        font: {
                            size: 12,
                            weight: 'bold',
                            family: "'Roboto', sans-serif"
                        },
                        color: '#003d82'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 10,
                            family: "'Roboto', sans-serif"
                        },
                        color: '#666',
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Enhanced Student Enrollment Chart
function createStudentsChart() {
    const ctx = document.getElementById('studentsChart');
    if (!ctx) return;

    const months = newsletterData.months;

    charts.students = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: months.map(m => m.month),
            datasets: [{
                label: 'Student Enrollment',
                data: months.map(m => m.students / 1000000),
                borderColor: '#003d82',
                backgroundColor: 'rgba(0, 61, 130, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#003d82',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Student Enrollment Growth (in Millions)',
                    font: {
                        size: 16,
                        weight: 'bold',
                        family: "'Roboto', sans-serif"
                    },
                    color: '#003d82',
                    padding: 20
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 12,
                            family: "'Roboto', sans-serif"
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 61, 130, 0.9)',
                    titleFont: {
                        size: 14,
                        family: "'Roboto', sans-serif"
                    },
                    bodyFont: {
                        size: 13,
                        family: "'Roboto', sans-serif"
                    },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + 'M';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 61, 130, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            family: "'Roboto', sans-serif"
                        },
                        color: '#666',
                        callback: function(value) {
                            return value + 'M';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Students (Millions)',
                        font: {
                            size: 12,
                            weight: 'bold',
                            family: "'Roboto', sans-serif"
                        },
                        color: '#003d82'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 10,
                            family: "'Roboto', sans-serif"
                        },
                        color: '#666',
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Enhanced Infrastructure Expansion Chart (Dual Axis)
function createInfrastructureChart() {
    const ctx = document.getElementById('infrastructureChart');
    if (!ctx) return;

    const months = newsletterData.months;

    charts.infrastructure = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: months.map(m => m.month),
            datasets: [
                {
                    label: 'Schools',
                    data: months.map(m => m.schools / 1000),
                    backgroundColor: 'rgba(0, 61, 130, 0.8)',
                    borderColor: '#003d82',
                    borderWidth: 2,
                    yAxisID: 'y',
                    barPercentage: 0.7
                },
                {
                    label: 'Teachers',
                    data: months.map(m => m.teachers / 1000000),
                    backgroundColor: 'rgba(255, 102, 0, 0.8)',
                    borderColor: '#FF6600',
                    borderWidth: 2,
                    yAxisID: 'y1',
                    barPercentage: 0.7
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
                title: {
                    display: true,
                    text: 'Infrastructure Expansion: Schools & Teachers',
                    font: {
                        size: 16,
                        weight: 'bold',
                        family: "'Roboto', sans-serif"
                    },
                    color: '#003d82',
                    padding: 20
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 12,
                            family: "'Roboto', sans-serif"
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 61, 130, 0.9)',
                    titleFont: {
                        size: 14,
                        family: "'Roboto', sans-serif"
                    },
                    bodyFont: {
                        size: 13,
                        family: "'Roboto', sans-serif"
                    },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label;
                            const value = context.parsed.y.toFixed(1);
                            const unit = label === 'Schools' ? 'K' : 'M';
                            return label + ': ' + value + unit;
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: {
                        color: 'rgba(0, 61, 130, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            family: "'Roboto', sans-serif"
                        },
                        color: '#003d82',
                        callback: function(value) {
                            return value + 'K';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Schools (Thousands)',
                        font: {
                            size: 12,
                            weight: 'bold',
                            family: "'Roboto', sans-serif"
                        },
                        color: '#003d82'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            family: "'Roboto', sans-serif"
                        },
                        color: '#FF6600',
                        callback: function(value) {
                            return value + 'M';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Teachers (Millions)',
                        font: {
                            size: 12,
                            weight: 'bold',
                            family: "'Roboto', sans-serif"
                        },
                        color: '#FF6600'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 10,
                            family: "'Roboto', sans-serif"
                        },
                        color: '#666',
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Enhanced Top Performing States Chart
function createStatesChart() {
    const ctx = document.getElementById('statesChart');
    if (!ctx) return;

    const states = newsletterData.state_engagement.top_performing_states;

    charts.states = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: states.map(s => s.name),
            datasets: [
                {
                    label: 'APAAR Coverage',
                    data: states.map(s => s.apaar_coverage),
                    backgroundColor: 'rgba(255, 102, 0, 0.8)',
                    borderColor: '#FF6600',
                    borderWidth: 2
                },
                {
                    label: 'Attendance Rate',
                    data: states.map(s => s.attendance),
                    backgroundColor: 'rgba(40, 167, 69, 0.8)',
                    borderColor: '#28a745',
                    borderWidth: 2
                },
                {
                    label: 'Digital Readiness',
                    data: states.map(s => s.digital_readiness),
                    backgroundColor: 'rgba(0, 61, 130, 0.8)',
                    borderColor: '#003d82',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Top Performing States - Key Metrics Comparison',
                    font: {
                        size: 16,
                        weight: 'bold',
                        family: "'Roboto', sans-serif"
                    },
                    color: '#003d82',
                    padding: 20
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 12,
                            family: "'Roboto', sans-serif"
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 61, 130, 0.9)',
                    titleFont: {
                        size: 14,
                        family: "'Roboto', sans-serif"
                    },
                    bodyFont: {
                        size: 13,
                        family: "'Roboto', sans-serif"
                    },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 85,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 61, 130, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            family: "'Roboto', sans-serif"
                        },
                        color: '#666',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Performance Metrics (%)',
                        font: {
                            size: 12,
                            weight: 'bold',
                            family: "'Roboto', sans-serif"
                        },
                        color: '#003d82'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            family: "'Roboto', sans-serif"
                        },
                        color: '#666'
                    }
                }
            }
        }
    });
}

// Load Technical Developments
function loadTechnicalDevelopments() {
    const tech = newsletterData.technical_developments;
    if (!tech) return;

    const featuresList = document.getElementById('dashboardFeaturesList');
    if (featuresList && tech.dashboard_features) {
        featuresList.innerHTML = tech.dashboard_features.map(f => `<li>${f}</li>`).join('');
    }

    const upgradesList = document.getElementById('infrastructureUpgradesList');
    if (upgradesList && tech.infrastructure_upgrades) {
        upgradesList.innerHTML = tech.infrastructure_upgrades.map(u => `<li>${u}</li>`).join('');
    }
}

// Load KPIs
function loadKPIs() {
    const kpis = newsletterData.key_performance_indicators;
    const kpiGrid = document.getElementById('kpiGrid');
    if (!kpis || !kpiGrid) return;

    const categories = [
        { title: 'Overall Growth', icon: 'fas fa-chart-line', data: kpis.overall_growth },
        { title: 'Learning Outcomes', icon: 'fas fa-graduation-cap', data: kpis.learning_outcomes },
        { title: 'Equity Indicators', icon: 'fas fa-balance-scale', data: kpis.equity_indicators }
    ];

    kpiGrid.innerHTML = categories.filter(cat => cat.data).map(cat => `
        <div class="kpi-category">
            <h4><i class="${cat.icon}"></i> ${cat.title}</h4>
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
    if (!submitBtn || !queryInput) return;

    submitBtn.addEventListener('click', () => askQuestion());
    queryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            askQuestion();
        }
    });

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
    const queryEl = document.getElementById('chatQuery');
    if (!queryEl) return;

    const query = queryEl.value.trim();
    if (!query) return;

    const answerElement = document.getElementById('chatAnswer');
    const sourcesElement = document.getElementById('chatSources');
    const modeElement = document.getElementById('responseMode');

    if (answerElement) answerElement.textContent = 'Analyzing your question...';
    if (sourcesElement) sourcesElement.textContent = '';
    if (modeElement) modeElement.textContent = '';

    try {
        const response = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, language: 'en' })
        });

        if (!response.ok) throw new Error('Failed to get response');

        const data = await response.json();

        if (answerElement) {
            const rendered = renderResponseHTML(data.answer);
            answerElement.innerHTML = rendered;
            answerElement.style.whiteSpace = 'normal';
            answerElement.style.overflowX = 'auto';
            enhanceInteractiveTables(answerElement);
        }

        if (modeElement) modeElement.textContent = (data.mode || 'rag').toUpperCase();
        if (sourcesElement) {
            sourcesElement.textContent = data.sources && data.sources.length > 0
                ? `Sources: ${data.sources.join(', ')}`
                : 'Sources: Newsletter data from April 2025 - January 2026';
        }
    } catch (error) {
        console.error('Error asking question:', error);
        if (answerElement) answerElement.textContent = 'Unable to process your question at this time. Please try again.';
        if (sourcesElement) sourcesElement.textContent = 'Error: Backend service unavailable';
        if (modeElement) {
            modeElement.textContent = 'ERROR';
            modeElement.style.background = '#dc3545';
        }
    }
}

// Unified response rendering: handles both HTML and Markdown content
function renderResponseHTML(text) {
    if (!text) return '<p>No response available.</p>';

    // If response already contains HTML tables, render as HTML directly
    if (text.includes('<table') && text.includes('</table>')) {
        // Clean up any markdown remnants around the HTML
        let html = text
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
        return html;
    }

    // Try markdown parsing with marked.js
    if (typeof marked !== 'undefined' && marked.parse) {
        try {
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: false,
                mangle: false
            });
            return marked.parse(text);
        } catch (e) {
            console.warn('[VSK] Markdown parse failed, falling back to text');
        }
    }

    // Final fallback: basic text formatting
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^\s*•\s*/gm, '<li>')
        .replace(/<\/p><p>/g, '</p><p>');
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
    const data = newsletterData.months || newsletterData.monthly_data;
    if (!data || !data.length) {
        showNotification('No monthly data available to export', 'error');
        return;
    }
    let csv = 'Month,Schools,Teachers,Students,APAAR IDs,Attendance Rate\n';
    
    data.forEach(month => {
        csv += `${month.month},${month.schools},${month.teachers},${month.students},${month.apaar_ids},${month.attendance_rate}\n`;
    });

    downloadFile(csv, 'vsk-newsletter-data.csv', 'text/csv');
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

    const monthlyData = newsletterData.months || newsletterData.monthly_data;
    if (!monthlyData || !monthlyData.length) return;

    // Create mini sparkline charts for each metric card
    createMiniChart('schoolsTrend', monthlyData.map(m => m.schools), '#FF6600');
    createMiniChart('teachersTrend', monthlyData.map(m => m.teachers), '#28a745');
    createMiniChart('studentsTrend', monthlyData.map(m => m.students), '#003d82');
    createMiniChart('apaarTrend', monthlyData.map(m => m.apaar_ids), '#ffc107');
    createMiniChart('attendanceTrend', monthlyData.map(m => parseFloat(m.attendance_rate)), '#17a2b8');
    createMiniChart('digitalTrend', monthlyData.map((m, i) => 74.8 + (i * 1.4)), '#6610f2');
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
