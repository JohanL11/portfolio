(function () {
    // ── ANNÉES ──
    function computeYears() {
        var start = new Date(2018, 8, 1);
        return Math.floor((new Date() - start) / (1000 * 60 * 60 * 24 * 365.25));
    }
    function updateYears() {
        var y = computeYears();
        var el1 = document.getElementById('heroStatYears');
        var el2 = document.getElementById('heroYears');
        if (el1) el1.textContent = y + ' ans';
        if (el2) el2.textContent = y;
    }

    // ── TYPING EFFECT ──
    var words = ['PHP Expert · Symfony & Zend', 'React Native · Mobile', 'Linux & DevOps', 'API REST', 'Full Stack Web & Mobile'];
    var wIdx = 0, cIdx = 0, deleting = false, timer = null;

    function startTyping() {
        var el = document.getElementById('heroTypingText');
        if (!el) return;
        clearTimeout(timer);
        wIdx = 0; cIdx = 0; deleting = false;
        el.textContent = '';
        tick();
    }
    function tick() {
        var el = document.getElementById('heroTypingText');
        if (!el) return;
        var word = words[wIdx];
        if (deleting) {
            cIdx--;
            el.textContent = word.slice(0, cIdx);
            if (cIdx === 0) { deleting = false; wIdx = (wIdx + 1) % words.length; timer = setTimeout(tick, 380); }
            else { timer = setTimeout(tick, 45); }
        } else {
            cIdx++;
            el.textContent = word.slice(0, cIdx);
            if (cIdx === word.length) { deleting = true; timer = setTimeout(tick, 2200); }
            else { timer = setTimeout(tick, 65); }
        }
    }

    // ── LUCIAN CULLING ──
    function initCulling() {
        var card = document.querySelector('.lol-teaser__card');
        var container = document.querySelector('.lol-teaser__culling');
        if (!card || !container) return;

        var mouseX = 40, mouseY = null;
        var interval = null;
        var clearTimer = null;
        var shotIndex = 0;

        card.addEventListener('mousemove', function (e) {
            var r = card.getBoundingClientRect();
            mouseX = e.clientX - r.left;
            mouseY = e.clientY - r.top;
        });

        card.addEventListener('mouseenter', function (e) {
            if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
            var r = card.getBoundingClientRect();
            mouseX = e.clientX - r.left;
            mouseY = e.clientY - r.top;
            shotIndex = 0;

            var flash = document.createElement('div');
            flash.className = 'lol-teaser__flash';
            container.appendChild(flash);
            setTimeout(function () { flash.remove(); }, 200);

            var MAX_SHOTS = 30;
            interval = setInterval(function () {
                if (mouseY === null || shotIndex >= MAX_SHOTS) {
                    clearInterval(interval); interval = null; return;
                }
                var w = card.offsetWidth;
                var isGun1 = shotIndex % 2 === 0;
                var gunY   = mouseY + (isGun1 ? -7 : 7);
                var jitter = (Math.random() - 0.5) * 3;
                var bw     = 50 + Math.random() * 24;
                var bh     = Math.random() < 0.3 ? 3 : 2;
                var travel = Math.max(w * 0.4, w - mouseX + 80);
                var dur    = travel / 2200 + (Math.random() - 0.5) * 0.02;

                if (shotIndex % 5 === 0) {
                    var muzzle = document.createElement('div');
                    muzzle.className = 'lol-teaser__muzzle';
                    muzzle.style.cssText = '--mx:' + mouseX + 'px;--my:' + gunY + 'px;--muzzle-delay:0s;--muzzle-dur:0.12s;';
                    container.appendChild(muzzle);
                    setTimeout(function () { muzzle.remove(); }, 250);
                }

                var bullet = document.createElement('span');
                bullet.className = 'lol-teaser__bullet';
                bullet.style.setProperty('--bullet-y', (gunY + jitter) + 'px');
                bullet.style.setProperty('--bullet-x', (mouseX - bw * 0.55) + 'px');
                bullet.style.setProperty('--bullet-dur', dur + 's');
                bullet.style.setProperty('--bullet-delay', '0s');
                bullet.style.setProperty('--bullet-w', bw + 'px');
                bullet.style.setProperty('--bullet-h', bh + 'px');
                bullet.style.setProperty('--bullet-travel', travel + 'px');
                container.appendChild(bullet);
                setTimeout(function () { bullet.remove(); }, (dur + 0.15) * 1000);
                shotIndex++;
            }, 48);
        });

        card.addEventListener('mouseleave', function () {
            clearInterval(interval); interval = null; shotIndex = 0;
            clearTimer = setTimeout(function () { container.innerHTML = ''; clearTimer = null; }, 400);
        });
    }

    // ── COMPTEURS ANIMÉS (HERO STATS) ──
    function initHeroCounters() {
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                var el = e.target;
                var target = parseInt(el.dataset.count);
                var dur = 1000, t0 = performance.now();
                (function frame(now) {
                    var p = Math.min((now - t0) / dur, 1);
                    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
                    if (p < 1) requestAnimationFrame(frame);
                    else el.textContent = target;
                })(t0);
                obs.unobserve(el);
            });
        }, { threshold: 0.5 });
        document.querySelectorAll('.hero__stat-value[data-count]').forEach(function (el) { obs.observe(el); });
    }

    // ── TERMINAL ──
    function initTerminal() {
        var body = document.getElementById('heroTerminal');
        if (!body || body.dataset.initialized) return;
        body.dataset.initialized = '1';
        body.innerHTML = '';

        var lines = [
            { cmd: 'whoami',             out: 'Johan Louap — Lead Dev Full Stack' },
            { cmd: 'experience --years', out: '7 ans · PHP · Symfony · React Native' },
            { cmd: 'cat /etc/rank',      out: '⚔  Master · League of Legends'       },
        ];
        var idx = 0;

        function appendOut(text) {
            var d = document.createElement('div');
            d.className = 'terminal-line terminal-line--out';
            d.style.opacity = '0';
            d.textContent = text;
            body.appendChild(d);
            requestAnimationFrame(function () {
                d.style.transition = 'opacity 0.3s ease';
                d.style.opacity = '1';
            });
        }

        function typeCmd(cmd, done) {
            var row = document.createElement('div');
            row.className = 'terminal-line';
            row.innerHTML = '<span class="terminal-ps">$ </span><span class="terminal-cmd"></span><span class="terminal-caret"> </span>';
            body.appendChild(row);
            var cmdEl = row.querySelector('.terminal-cmd');
            var caret  = row.querySelector('.terminal-caret');
            var i = 0;
            function type() {
                if (i >= cmd.length) { caret.remove(); setTimeout(done, 350); return; }
                cmdEl.textContent += cmd[i++];
                setTimeout(type, 50 + Math.random() * 40);
            }
            setTimeout(type, 260);
        }

        function next() {
            if (idx >= lines.length) {
                var last = document.createElement('div');
                last.className = 'terminal-line';
                last.innerHTML = '<span class="terminal-ps">$ </span><span class="terminal-caret terminal-caret--blink"> </span>';
                body.appendChild(last);
                return;
            }
            var item = lines[idx++];
            typeCmd(item.cmd, function () {
                appendOut(item.out);
                setTimeout(next, 680);
            });
        }
        setTimeout(next, 500);
    }


    // ── SKILL BARS (scroll-triggered) ──
    function initSkillBars() {
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                e.target.style.width = e.target.dataset.width + '%';
                obs.unobserve(e.target);
            });
        }, { threshold: 0.3 });
        document.querySelectorAll('.skill-card__fill[data-width]').forEach(function (el) { obs.observe(el); });
    }

    // ── REVEAL ANIMATIONS ──
    function initRevealAnimations() {
        // Section headers : clip-path staggeré
        document.querySelectorAll('.section__header:not([data-reveal])').forEach(function (header) {
            header.dataset.reveal = '1';
            var items = [
                header.querySelector('.section__tag'),
                header.querySelector('.section__title'),
                header.querySelector('.section__subtitle'),
            ].filter(Boolean);

            items.forEach(function (el, i) {
                el.style.opacity  = '0';
                el.style.clipPath = 'inset(0 0 100% 0)';
                el.style.transition = 'opacity 0.55s ease ' + (i * 0.13) + 's, clip-path 0.65s cubic-bezier(0.4,0,0.2,1) ' + (i * 0.13) + 's';
            });

            var obs = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (!e.isIntersecting) return;
                    items.forEach(function (el) {
                        el.style.opacity  = '1';
                        el.style.clipPath = 'inset(0 0 0% 0)';
                    });
                    obs.disconnect();
                });
            }, { threshold: 0.15 });
            obs.observe(header);
        });

        // Cards : blur + translateY
        var sel = '.skill-card, .edu-card, .project-card--featured, .svc-card, .timeline__item, .security-badge';
        document.querySelectorAll(sel + ':not([data-reveal])').forEach(function (el, i) {
            el.dataset.reveal = '1';
            var delay = (i % 4) * 0.07;
            el.style.opacity    = '0';
            el.style.transform  = 'translateY(26px)';
            el.style.filter     = 'blur(4px)';
            el.style.transition = [
                'opacity 0.55s ease '   + delay + 's',
                'transform 0.55s ease ' + delay + 's',
                'filter 0.55s ease '    + delay + 's',
            ].join(',');

            var obs = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (!e.isIntersecting) return;
                    var t = e.target;
                    t.style.opacity   = '1';
                    t.style.transform = 'none';
                    t.style.filter    = 'none';
                    // Nettoyer après l'animation pour restituer les transitions hover CSS
                    setTimeout(function () {
                        t.style.transition = '';
                        t.style.opacity    = '';
                        t.style.transform  = '';
                        t.style.filter     = '';
                    }, (0.6 + delay) * 1000);
                    obs.unobserve(t);
                });
            }, { threshold: 0.08 });
            obs.observe(el);
        });
    }

    // ── INIT ──
    function init() {
        updateYears();
        startTyping();
        initCulling();
        initHeroCounters();
        initTerminal();
        initSkillBars();
        initRevealAnimations();
    }

    init();
    document.addEventListener('turbo:load', init);
})();
