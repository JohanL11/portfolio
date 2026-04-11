(function () {

    // ── Scroll vers l'ancre après navigation Turbo ────────────────────
    function scrollToAnchor() {
        var hash = window.location.hash;
        if (!hash) return;
        var target = document.querySelector(hash);
        if (!target) return;
        setTimeout(function () {
            var navHeight = (document.getElementById('navbar') || {}).offsetHeight || 70;
            var top = target.getBoundingClientRect().top + window.scrollY - navHeight - 32;
            window.scrollTo({ top: top, behavior: 'smooth' });
        }, 80);
    }

    // ── Sidenav / topnav : état actif + visibilité ────────────────────
    function initSvcNav() {
        var sections = ['ecommerce', 'web', 'mobile'];
        var sidenav  = document.getElementById('svcSidenav');
        var topnav   = document.getElementById('svcTopnav');
        var detail   = document.getElementById('servicesDetail');

        if (!sidenav || !topnav || !detail) return;

        // Visibilité du sidenav (apparaît quand la section services est visible)
        var visObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                sidenav.classList.toggle('visible', entry.isIntersecting);
            });
        }, { threshold: 0.05 });
        visObserver.observe(detail);

        // Section active (highlight le bon lien)
        var activeSection = sections[0];

        var sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    activeSection = entry.target.id;
                    updateActive(activeSection);
                }
            });
        }, {
            rootMargin: '-30% 0px -60% 0px',
            threshold: 0
        });

        sections.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) sectionObserver.observe(el);
        });

        function updateActive(id) {
            [sidenav, topnav].forEach(function (nav) {
                nav.querySelectorAll('[data-svc]').forEach(function (link) {
                    link.classList.toggle('active', link.dataset.svc === id);
                });
            });
        }

        // Clic sur les liens : scroll avec offset navbar
        [sidenav, topnav].forEach(function (nav) {
            nav.addEventListener('click', function (e) {
                var link = e.target.closest('[data-svc]');
                if (!link) return;
                e.preventDefault();
                var target = document.getElementById(link.dataset.svc);
                if (!target) return;
                var navHeight = (document.getElementById('navbar') || {}).offsetHeight || 70;
                var top = target.getBoundingClientRect().top + window.scrollY - navHeight - 24;
                window.scrollTo({ top: top, behavior: 'smooth' });
            });
        });
    }

    document.addEventListener('turbo:load', function () {
        scrollToAnchor();
        initSvcNav();
    });
    scrollToAnchor();
    initSvcNav();

})();
