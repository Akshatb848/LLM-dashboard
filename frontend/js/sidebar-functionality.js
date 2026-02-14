/**
 * Sidebar & Header Functionality
 * Filters, Quick Links, Export, Search, Help
 */

// Initialize all sidebar and header features
function initializeSidebarFeatures() {
    initializeFilters();
    initializeQuickLinks();
    initializeExportFunctions();
    initializeSearchModal();
    initializeHelpPanel();
}

// ========== FILTERS ==========

function initializeFilters() {
    const timeFilter = document.getElementById('timeFilter');
    const metricFilter = document.getElementById('metricFilter');

    if (timeFilter) {
        timeFilter.addEventListener('change', (e) => {
            filterByTimePeriod(e.target.value);
        });
    }

    if (metricFilter) {
        metricFilter.addEventListener('change', (e) => {
            filterByMetricType(e.target.value);
        });
    }
}

function filterByTimePeriod(period) {
    const metricCards = document.querySelectorAll('.metric-card');
    const sections = document.querySelectorAll('.calendar-section, .kpi-section, .analytics-section');

    // Show loading state
    showNotification(`Filtering data for ${period.toUpperCase()}...`, 'info');

    // Filter metric cards based on time period
    if (period === 'all') {
        metricCards.forEach(card => {
            card.style.display = 'flex';
            card.style.opacity = '1';
        });
        showNotification('Showing all months (Apr 2025 - Jan 2026)', 'success');
    } else {
        // Define quarter months
        const quarters = {
            'q1': ['April 2025', 'May 2025', 'June 2025'],
            'q2': ['July 2025', 'August 2025', 'September 2025'],
            'q3': ['October 2025', 'November 2025', 'December 2025'],
            'q4': ['January 2026']
        };

        const selectedMonths = quarters[period] || [];

        // Update metric cards with filtered data
        updateMetricCardsForPeriod(selectedMonths);

        showNotification(`Filtered to ${period.toUpperCase()} months`, 'success');
    }

    // Update calendar if it exists
    if (typeof updateCalendarForPeriod === 'function') {
        updateCalendarForPeriod(period);
    }

    // Announce to screen readers
    announceToScreenReader(`Time period filter changed to ${period}`);
}

function filterByMetricType(metric) {
    const metricCards = document.querySelectorAll('.metric-card');

    showNotification(`Filtering metrics: ${metric}`, 'info');

    if (metric === 'all') {
        metricCards.forEach(card => {
            card.style.display = 'flex';
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
        });
        showNotification('Showing all metrics', 'success');
    } else {
        metricCards.forEach(card => {
            const cardType = getCardType(card);
            if (cardType === metric) {
                card.style.display = 'flex';
                card.style.opacity = '1';
                card.style.transform = 'scale(1.05)';
                card.style.boxShadow = '0 8px 24px rgba(0,61,130,0.3)';
            } else {
                card.style.display = 'none';
                card.style.opacity = '0.5';
            }
        });
        showNotification(`Showing ${metric} metric only`, 'success');
    }

    // Announce to screen readers
    announceToScreenReader(`Metric filter changed to ${metric}`);
}

function getCardType(card) {
    if (card.classList.contains('schools-card')) return 'schools';
    if (card.classList.contains('teachers-card')) return 'teachers';
    if (card.classList.contains('students-card')) return 'students';
    if (card.classList.contains('apaar-card')) return 'apaar';
    if (card.classList.contains('attendance-card')) return 'attendance';
    if (card.classList.contains('digital-card')) return 'digital';
    return 'unknown';
}

function updateMetricCardsForPeriod(months) {
    // This would update the metric cards with data for specific months
    // For now, we'll just show a visual update
    const metricCards = document.querySelectorAll('.metric-card');
    metricCards.forEach((card, index) => {
        card.style.animation = 'fadeInUp 0.3s ease-out';
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

// ========== QUICK LINKS ==========

function initializeQuickLinks() {
    const quickLinks = document.querySelectorAll('.quick-links a');

    quickLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            const targetId = href.substring(1); // Remove #

            scrollToSection(targetId);

            // If it's the AI Chat link, open the chat widget
            if (targetId === 'ai-chat') {
                openChatWidget();
            }
        });
    });
}

