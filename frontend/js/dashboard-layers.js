document.addEventListener('DOMContentLoaded', () => {
    initNewsletterCarousel();
    initNavHighlight();
});

function initNewsletterCarousel() {
    const track = document.getElementById('newsletterTrack');
    const prevBtn = document.getElementById('newsPrev');
    const nextBtn = document.getElementById('newsNext');
    if (!track || !prevBtn || !nextBtn) return;

    const highlights = [
        {
            tag: 'RVSK Update',
            title: '38 Operational VSKs Across India',
            text: 'All 35 States/UTs and 3 Central Autonomous Bodies (CABs) now have fully operational Vidya Samiksha Kendras with real-time data integration.'
        },
        {
            tag: 'APAAR',
            title: '15.67 Crore APAAR IDs Generated',
            text: 'Unique academic identity for students linked with Aadhaar (UIDAI), enabling seamless tracking across schools and states.'
        },
        {
            tag: 'Attendance',
            title: '11.51 Lakh Schools on Digital Attendance',
            text: '33 States/UTs have integrated real-time student and teacher attendance tracking through VSK dashboards.'
        },
        {
            tag: 'Gujarat',
            title: 'Gujarat VSK 2.0 — Three-Tier Model',
            text: 'State VSK → 33 District VSKs → 254 Block VSKs. Features AI-based Oral Reading Fluency (Vachan Samiksha) and dropout prevention.'
        },
        {
            tag: 'Assessment',
            title: '91.7% Data Quality in Assessment Module',
            text: '7 States/UTs have integrated competency-based evaluation with high-quality student performance data flowing to RVSK.'
        },
        {
            tag: 'Odisha',
            title: 'Odisha Early Warning System',
            text: 'Multi-level escalation for student absence: 7 days → Headmaster, 15 days → BEO, 30 days → DEO. Ticketing tool deployed.'
        },
        {
            tag: 'Capacity Building',
            title: '165 Participants Trained in Batch 2.0',
            text: 'August 2025: 5 batches covering 36 States/UTs. Curriculum includes Data Governance, Technical Integration, and 6A Framework.'
        },
        {
            tag: 'AI',
            title: 'AI Chatbot & Predictive Analytics',
            text: 'Deployed AI-powered newsletter assistant and predictive dropout analytics across multiple State VSKs.'
        },
        {
            tag: 'DPDP',
            title: 'DPDP Act 2023 Compliance',
            text: 'UDISE+ and LGD nomenclature alignment across 28 States/UTs. Privacy-by-design for all 6A Framework data handling.'
        }
    ];

    highlights.forEach(item => {
        const card = document.createElement('div');
        card.className = 'carousel-card';
        card.innerHTML = `
            <span class="card-tag">${item.tag}</span>
            <h4>${item.title}</h4>
            <p>${item.text}</p>
        `;
        track.appendChild(card);
    });

    let scrollPos = 0;
    const cardWidth = 340;

    function getMaxScroll() {
        const visibleWidth = track.parentElement.clientWidth - 100;
        const totalWidth = highlights.length * cardWidth;
        return Math.max(0, totalWidth - visibleWidth);
    }

    prevBtn.addEventListener('click', () => {
        scrollPos = Math.max(0, scrollPos - cardWidth);
        track.style.transform = `translateX(-${scrollPos}px)`;
    });

    nextBtn.addEventListener('click', () => {
        scrollPos = Math.min(getMaxScroll(), scrollPos + cardWidth);
        track.style.transform = `translateX(-${scrollPos}px)`;
    });

    let autoTimer = setInterval(() => {
        if (scrollPos >= getMaxScroll()) {
            scrollPos = 0;
        } else {
            scrollPos += cardWidth;
        }
        track.style.transform = `translateX(-${scrollPos}px)`;
    }, 5000);

    track.parentElement.addEventListener('mouseenter', () => clearInterval(autoTimer));
    track.parentElement.addEventListener('mouseleave', () => {
        autoTimer = setInterval(() => {
            if (scrollPos >= getMaxScroll()) {
                scrollPos = 0;
            } else {
                scrollPos += cardWidth;
            }
            track.style.transform = `translateX(-${scrollPos}px)`;
        }, 5000);
    });
}

function initNavHighlight() {
    const navLinks = document.querySelectorAll('.nav-menu .nav-link');
    const sections = [];

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            const section = document.querySelector(href);
            if (section) sections.push({ link, section });
        }
    });

    function updateActive() {
        let current = '';
        sections.forEach(({ section }) => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 150) {
                current = section.id;
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === '#' + current) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActive, { passive: true });
}
