(function () {
    var raw = document.getElementById('projects-data');
    if (!raw) return;
    var projectsData = JSON.parse(raw.textContent);

    function getLocale() { return window.APP_LOCALE || document.documentElement.lang || 'fr'; }

    // ── TECH TAG COLORS ──
    var TAG_COLORS = {
        'php': [139,92,246], 'symfony': [99,102,241],
        'react': [6,182,212], 'javascript': [245,158,11], 'jquery': [245,158,11],
        'typescript': [49,120,198], 'sql': [16,185,129], 'mysql': [16,185,129],
        'postgresql': [16,185,129], 'linux': [239,68,68], 'docker': [14,165,233],
        'nginx': [0,153,0], 'apache': [0,153,0], 'git': [249,115,22],
        'github': [249,115,22], 'api': [236,72,153], 'python': [55,118,171],
    };
    function tagStyle(tag) {
        var key = Object.keys(TAG_COLORS).find(function (k) { return tag.toLowerCase().startsWith(k); });
        if (!key) return '';
        var rgb = TAG_COLORS[key];
        return 'style="background:rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',.15);color:rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',.9);border-color:rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',.3)"';
    }

    // ── STATE ──
    var currentFilter = 'all';
    var currentSearch = '';
    var currentSort   = 'default';

    // ── CARD ANIMATION ──
    function hideCard(card) {
        card.classList.remove('proj-card--out');
        card.style.display = 'none';
    }
    function showCard(card, delay) {
        var wasHidden = card.style.display === 'none';
        if (!wasHidden) { card.classList.remove('proj-card--out'); return; }
        card.style.display = '';
        card.classList.add('proj-card--out');
        setTimeout(function () { card.classList.remove('proj-card--out'); }, (delay || 0) + 16);
    }

    // ── FILTER + SEARCH ──
    function applyFilters() {
        var grid     = document.getElementById('projectsGrid');
        var allCards = Array.from(grid.querySelectorAll('.project-card[data-tags]'));
        var q        = currentSearch.toLowerCase();

        var sorted = allCards.slice().sort(function (a, b) {
            if (currentSort === 'featured') {
                var af = a.dataset.featured === 'true' ? 0 : 1;
                var bf = b.dataset.featured === 'true' ? 0 : 1;
                if (af !== bf) return af - bf;
            }
            if (currentSort === 'alpha') {
                return (a.dataset.title || '').localeCompare(b.dataset.title || '');
            }
            return parseInt(a.dataset.idx) - parseInt(b.dataset.idx);
        });

        var emptyState = document.getElementById('projEmptyFilter');
        sorted.forEach(function (c) { grid.insertBefore(c, emptyState); });

        var visible = 0;
        sorted.forEach(function (card, i) {
            var tags   = JSON.parse(card.dataset.tags || '[]');
            var title  = (card.dataset.title || '').toLowerCase();
            var desc   = (card.dataset.desc  || '').toLowerCase();
            var matchTag    = currentFilter === 'all' || tags.includes(currentFilter);
            var matchSearch = !q || title.includes(q) || desc.includes(q) ||
                              tags.some(function (t) { return t.toLowerCase().includes(q); });
            if (matchTag && matchSearch) { showCard(card, visible * 35); visible++; }
            else hideCard(card);
        });

        var total = allCards.length;
        var word = getLocale() === 'en' ? ' project' : ' projet';
        var label = visible === total
            ? total + word + (total > 1 ? 's' : '')
            : visible + ' / ' + total + word + (total > 1 ? 's' : '');
        document.getElementById('projCount').textContent = label;
        emptyState.style.display = visible === 0 ? 'block' : 'none';
    }

    function resetFilters() {
        currentFilter = 'all'; currentSearch = ''; currentSort = 'default';
        var searchInput = document.getElementById('projSearch');
        var clearBtn    = document.getElementById('projSearchClear');
        if (searchInput) searchInput.value = '';
        if (clearBtn) clearBtn.classList.remove('visible');
        document.querySelectorAll('.proj-filter-tab').forEach(function (b) { b.classList.remove('active'); });
        var allTab = document.querySelector('.proj-filter-tab[data-filter="all"]');
        if (allTab) allTab.classList.add('active');
        document.querySelectorAll('.proj-sort__btn').forEach(function (b) { b.classList.remove('active'); });
        var defSort = document.querySelector('.proj-sort__btn[data-sort="default"]');
        if (defSort) defSort.classList.add('active');
        applyFilters();
    }

    // ── MODAL ──
    var SVG_LINK = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>';

    function openProjectModal(idx) {
        var p = projectsData[idx];
        if (!p) return;
        document.getElementById('projModalIcon').textContent  = p.icon;
        document.getElementById('projModalTitle').textContent = p.title;
        var links = [
            p.githubUrl ? '<a href="' + p.githubUrl + '" target="_blank" rel="noopener" class="btn btn--ghost btn--sm">GitHub ' + SVG_LINK + '</a>' : null,
            p.liveUrl   ? '<a href="' + p.liveUrl   + '" target="_blank" rel="noopener" class="btn btn--primary btn--sm">Demo live ' + SVG_LINK + '</a>' : null,
        ].filter(Boolean);
        var featuredLabel = getLocale() === 'en' ? '⭐ Featured' : '⭐ Mis en avant';
        document.getElementById('projModalContent').innerHTML =
            (p.featured ? '<div class="proj-modal__meta"><span class="proj-modal__featured">' + featuredLabel + '</span></div>' : '') +
            '<p class="proj-modal__desc">' + p.description + '</p>' +
            '<div class="proj-modal__tags">' + p.tags.map(function (t) { return '<span class="tag" ' + tagStyle(t) + '>' + t + '</span>'; }).join('') + '</div>' +
            (links.length ? '<div class="proj-modal__links">' + links.join('') + '</div>' : '');
        document.getElementById('projectModal').classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeProjectModal() {
        document.getElementById('projectModal').classList.remove('open');
        document.body.style.overflow = '';
    }

    // ── INIT ──
    function initProjects() {
        // Filters
        var tabs = document.getElementById('projectFilterTabs');
        if (!tabs) return;
        var newTabs = tabs.cloneNode(true);
        tabs.parentNode.replaceChild(newTabs, tabs);
        newTabs.addEventListener('click', function (e) {
            var btn = e.target.closest('.proj-filter-tab');
            if (!btn || btn.id === 'projMoreBtn') return;
            newTabs.querySelectorAll('.proj-filter-tab').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            applyFilters();
        });

        // "Voir plus" tags
        var moreBtn = document.getElementById('projMoreBtn');
        if (moreBtn) {
            moreBtn.addEventListener('click', function () {
                var expanded = moreBtn.classList.toggle('expanded');
                document.querySelectorAll('.proj-filter-tab--extra').forEach(function (b) {
                    b.classList.toggle('revealed', expanded);
                });
                var extraBtns = document.querySelectorAll('.proj-filter-tab--extra');
                moreBtn.textContent = expanded ? '▲ Réduire' : '+' + extraBtns.length + ' autres';
            });
        }

        // Sort
        var sortBar = document.getElementById('projSort');
        if (sortBar) {
            sortBar.addEventListener('click', function (e) {
                var btn = e.target.closest('.proj-sort__btn');
                if (!btn) return;
                document.querySelectorAll('.proj-sort__btn').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentSort = btn.dataset.sort;
                applyFilters();
            });
        }

        // Search
        var searchInput = document.getElementById('projSearch');
        var clearBtn    = document.getElementById('projSearchClear');
        if (searchInput) {
            var debounce;
            searchInput.addEventListener('input', function () {
                currentSearch = searchInput.value.trim();
                if (clearBtn) clearBtn.classList.toggle('visible', currentSearch.length > 0);
                clearTimeout(debounce);
                debounce = setTimeout(applyFilters, 180);
            });
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                if (searchInput) searchInput.value = '';
                currentSearch = '';
                clearBtn.classList.remove('visible');
                applyFilters();
            });
        }

        // Card clicks + link stop-propagation
        document.querySelectorAll('.project-card[data-idx]:not([data-listener])').forEach(function (card) {
            card.dataset.listener = '1';
            card.addEventListener('click', function () {
                openProjectModal(parseInt(card.dataset.idx));
            });
        });
        document.querySelectorAll('.project-card__link:not([data-sp])').forEach(function (link) {
            link.dataset.sp = '1';
            link.addEventListener('click', function (e) { e.stopPropagation(); });
        });

        // Modal backdrop + close button
        var projModal = document.getElementById('projectModal');
        if (projModal && !projModal.dataset.initialized) {
            projModal.dataset.initialized = '1';
            projModal.addEventListener('click', function (e) {
                if (e.target === projModal) closeProjectModal();
            });
            var modalClose = projModal.querySelector('.proj-modal__close');
            if (modalClose) modalClose.addEventListener('click', closeProjectModal);
        }

        // Reset button
        var resetBtn = document.querySelector('.proj-empty-filter__reset');
        if (resetBtn && !resetBtn.dataset.initialized) {
            resetBtn.dataset.initialized = '1';
            resetBtn.addEventListener('click', resetFilters);
        }
    }

    function initProjCounters() {
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                var el     = e.target;
                var target = parseInt(el.dataset.count) || 0;
                var dur = 800, t0 = performance.now();
                var tick = function (now) {
                    var p = Math.min((now - t0) / dur, 1);
                    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
                    if (p < 1) requestAnimationFrame(tick);
                    else el.textContent = target;
                };
                requestAnimationFrame(tick);
                obs.unobserve(el);
            });
        }, { threshold: 0.5 });
        document.querySelectorAll('.pstat-value[data-count]').forEach(function (el) { obs.observe(el); });
    }

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeProjectModal(); });

    function init() {
        currentFilter = 'all'; currentSearch = ''; currentSort = 'default';
        initProjects();
        initProjCounters();
    }

    init();
    document.addEventListener('turbo:load', init);
})();