function scrollToSection(id) {
    // Map section IDs to actual elements
    const sectionMap = {
        'key-metrics': '.metrics-dashboard',
        'monthly-data': '.calendar-section',
        'state-wise': '.states-section, .kpi-section',
        'charts': '.analytics-section',
        'ai-chat': '.chat-widget'
    };

    const selector = sectionMap[id] || `#${id}`;
    const element = document.querySelector(selector);

    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        // Add highlight effect
        element.style.outline = '3px solid var(--gov-orange)';
        element.style.outlineOffset = '4px';

        setTimeout(() => {
            element.style.outline = '';
            element.style.outlineOffset = '';
        }, 2000);

        showNotification(`Scrolled to ${id.replace('-', ' ')}`, 'success');
        announceToScreenReader(`Navigated to ${id} section`);
    } else {
        showNotification(`Section ${id} not found`, 'error');
    }
}

function openChatWidget() {
    const chatWidget = document.getElementById('chatWidget');
    const chatInput = document.getElementById('chatInput');

    if (chatWidget) {
        chatWidget.classList.add('active');
        chatWidget.setAttribute('aria-hidden', 'false');

        if (chatInput) {
            setTimeout(() => chatInput.focus(), 300);
        }
    }
}

// ========== EXPORT FUNCTIONS ==========

function initializeExportFunctions() {
    const exportCSV = document.getElementById('exportCSV');
    const exportExcel = document.getElementById('exportExcel');
    const exportPDF = document.getElementById('exportPDF');

    if (exportCSV) {
        exportCSV.addEventListener('click', () => exportToCSV());
    }

    if (exportExcel) {
        exportExcel.addEventListener('click', () => exportToExcel());
    }

    if (exportPDF) {
        exportPDF.addEventListener('click', () => exportToPDF());
    }
}

async function exportToCSV() {
    try {
        showNotification('Preparing CSV export...', 'info');

        // Get data from API or newsletterData
        const data = newsletterData?.monthly_data || [];

        if (data.length === 0) {
            showNotification('No data available to export', 'error');
            return;
        }

        // Create CSV content
        let csv = 'Month,Schools,Teachers,Students,APAAR IDs,Attendance Rate\n';

        data.forEach(month => {
            csv += `${month.month},${month.schools},${month.teachers},${month.students},${month.apaar_ids},${month.attendance_rate}\n`;
        });

        // Download file
        downloadFile(csv, 'vsk-education-data.csv', 'text/csv');

        showNotification('CSV exported successfully!', 'success');
        announceToScreenReader('CSV file downloaded');

    } catch (error) {
        console.error('CSV export error:', error);
        showNotification('Failed to export CSV', 'error');
    }
}

async function exportToExcel() {
    showNotification('Excel export feature coming soon!', 'info');

    // For now, fallback to CSV
    setTimeout(() => {
        showNotification('Exporting as CSV instead...', 'info');
        exportToCSV();
    }, 1000);
}

async function exportToPDF() {
    try {
        showNotification('Preparing PDF export...', 'info');

        // Create PDF content
        const pdfContent = generatePDFContent();

        // For now, show notification
        showNotification('PDF export feature coming soon!', 'info');

        // TODO: Implement actual PDF generation using jsPDF or similar
        announceToScreenReader('PDF export not yet available');

    } catch (error) {
        console.error('PDF export error:', error);
        showNotification('Failed to export PDF', 'error');
    }
}

function generatePDFContent() {
    // This would generate PDF content
    // For now, return placeholder
    return {
        title: 'VSK Education Newsletter Data',
        date: new Date().toLocaleDateString(),
        data: newsletterData
    };
}

// ========== SEARCH MODAL ==========

function initializeSearchModal() {
    const searchBtn = document.querySelector('.search-btn');

    if (searchBtn) {
        searchBtn.addEventListener('click', openSearchModal);
    }

    // Create search modal if it doesn't exist
    createSearchModal();
}

