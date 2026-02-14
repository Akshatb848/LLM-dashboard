/**
 * Language Translation System
 * English and Hindi Support for VSK Dashboard
 */

const translations = {
    en: {
        // Header & Navigation
        'govTitle': 'Government of India',
        'mainTitle': 'Vidya Samiksha Kendra',
        'subtitle': 'National Education Dashboard',
        'department': 'Department of School Education & Literacy',
        'ministry': 'Ministry of Education | Government of India',

        // Navigation Menu
        'navHome': 'Home',
        'navNewsletters': 'Newsletters',
        'navAnalytics': 'Analytics',
        'navTrends': 'Trends',
        'navAIAssistant': 'AI Assistant',
        'navDocumentation': 'Documentation',
        'navFeedback': 'Feedback',

        // Breadcrumb
        'breadcrumbHome': 'Home',
        'breadcrumbDashboard': 'Dashboard',

        // Sidebar
        'sidebarFilters': 'Filters',
        'sidebarTimePeriod': 'Time Period',
        'sidebarAllMonths': 'All Months (Apr 2025 - Jan 2026)',
        'sidebarQ1': 'Q1 (Apr-Jun 2025)',
        'sidebarQ2': 'Q2 (Jul-Sep 2025)',
        'sidebarQ3': 'Q3 (Oct-Dec 2025)',
        'sidebarQ4': 'Q4 (Jan 2026)',
        'sidebarMetricType': 'Metric Type',
        'sidebarAllMetrics': 'All Metrics',
        'sidebarSchools': 'Schools',
        'sidebarTeachers': 'Teachers',
        'sidebarStudents': 'Students',
        'sidebarAPAAR': 'APAAR IDs',
        'sidebarAttendance': 'Attendance',
        'sidebarQuickLinks': 'Quick Links',
        'sidebarKeyMetrics': 'Key Metrics',
        'sidebarMonthlyData': 'Monthly Data',
        'sidebarStateWise': 'State-wise Analysis',
        'sidebarCharts': 'Visual Charts',
        'sidebarAIChat': 'AI Chat',
        'sidebarExportData': 'Export Data',
        'exportCSV': 'CSV',
        'exportExcel': 'Excel',
        'exportPDF': 'PDF',

        // Metric Cards
        'metricsTitle': 'Key Performance Indicators',
        'metricsAsOf': 'As of January 2026',
        'totalSchools': 'Total Schools',
        'totalTeachers': 'Total Teachers',
        'totalStudents': 'Total Students',
        'totalAPAAR': 'APAAR IDs',
        'attendanceRate': 'Attendance Rate',
        'digitalReadiness': 'Digital Readiness',
        'sinceApril': 'Since April 2025',
        'schoolsICT': 'Schools with ICT facilities',

        // Director's Message
        'directorMessage': "Director's Message",
        'directorPosition': 'Director, Department of School Education & Literacy',

        // Chat Widget
        'chatTitle': 'Newsletter AI Assistant',
        'chatStatus': 'Online',
        'chatWelcome': "Hello! I'm your Newsletter AI Assistant. I can help you with questions about education statistics, APAAR IDs, attendance rates, state performance, and initiatives from April 2025 to January 2026.",
        'chatPlaceholder': 'Ask about education data, statistics, or initiatives...',
        'chatAPAARGrowth': 'APAAR ID Growth',
        'chatStateComparison': 'State Comparison',
        'chatTechnicalUpdates': 'Technical Updates',

        // Footer
        'footerAbout': 'About VSK',
        'footerAboutText': 'Vidya Samiksha Kendra (VSK) is a centralized dashboard for monitoring and analyzing the school education system in India.',
        'footerQuickLinks': 'Quick Links',
        'footerContact': 'Contact Us',
        'footerCompliance': 'Compliance & Standards',
        'footerGIGW': 'GIGW Compliant',
        'footerWCAG': 'WCAG 2.1 Level AA',
        'footerSSL': 'SSL Secured',
        'footerAccessibility': 'Accessibility Statement',
        'footerScreenReader': 'Screen Reader Access',
        'footerVisitorsToday': 'Visitors Today',
        'footerTotalVisitors': 'Total Visitors',
        'footerLastUpdated': 'Last Updated',
        'footerDisclaimer': 'Disclaimer',
        'footerDisclaimerText': 'This is an official website of the Department of School Education & Literacy, Ministry of Education, Government of India.',
        'footerCopyright': '© 2026 Department of School Education & Literacy, Ministry of Education, Government of India',

        // Buttons & Actions
        'btnSubmit': 'Submit Query',
        'btnMinimize': 'Minimize',
        'btnClose': 'Close',
        'btnSend': 'Send',
        'btnExport': 'Export',
        'btnFeedback': 'Share Feedback'
    },

    hi: {
        // Header & Navigation
        'govTitle': 'भारत सरकार',
        'mainTitle': 'विद्या समीक्षा केंद्र',
        'subtitle': 'राष्ट्रीय शिक्षा डैशबोर्ड',
        'department': 'स्कूल शिक्षा और साक्षरता विभाग',
        'ministry': 'शिक्षा मंत्रालय | भारत सरकार',

        // Navigation Menu
        'navHome': 'होम',
        'navNewsletters': 'समाचार पत्र',
        'navAnalytics': 'विश्लेषण',
        'navTrends': 'रुझान',
        'navAIAssistant': 'AI सहायक',
        'navDocumentation': 'दस्तावेज़ीकरण',
        'navFeedback': 'फीडबैक',

        // Breadcrumb
        'breadcrumbHome': 'होम',
        'breadcrumbDashboard': 'डैशबोर्ड',

        // Sidebar
        'sidebarFilters': 'फ़िल्टर',
        'sidebarTimePeriod': 'समय अवधि',
        'sidebarAllMonths': 'सभी महीने (अप्रैल 2025 - जनवरी 2026)',
        'sidebarQ1': 'Q1 (अप्रैल-जून 2025)',
        'sidebarQ2': 'Q2 (जुलाई-सितंबर 2025)',
        'sidebarQ3': 'Q3 (अक्टूबर-दिसंबर 2025)',
        'sidebarQ4': 'Q4 (जनवरी 2026)',
        'sidebarMetricType': 'मेट्रिक प्रकार',
        'sidebarAllMetrics': 'सभी मेट्रिक्स',
        'sidebarSchools': 'स्कूल',
        'sidebarTeachers': 'शिक्षक',
        'sidebarStudents': 'छात्र',
        'sidebarAPAAR': 'APAAR IDs',
        'sidebarAttendance': 'उपस्थिति',
        'sidebarQuickLinks': 'त्वरित लिंक',
        'sidebarKeyMetrics': 'मुख्य मेट्रिक्स',
        'sidebarMonthlyData': 'मासिक डेटा',
        'sidebarStateWise': 'राज्य-वार विश्लेषण',
        'sidebarCharts': 'दृश्य चार्ट',
        'sidebarAIChat': 'AI चैट',
        'sidebarExportData': 'डेटा निर्यात करें',
        'exportCSV': 'CSV',
        'exportExcel': 'Excel',
        'exportPDF': 'PDF',

        // Metric Cards
        'metricsTitle': 'मुख्य प्रदर्शन संकेतक',
        'metricsAsOf': 'जनवरी 2026 तक',
        'totalSchools': 'कुल स्कूल',
        'totalTeachers': 'कुल शिक्षक',
        'totalStudents': 'कुल छात्र',
        'totalAPAAR': 'APAAR IDs',
        'attendanceRate': 'उपस्थिति दर',
        'digitalReadiness': 'डिजिटल तैयारी',
        'sinceApril': 'अप्रैल 2025 से',
        'schoolsICT': 'ICT सुविधाओं वाले स्कूल',

        // Director's Message
        'directorMessage': 'निदेशक का संदेश',
        'directorPosition': 'निदेशक, स्कूल शिक्षा और साक्षरता विभाग',

        // Chat Widget
        'chatTitle': 'समाचार पत्र AI सहायक',
        'chatStatus': 'ऑनलाइन',
        'chatWelcome': 'नमस्ते! मैं आपका समाचार पत्र AI सहायक हूं। मैं अप्रैल 2025 से जनवरी 2026 तक शिक्षा सांख्यिकी, APAAR IDs, उपस्थिति दर, राज्य प्रदर्शन और पहलों के बारे में आपके प्रश्नों में मदद कर सकता हूं।',
        'chatPlaceholder': 'शिक्षा डेटा, सांख्यिकी या पहल के बारे में पूछें...',
        'chatAPAARGrowth': 'APAAR ID वृद्धि',
        'chatStateComparison': 'राज्य तुलना',
        'chatTechnicalUpdates': 'तकनीकी अपडेट',

        // Footer
        'footerAbout': 'VSK के बारे में',
        'footerAboutText': 'विद्या समीक्षा केंद्र (VSK) भारत में स्कूली शिक्षा प्रणाली की निगरानी और विश्लेषण के लिए एक केंद्रीकृत डैशबोर्ड है।',
        'footerQuickLinks': 'त्वरित लिंक',
        'footerContact': 'संपर्क करें',
        'footerCompliance': 'अनुपालन और मानक',
        'footerGIGW': 'GIGW अनुपालक',
        'footerWCAG': 'WCAG 2.1 स्तर AA',
        'footerSSL': 'SSL सुरक्षित',
        'footerAccessibility': 'पहुंच विवरण',
        'footerScreenReader': 'स्क्रीन रीडर पहुंच',
        'footerVisitorsToday': 'आज के आगंतुक',
        'footerTotalVisitors': 'कुल आगंतुक',
        'footerLastUpdated': 'अंतिम अपडेट',
        'footerDisclaimer': 'अस्वीकरण',
        'footerDisclaimerText': 'यह स्कूल शिक्षा और साक्षरता विभाग, शिक्षा मंत्रालय, भारत सरकार की एक आधिकारिक वेबसाइट है।',
        'footerCopyright': '© 2026 स्कूल शिक्षा और साक्षरता विभाग, शिक्षा मंत्रालय, भारत सरकार',

        // Buttons & Actions
        'btnSubmit': 'प्रश्न सबमिट करें',
        'btnMinimize': 'छोटा करें',
        'btnClose': 'बंद करें',
        'btnSend': 'भेजें',
        'btnExport': 'निर्यात',
        'btnFeedback': 'फीडबैक साझा करें'
    }
};

// Current language state
let currentLanguage = localStorage.getItem('language') || 'en';

// Language switcher function
function switchLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;

    // Update all elements with data-en and data-hi attributes
    document.querySelectorAll('[data-en]').forEach(element => {
        const key = lang === 'hi' ? 'data-hi' : 'data-en';
        const text = element.getAttribute(key);
        if (text) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = text;
            } else {
                element.textContent = text;
            }
        }
    });

    // Update placeholder attributes
    document.querySelectorAll('[data-placeholder-en]').forEach(element => {
        const key = lang === 'hi' ? 'data-placeholder-hi' : 'data-placeholder-en';
        element.placeholder = element.getAttribute(key);
    });

    // Announce language change
    announceToScreenReader(`Language changed to ${lang === 'en' ? 'English' : 'Hindi'}`);
}

// Initialize language on page load
function initializeLanguage() {
    const savedLang = localStorage.getItem('language') || 'en';
    switchLanguage(savedLang);

    // Set active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === savedLang);
    });
}

// Translation helper function
function t(key) {
    return translations[currentLanguage][key] || key;
}
