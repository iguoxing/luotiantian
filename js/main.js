/**
 * 罗罗作品集 - 主脚本
 */

// ============================================
// 文章数据加载
// ============================================
let articles = [];

function loadArticles() {
    try {
        if (window.ARTICLES_DATA && Array.isArray(window.ARTICLES_DATA)) {
            articles = window.ARTICLES_DATA;
            initApp();
        } else {
            // Fallback: try fetch
            fetch('articles.json')
                .then(r => r.json())
                .then(data => {
                    articles = data;
                    initApp();
                })
                .catch(() => {
                    document.getElementById('articlesContainer').innerHTML =
                        '<p style="text-align:center;padding:80px;color:#999;">文章加载失败，请刷新页面重试</p>';
                });
        }
    } catch (err) {
        console.error('Failed to load articles:', err);
        document.getElementById('articlesContainer').innerHTML =
            '<p style="text-align:center;padding:80px;color:#999;">文章加载失败，请刷新页面重试</p>';
    }
}

// ============================================
// 中文数字转换
// ============================================
function toChineseNumber(n) {
    const map = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三'];
    return map[n] || n;
}

// ============================================
// 初始化应用
// ============================================
function initApp() {
    renderNavigation();
    renderArticles();
    setupScrollHandlers();
    setupMobileMenu();
    setupBackToTop();
    updateVisitCounter();
    setupActiveNavHighlight();
}

// ============================================
// 渲染侧边栏导航
// ============================================
function renderNavigation() {
    const navList = document.getElementById('navList');
    const categories = {};

    // Group by category
    articles.forEach(article => {
        if (!categories[article.category]) {
            categories[article.category] = [];
        }
        categories[article.category].push(article);
    });

    let html = '';
    for (const [category, items] of Object.entries(categories)) {
        html += `<li class="nav-category">${category}</li>`;
        items.forEach(article => {
            html += `
                <li>
                    <a href="#article-${article.id}" data-id="${article.id}">
                        <span class="nav-number">${toChineseNumber(article.id)}</span>
                        ${article.title}
                    </a>
                </li>`;
        });
    }

    navList.innerHTML = html;

    // Nav click handler
    navList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            // Close mobile sidebar
            closeSidebar();
            // Remove active from all
            navList.querySelectorAll('a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

// ============================================
// 渲染文章
// ============================================
function renderArticles() {
    const container = document.getElementById('articlesContainer');
    let html = '';

    articles.forEach(article => {
        const paragraphs = article.content_paragraphs || [];
        const bodyHtml = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('\n');

        html += `
            <article class="article-card" id="article-${article.id}">
                <header class="article-header">
                    <div class="article-number">第 ${toChineseNumber(article.id)} 篇</div>
                    <h2 class="article-title">${escapeHtml(article.title)}</h2>
                    <p class="article-subtitle">${escapeHtml(article.subtitle)}</p>
                    <div class="article-meta">
                        <span class="article-category">${escapeHtml(article.category)}</span>
                        <span>约 ${Math.round(article.word_count / 100) * 100} 字</span>
                    </div>
                </header>
                <div class="article-body">
                    ${bodyHtml}
                </div>
            </article>`;
    });

    container.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// 滚动处理
// ============================================
function setupScrollHandlers() {
    // 阅读进度条
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        document.getElementById('progressBar').style.width = Math.min(progress, 100) + '%';
    }, { passive: true });

    // 文章淡入动画 (Intersection Observer)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.article-card').forEach(card => {
        observer.observe(card);
    });
}

// ============================================
// 高亮当前导航
// ============================================
function setupActiveNavHighlight() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                const navLinks = document.querySelectorAll('#navList a');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '-80px 0px -50% 0px'
    });

    document.querySelectorAll('.article-card').forEach(card => {
        observer.observe(card);
    });
}

// ============================================
// 移动端菜单
// ============================================
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    menuToggle.addEventListener('click', () => {
        const isOpen = sidebar.classList.contains('open');
        if (isOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
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
        if (window.scrollY > 600) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============================================
// 访问统计
// ============================================
function updateVisitCounter() {
    const storageKey = 'luotiantian_visit_count';
    const sessionKey = 'luotiantian_session';

    // 获取当前计数
    let count = parseInt(localStorage.getItem(storageKey) || '0', 10);
    const hasVisited = sessionStorage.getItem(sessionKey);

    // 新会话则计数+1
    if (!hasVisited) {
        count += 1;
        localStorage.setItem(storageKey, count.toString());
        sessionStorage.setItem(sessionKey, '1');
    }

    // 显示计数
    const countEl = document.getElementById('visitCount');
    if (countEl) {
        // 动画显示数字
        animateNumber(countEl, 0, count, 1200);
    }
}

function animateNumber(el, start, end, duration) {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * eased);

        el.textContent = current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// ============================================
// 键盘快捷键
// ============================================
document.addEventListener('keydown', (e) => {
    // ESC 关闭侧边栏
    if (e.key === 'Escape') {
        closeSidebar();
    }
});

// ============================================
// 启动
// ============================================
document.addEventListener('DOMContentLoaded', loadArticles);