function createSearchModal() {
    // Check if modal already exists
    if (document.getElementById('searchModal')) return;

    const modal = document.createElement('div');
    modal.id = 'searchModal';
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'searchModalTitle');
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="searchModalTitle"><i class="fas fa-search"></i> Search Dashboard</h3>
                <button class="modal-close" aria-label="Close search modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="search-container">
                    <input
                        type="text"
                        id="searchInput"
                        class="search-input"
                        placeholder="Search for schools, teachers, states, initiatives..."
                        autocomplete="off"
                    >
                    <button id="searchSubmit" class="btn btn-primary">
                        <i class="fas fa-search"></i> Search
                    </button>
                </div>
                <div id="searchResults" class="search-results">
                    <p class="search-hint">
                        <i class="fas fa-lightbulb"></i>
                        Try searching for: "APAAR IDs", "Kerala attendance", "December highlights", "NEP 2020"
                    </p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    const closeBtn = modal.querySelector('.modal-close');
    const searchInput = modal.querySelector('#searchInput');
    const searchSubmit = modal.querySelector('#searchSubmit');

    closeBtn.addEventListener('click', closeSearchModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeSearchModal();
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch(searchInput.value);
        }
    });

    searchInput.addEventListener('input', (e) => {
        if (e.target.value.length >= 3) {
            performInstantSearch(e.target.value);
        }
    });

    searchSubmit.addEventListener('click', () => {
        performSearch(searchInput.value);
    });
}

function openSearchModal() {
    const modal = document.getElementById('searchModal');
    const searchInput = document.getElementById('searchInput');

    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');

        if (searchInput) {
            setTimeout(() => searchInput.focus(), 300);
        }
    }
}

function closeSearchModal() {
    const modal = document.getElementById('searchModal');

    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}

function performSearch(query) {
    const resultsDiv = document.getElementById('searchResults');

    if (!query || query.length < 2) {
        resultsDiv.innerHTML = '<p class="search-hint"><i class="fas fa-exclamation-circle"></i> Please enter at least 2 characters</p>';
        return;
    }

    // Show loading
    resultsDiv.innerHTML = '<p class="search-loading"><i class="fas fa-spinner fa-spin"></i> Searching...</p>';

    // Perform search (simulated)
    setTimeout(() => {
        const results = searchDashboard(query);
        displaySearchResults(results, query);
    }, 500);
}

function performInstantSearch(query) {
    if (query.length < 3) return;

    const resultsDiv = document.getElementById('searchResults');
    const results = searchDashboard(query);
    displaySearchResults(results, query, true);
}

function searchDashboard(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    // Search in metric cards
    const metricCards = document.querySelectorAll('.metric-card');
    metricCards.forEach(card => {
        const label = card.querySelector('.metric-label')?.textContent.toLowerCase();
        if (label && label.includes(lowerQuery)) {
            results.push({
                type: 'metric',
                title: card.querySelector('.metric-label')?.textContent,
                value: card.querySelector('.metric-value')?.textContent,
                element: card
            });
        }
    });

    // Search in sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        const heading = section.querySelector('h2')?.textContent.toLowerCase();
        if (heading && heading.includes(lowerQuery)) {
            results.push({
                type: 'section',
                title: section.querySelector('h2')?.textContent,
                element: section
            });
        }
    });

    return results;
}

