/**
 * 罗罗作品集 2022-2024 · 主脚本 v2
 * 多年份支持 · 分类过滤 · 访问统计
 */
let articles = [];
let currentYear = 'all';

// ============================================
// 加载
// ============================================
function loadArticles() {
    try {
        if (window.ARTICLES_DATA && Array.isArray(window.ARTICLES_DATA)) {
            articles = window.ARTICLES_DATA;
            initApp();
        } else {
            fetch('articles.json').then(r => r.json()).then(data => {
                articles = data;
                initApp();
            }).catch(() => {
                document.getElementById('articlesContainer').innerHTML =
                    '<div class="empty-state"><div class="empty-icon">📄</div><p>文章加载失败</p><p style="font-size:13px">请刷新页面重试</p></div>';
            });
        }
    } catch (err) {
        console.error('Load error:', err);
        document.getElementById('articlesContainer').innerHTML =
            '<div class="empty-state"><p>加载出错，请刷新</p></div>';
    }
}

// ============================================
// 工具函数
// ============================================
function cnNum(n) {
    const m = ['','一','二','三','四','五','六','七','八','九','十',
               '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
               '二十一','二十二','二十三','二十四','二十五','二十六','二十七','二十八','二十九','三十',
               '三十一','三十二','三十三','三十四','三十五','三十六','三十七','三十八','三十九','四十',
               '四十一','四十二','四十三','四十四','四十五','四十六'];
    return m[n] || String(n);
}

