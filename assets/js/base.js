(function () {
    function applyThemeIcons(theme) {
        var moon = document.getElementById('themeIconMoon');
        var sun  = document.getElementById('themeIconSun');
        if (!moon || !sun) return;
        if (theme === 'light') { moon.style.display = 'none'; sun.style.display = ''; }
        else                  { moon.style.display = '';     sun.style.display = 'none'; }
    }

    function initTheme() {
        var theme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        applyThemeIcons(theme);
        var btn = document.getElementById('themeToggle');
        if (!btn) return;
        btn.onclick = function () {
            var current = document.documentElement.getAttribute('data-theme');
            var next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            applyThemeIcons(next);
        };
    }

    function initBackToTop() {
        var btn = document.getElementById('backToTop');
        if (!btn) return;
        window.addEventListener('scroll', function () {
            btn.classList.toggle('visible', window.scrollY > 400);
        }, { passive: true });
        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function applyGlow(selector, darkColor, lightColor) {
        document.querySelectorAll(selector).forEach(function (card) {
            if (card.dataset.glowInit) return;
            card.dataset.glowInit = '1';
            card.addEventListener('mousemove', function (e) {
                var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
                var color  = isDark ? darkColor : (lightColor || 'rgba(99,102,241,0.07)');
                var r = card.getBoundingClientRect();
                var x = ((e.clientX - r.left) / r.width)  * 100;
                var y = ((e.clientY - r.top)  / r.height) * 100;
                card.style.backgroundImage = 'radial-gradient(circle at ' + x + '% ' + y + '%, ' + color + ' 0%, transparent 65%)';
            });
            card.addEventListener('mouseleave', function () { card.style.backgroundImage = ''; });
        });
    }

    function initGlobalGlow() {
        applyGlow('.project-card',      'rgba(255,255,255,0.04)', 'rgba(99,102,241,0.06)');
        applyGlow('.skill-card',        'rgba(255,255,255,0.04)', 'rgba(99,102,241,0.06)');
        applyGlow('.cta-box',           'rgba(255,255,255,0.03)', 'rgba(99,102,241,0.05)');
        applyGlow('.timeline__content', 'rgba(255,255,255,0.04)', 'rgba(99,102,241,0.06)');
        applyGlow('.edu-card',          'rgba(255,255,255,0.04)', 'rgba(99,102,241,0.06)');
        applyGlow('.lol-teaser__card',  'rgba(200,170,110,0.08)', 'rgba(200,170,110,0.08)');
        applyGlow('.security-badge',    'rgba(255,255,255,0.05)', 'rgba(99,102,241,0.07)');
    }

    function initNavbar() {
        if (window._navInitialized) return;
        window._navInitialized = true;
        document.addEventListener('click', function (e) {
            if (e.target.closest('#navToggle')) {
                var nl = document.getElementById('navLinks');
                if (nl) nl.classList.toggle('open');
                return;
            }
            if (e.target.closest('#navLinks .navbar__link')) {
                var nl = document.getElementById('navLinks');
                if (nl) nl.classList.remove('open');
            }
        });
    }

    document.addEventListener('turbo:load', function () {
        initGlobalGlow();
        initTheme();
        initBackToTop();
        initNavbar();
    });
    initGlobalGlow();
    initTheme();
    initBackToTop();
    initNavbar();

    document.addEventListener('turbo:before-render', function () {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    });
    document.addEventListener('turbo:render', function () {
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                window.scrollTo({ top: 0, behavior: 'instant' });
            });
        });
    });
})();