function displaySearchResults(results, query, isInstant = false) {
    const resultsDiv = document.getElementById('searchResults');

    if (results.length === 0) {
        resultsDiv.innerHTML = `
            <p class="search-no-results">
                <i class="fas fa-search-minus"></i>
                No results found for "<strong>${query}</strong>"
            </p>
        `;
        return;
    }

    let html = `<h4 class="search-results-title">${results.length} result(s) for "<strong>${query}</strong>"</h4>`;
    html += '<div class="search-results-list">';

    results.forEach(result => {
        html += `
            <div class="search-result-item" data-type="${result.type}">
                <div class="result-icon">
                    <i class="fas fa-${result.type === 'metric' ? 'chart-line' : 'folder'}"></i>
                </div>
                <div class="result-content">
                    <h5>${result.title}</h5>
                    ${result.value ? `<p class="result-value">${result.value}</p>` : ''}
                </div>
                <button class="result-goto" onclick="scrollToElement(this.parentElement)">
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
    });

    html += '</div>';
    resultsDiv.innerHTML = html;

    // Add click handlers to results
    const resultItems = resultsDiv.querySelectorAll('.search-result-item');
    resultItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            const result = results[index];
            if (result.element) {
                closeSearchModal();
                result.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Highlight element
                result.element.style.outline = '3px solid var(--gov-orange)';
                setTimeout(() => {
                    result.element.style.outline = '';
                }, 2000);
            }
        });
    });
}

// ========== HELP PANEL ==========

function initializeHelpPanel() {
    const helpBtn = document.querySelector('.help-btn');

    if (helpBtn) {
        helpBtn.addEventListener('click', openHelpPanel);
    }

    // Create help panel if it doesn't exist
    createHelpPanel();
}

function createHelpPanel() {
    // Check if panel already exists
    if (document.getElementById('helpPanel')) return;

    const panel = document.createElement('div');
    panel.id = 'helpPanel';
    panel.className = 'modal';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'helpPanelTitle');
    panel.setAttribute('aria-hidden', 'true');

    panel.innerHTML = `
        <div class="modal-content help-modal-content">
            <div class="modal-header">
                <h3 id="helpPanelTitle"><i class="fas fa-question-circle"></i> Help & Documentation</h3>
                <button class="modal-close" aria-label="Close help panel">&times;</button>
            </div>
            <div class="modal-body">
                <div class="help-content">
                    <div class="help-section">
                        <h4><i class="fas fa-info-circle"></i> About This Dashboard</h4>
                        <p>The Vidya Samiksha Kendra (VSK) National Education Dashboard provides comprehensive insights into India's school education system from April 2025 to January 2026.</p>
                    </div>

                    <div class="help-section">
                        <h4><i class="fas fa-filter"></i> Using Filters</h4>
                        <ul>
                            <li><strong>Time Period:</strong> Filter data by quarters (Q1-Q4) or view all months</li>
                            <li><strong>Metric Type:</strong> Focus on specific metrics like schools, teachers, or students</li>
                        </ul>
                    </div>

                    <div class="help-section">
                        <h4><i class="fas fa-download"></i> Exporting Data</h4>
                        <ul>
                            <li><strong>CSV:</strong> Download monthly data in CSV format</li>
                            <li><strong>Excel:</strong> Export to Excel spreadsheet (coming soon)</li>
                            <li><strong>PDF:</strong> Generate PDF report (coming soon)</li>
                        </ul>
                    </div>

                    <div class="help-section">
                        <h4><i class="fas fa-robot"></i> AI Assistant</h4>
                        <p>Click the orange chat button to ask questions about:</p>
                        <ul>
                            <li>APAAR ID registrations and growth</li>
                            <li>Attendance rates and trends</li>
                            <li>State-wise performance comparisons</li>
                            <li>Policy initiatives and programs</li>
                        </ul>
                    </div>

                    <div class="help-section">
                        <h4><i class="fas fa-keyboard"></i> Keyboard Shortcuts</h4>
                        <ul>
                            <li><strong>Ctrl + K:</strong> Open search</li>
                            <li><strong>Ctrl + /:</strong> Open help</li>
                            <li><strong>Esc:</strong> Close modals</li>
                            <li><strong>Tab:</strong> Navigate through elements</li>
                        </ul>
                    </div>

                    <div class="help-section">
                        <h4><i class="fas fa-universal-access"></i> Accessibility</h4>
                        <p>Use the accessibility controls in the top bar to:</p>
                        <ul>
                            <li>Toggle dark/light theme</li>
                            <li>Enable high contrast mode</li>
                            <li>Adjust font size (12px-20px)</li>
                            <li>Switch between English and Hindi</li>
                        </ul>
                    </div>

                    <div class="help-section">
                        <h4><i class="fas fa-phone"></i> Support</h4>
                        <p>For assistance, contact:</p>
                        <p><strong>Email:</strong> vsk@education.gov.in</p>
                        <p><strong>Phone:</strong> +91-11-23382698</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(panel);

    // Add event listeners
    const closeBtn = panel.querySelector('.modal-close');
    closeBtn.addEventListener('click', closeHelpPanel);
    panel.addEventListener('click', (e) => {
        if (e.target === panel) closeHelpPanel();
    });
}

function openHelpPanel() {
    const panel = document.getElementById('helpPanel');

    if (panel) {
        panel.classList.add('active');
        panel.setAttribute('aria-hidden', 'false');
    }
}

function closeHelpPanel() {
    const panel = document.getElementById('helpPanel');

    if (panel) {
        panel.classList.remove('active');
        panel.setAttribute('aria-hidden', 'true');
    }
}

// ========== KEYBOARD SHORTCUTS ==========

document.addEventListener('keydown', (e) => {
    // Ctrl + K: Open search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearchModal();
    }

    // Ctrl + /: Open help
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        openHelpPanel();
    }

    // Escape: Close all modals
    if (e.key === 'Escape') {
        closeSearchModal();
        closeHelpPanel();
    }
});

console.log('✅ Sidebar functionality initialized');
