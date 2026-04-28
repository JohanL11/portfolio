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

    // ── VIEW TRANSITIONS API — wrap des navigations Turbo ──
    function initViewTransitions() {
        if (typeof document.startViewTransition !== 'function') return;
        if (window._vtInit) return;
        window._vtInit = true;

        document.addEventListener('turbo:before-render', function (e) {
            if (!e.detail || typeof e.detail.resume !== 'function') return;
            e.preventDefault();
            document.startViewTransition(function () {
                e.detail.resume();
            });
        });
    }

    function initNavbar() {
        if (window._navInitialized) return;
        window._navInitialized = true;

        // Backdrop
        var backdrop = document.createElement('div');
        backdrop.className = 'nav-backdrop';
        document.body.appendChild(backdrop);

        function openNav() {
            var nl  = document.getElementById('navLinks');
            var btn = document.getElementById('navToggle');
            if (!nl) return;
            nl.classList.add('open');
            if (btn) { btn.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
            backdrop.classList.add('visible');
            document.body.style.overflow = 'hidden';
        }

        function closeNav() {
            var nl  = document.getElementById('navLinks');
            var btn = document.getElementById('navToggle');
            if (!nl) return;
            nl.classList.remove('open');
            if (btn) { btn.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
            backdrop.classList.remove('visible');
            document.body.style.overflow = '';
        }

        document.addEventListener('click', function (e) {
            if (e.target.closest('#navToggle')) {
                var nl = document.getElementById('navLinks');
                if (nl && nl.classList.contains('open')) closeNav();
                else openNav();
                return;
            }
            if (e.target.closest('#navLinks .navbar__link')) { closeNav(); return; }
            if (e.target.closest('#navLinks .lang-toggle'))  { closeNav(); return; }
        });

        backdrop.addEventListener('click', closeNav);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeNav();
        });

        // Ferme sur scroll vers le bas
        var lastScrollY = window.scrollY;
        window.addEventListener('scroll', function () {
            var nl = document.getElementById('navLinks');
            if (nl && nl.classList.contains('open') && window.scrollY > lastScrollY + 40) closeNav();
            lastScrollY = window.scrollY;
        }, { passive: true });
    }

    function syncLocale() {
        var meta = document.querySelector('meta[name="app-locale"]');
        if (!meta) return;
        var next = meta.content;
        // Si la locale a changé, vider le cache Turbo pour éviter les flashs de navbar
        // dans l'ancienne langue lors des navigations suivantes (preview de snapshot stale).
        if (window.APP_LOCALE && window.APP_LOCALE !== next && window.Turbo && window.Turbo.cache) {
            try { window.Turbo.cache.clear(); } catch (_) {}
        }
        window.APP_LOCALE = next;
    }

    document.addEventListener('turbo:load', function () {
        syncLocale();
        initGlobalGlow();
        initTheme();
        initBackToTop();
        initNavbar();
    });
    syncLocale();
    initGlobalGlow();
    initGlobalTilt();
    initTheme();
    initBackToTop();
    initNavbar();
    initViewTransitions();

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