function esc(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

// ============================================
// 初始化
// ============================================
function initApp() {
    updateHeroStats();
    renderNavigation();
    renderArticles();
    setupYearFilter();
    setupScrollHandlers();
    setupMobileMenu();
    setupBackToTop();
    updateVisitCounter();
    setupActiveNavHighlight();
}

// ============================================
// 英雄区统计
// ============================================
function updateHeroStats() {
    const total = articles.length;
    const totalChars = articles.reduce((s, a) => s + (a.word_count || 0), 0);
    const wan = (totalChars / 10000).toFixed(1);
    const years = [...new Set(articles.map(a => a.year))].sort();
    
    document.getElementById('heroDesc').textContent =
        `${total} 篇文章，${wan} 万字思考`;
    document.getElementById('mobileYearBadge').textContent =
        years.join('-');
}

// ============================================
// 侧边栏导航
// ============================================
function renderNavigation() {
    const navList = document.getElementById('navList');
    const filtered = currentYear === 'all'
        ? articles
        : articles.filter(a => String(a.year) === currentYear);

    // Group by category
    const cats = {};
    filtered.forEach(a => {
        const cat = a.category || '其他';
        if (!cats[cat]) cats[cat] = [];
        cats[cat].push(a);
    });

    let html = '';
    for (const [cat, items] of Object.entries(cats)) {
        html += `<li class="nav-category">${esc(cat)}</li>`;
        items.forEach(a => {
            html += `
                <li>
                    <a href="#article-${a.id}" data-id="${a.id}">
                        <span class="nav-number">${cnNum(a.id)}</span>
                        <span style="flex:1;min-width:0">${esc(a.title)}</span>
                        <span class="nav-year-badge">${a.year}</span>
                    </a>
                </li>`;
        });
    }

    if (!filtered.length) {
        html = '<li class="nav-category" style="text-align:center;padding:20px">暂无文章</li>';
    }

    navList.innerHTML = html;

    // Click handler
    navList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            closeSidebar();
            navList.querySelectorAll('a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

// ============================================
// 文章渲染
// ============================================
function renderArticles() {
    const container = document.getElementById('articlesContainer');
    const filtered = currentYear === 'all'
        ? articles
        : articles.filter(a => String(a.year) === currentYear);

    if (!filtered.length) {
        container.innerHTML = '<div class="empty-state"><p>该年份暂无文章</p></div>';
        return;
    }

    // Group by year with section headers
    const years = {};
    filtered.forEach(a => {
        if (!years[a.year]) years[a.year] = [];
        years[a.year].push(a);
    });

    let html = '';
    const yearColors = {2022:'year-2022', 2023:'year-2023', 2024:'year-2024'};
    const yearStrs = {2022:'二〇二二', 2023:'二〇二三', 2024:'二〇二四'};

    for (const [year, yearArticles] of Object.entries(years).sort()) {
        if (currentYear === 'all') {
            html += `<h3 class="year-section-title">${yearStrs[year] || year}</h3>`;
        }

        yearArticles.forEach(a => {
            const paras = a.content_paragraphs || [];
            const bodyHtml = paras.map(p => `<p>${esc(p)}</p>`).join('\n');
            const badgeClass = yearColors[a.year] || 'year-2022';
            const wordStr = Math.round((a.word_count || 0) / 100) * 100;

            html += `
                <article class="article-card" id="article-${a.id}" data-year="${a.year}">
                    <header class="article-header">
                        <span class="article-year-badge ${badgeClass}">${a.year}</span>
                        <h2 class="article-title">${esc(a.title)}</h2>
                        ${a.subtitle ? `<p class="article-subtitle">${esc(a.subtitle)}</p>` : ''}
                        <div class="article-meta">
                            <span class="article-category">${esc(a.category || '')}</span>
                            <span>约 ${wordStr} 字</span>
                        </div>
                    </header>
                    <div class="article-body">${bodyHtml}</div>
                </article>`;
        });
    }

    container.innerHTML = html;

    // Re-bind observers
    setTimeout(() => {
        setupScrollObservers();
    }, 100);
}

// ============================================
// 年份过滤
// ============================================
function setupYearFilter() {
    const btns = document.querySelectorAll('.year-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentYear = btn.dataset.year;
            renderNavigation();
            renderArticles();
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ============================================
// 滚动处理
// ============================================
function setupScrollHandlers() {
    // Progress bar
    window.addEventListener('scroll', () => {
        const st = window.scrollY;
        const dh = document.documentElement.scrollHeight - window.innerHeight;
        const pct = dh > 0 ? (st / dh) * 100 : 0;
        document.getElementById('progressBar').style.width = Math.min(pct, 100) + '%';
    }, { passive: true });

    setupScrollObservers();
}

function setupScrollObservers() {
    // Fade-in
    const fadeObs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.article-card').forEach(card => fadeObs.observe(card));

    // Active nav highlight
    const navObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const id = e.target.id;
                document.querySelectorAll('#navList a').forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === '#' + id);
                });
            }
        });
    }, { threshold: 0.15, rootMargin: '-80px 0px -40% 0px' });

    document.querySelectorAll('.article-card').forEach(card => navObs.observe(card));
}

// ============================================
// 移动端菜单
// ============================================
function setupMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    toggle.addEventListener('click', () => {
        const open = sidebar.classList.contains('open');
        open ? closeSidebar() : openSidebar();
    });
    overlay.addEventListener('click', closeSidebar);
}

function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('active');
    document.getElementById('menuToggle').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('menuToggle').classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================
// 回到顶部
// ============================================
function setupBackToTop() {
    const btn = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ============================================
// 访问统计
// ============================================
function updateVisitCounter() {
    const storageKey = 'luotiantian_visit_count';
    const sessionKey = 'luotiantian_session_v2';

    let count = parseInt(localStorage.getItem(storageKey) || '0', 10);
    const hasVisited = sessionStorage.getItem(sessionKey);

    if (!hasVisited) {
        count += 1;
        localStorage.setItem(storageKey, String(count));
        sessionStorage.setItem(sessionKey, '1');
    }

    const el = document.getElementById('visitCount');
    if (el) {
        animateCount(el, 0, count, 1000);
    }
}

function animateCount(el, from, to, duration) {
    const start = performance.now();
    function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(from + (to - from) * eased).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

// ============================================
// 键盘
// ============================================
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSidebar();
});

// ============================================
// 启动
// ============================================
document.addEventListener('DOMContentLoaded', loadArticles);
