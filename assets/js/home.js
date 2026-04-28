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

    // ── TERMINAL INTERACTIF ──
    function initTerminal() {
        var body = document.getElementById('heroTerminal');
        if (!body || body.dataset.initialized) return;
        body.dataset.initialized = '1';
        body.innerHTML = '';

        var locale = (window.APP_LOCALE === 'en') ? 'en' : 'fr';
        var T = {
            fr: {
                hello:    'Bienvenue. Tape "help" pour la liste des commandes.',
                helpHead: 'Commandes disponibles :',
                cmds: [
                    ['help',    'liste des commandes'],
                    ['whoami',  'qui suis-je'],
                    ['skills',  'stack technique'],
                    ['xp',      'expérience pro'],
                    ['contact', 'comment me joindre'],
                    ['cv',      'télécharger le CV'],
                    ['social',  'liens externes'],
                    ['lol',     'stats LoL — "lol -g" pour ouvrir la page'],
                    ['lang',    'changer de langue — "lang fr" ou "lang en"'],
                    ['theme',   'switch dark/light'],
                    ['clear',   'vider le terminal'],
                ],
                whoami:  'Johan Louap — Développeur Full Stack Web & Mobile',
                skills:  'PHP 8 · Symfony 7 · React Native · API REST · MySQL · Linux',
                xp:      '7 ans (CDI 4 ans @ Iriga Networks · Pontoise 95)',
                contact: 'louap.johan@outlook.fr · 06 47 93 44 34',
                cv:      'CV téléchargé — voir l\'onglet Téléchargements.',
                social:  'GitHub : github.com/JohanL11',
                lol:     'Master · EUW · LE11KO#9211',
                lolHint: 'Tape "lol -g" (ou "lol --go") pour ouvrir la page.',
                lolGo:   'Redirection vers la page League...',
                langCurrent: 'Langue actuelle : français.',
                langHint:    'Options : "lang fr" / "lang en" (ou --fr / --en, -f / -e).',
                langSame:    'Déjà en français.',
                langSwitch:  'Bascule en anglais...',
                theme:   'Bascule de thème effectuée.',
                unknown: 'Commande inconnue. Tape "help".',
                cleared: ''
            },
            en: {
                hello:    'Welcome. Type "help" for the command list.',
                helpHead: 'Available commands:',
                cmds: [
                    ['help',    'list commands'],
                    ['whoami',  'about me'],
                    ['skills',  'tech stack'],
                    ['xp',      'work experience'],
                    ['contact', 'how to reach me'],
                    ['cv',      'download resume'],
                    ['social',  'external links'],
                    ['lol',     'LoL stats — "lol -g" to open the page'],
                    ['lang',    'change language — "lang fr" or "lang en"'],
                    ['theme',   'toggle dark/light'],
                    ['clear',   'clear the terminal'],
                ],
                whoami:  'Johan Louap — Full Stack Web & Mobile Developer',
                skills:  'PHP 8 · Symfony 7 · React Native · REST API · MySQL · Linux',
                xp:      '7 years (4y full-time @ Iriga Networks · Pontoise, France)',
                contact: 'louap.johan@outlook.fr · +33 6 47 93 44 34',
                cv:      'Resume downloaded — check your Downloads folder.',
                social:  'GitHub: github.com/JohanL11',
                lol:     'Master · EUW · LE11KO#9211',
                lolHint: 'Type "lol -g" (or "lol --go") to open the page.',
                lolGo:   'Redirecting to the League page...',
                langCurrent: 'Current language: English.',
                langHint:    'Options: "lang fr" / "lang en" (or --fr / --en, -f / -e).',
                langSame:    'Already in English.',
                langSwitch:  'Switching to French...',
                theme:   'Theme toggled.',
                unknown: 'Unknown command. Type "help".',
            }
        }[locale];

        var promptStr = '$ ';
        var inputEl = null;
        var activeLine = null;

        function newLine(cls) {
            var d = document.createElement('div');
            d.className = 'terminal-line' + (cls ? ' ' + cls : '');
            body.appendChild(d);
            return d;
        }

        function out(text, cls) {
            var d = newLine('terminal-line--out' + (cls ? ' ' + cls : ''));
            d.style.opacity = '0';
            d.textContent = text;
            requestAnimationFrame(function () {
                d.style.transition = 'opacity 0.25s ease';
                d.style.opacity = '1';
            });
            scrollDown();
        }

        function scrollDown() {
            body.scrollTop = body.scrollHeight;
        }

        function typeCmd(cmd, done) {
            var row = newLine();
            row.innerHTML = '<span class="terminal-ps">' + promptStr + '</span><span class="terminal-cmd"></span><span class="terminal-caret"> </span>';
            var cmdEl = row.querySelector('.terminal-cmd');
            var caret = row.querySelector('.terminal-caret');
            var i = 0;
            function tk() {
                if (i >= cmd.length) { caret.remove(); setTimeout(done, 280); return; }
                cmdEl.textContent += cmd[i++];
                scrollDown();
                setTimeout(tk, 45 + Math.random() * 35);
            }
            setTimeout(tk, 220);
        }

        function logCmd(cmd) {
            fetch('/api/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'terminal_cmd', cmd: cmd }),
            }).catch(function () {});
        }

        function execCommand(raw) {
            var input = (raw || '').trim().toLowerCase();
            if (!input) { showPrompt(); return; }
            logCmd(input);
            var parts = input.split(/\s+/);
            var cmd   = parts[0];
            var args  = parts.slice(1);

            // Compatibilité : "rm -rf /" → cmd="rm", "sudo su" → cmd="sudo"
            switch (cmd) {
                case 'help':
                    out(T.helpHead);
                    T.cmds.forEach(function (c) {
                        out('  ' + c[0].padEnd(10, ' ') + '— ' + c[1]);
                    });
                    break;
                case 'whoami':  out(T.whoami); break;
                case 'skills':  out(T.skills); break;
                case 'xp':
                case 'experience': out(T.xp); break;
                case 'contact': out(T.contact); break;
                case 'cv':
                case 'resume':
                    out(T.cv);
                    var a = document.createElement('a');
                    a.href = '/files/cv-johan-louap.pdf';
                    a.download = 'CV_Johan_Louap.pdf';
                    document.body.appendChild(a); a.click(); a.remove();
                    break;
                case 'social':
                case 'github': out(T.social); break;
                case 'lol':
                    out(T.lol);
                    if (args[0] === '--go' || args[0] === '-g') {
                        out(T.lolGo);
                        setTimeout(function () { window.location.href = '/league'; }, 700);
                        return; // pas de re-prompt, on quitte
                    }
                    out(T.lolHint);
                    break;
                case 'lang':
                case 'locale':
                    var target = null;
                    if (args[0] === 'fr' || args[0] === '--fr' || args[0] === '-f') target = 'fr';
                    else if (args[0] === 'en' || args[0] === '--en' || args[0] === '-e') target = 'en';

                    if (!target) {
                        out(T.langCurrent);
                        out(T.langHint);
                        break;
                    }
                    if (target === locale) {
                        out(T.langSame);
                        break;
                    }
                    out(T.langSwitch);
                    setTimeout(function () { window.location.href = '/locale/' + target; }, 700);
                    return; // pas de re-prompt, on quitte
                case 'theme':
                    var btn = document.getElementById('themeToggle');
                    if (btn) btn.click();
                    out(T.theme);
                    break;
                case 'clear':
                case 'cls':
                    body.innerHTML = '';
                    showPrompt(true);
                    return;
                case 'sudo':
                    out('Permission denied: nice try.');
                    break;
                case 'rm':
                    out('🔥 ... just kidding.');
                    break;
                case 'exit':
                case 'quit':
                    out('Bye.');
                    return;
                case 'ls':
                    out('home/  projects/  services/  league/  contact/');
                    break;
                default:
                    out(T.unknown);
            }
            showPrompt();
        }

        function showPrompt(skipIntro) {
            // ligne saisie
            activeLine = newLine();
            activeLine.innerHTML = '<span class="terminal-ps">' + promptStr + '</span><span class="terminal-input" contenteditable="true" spellcheck="false" autocapitalize="off" autocorrect="off"></span><span class="terminal-caret terminal-caret--blink"> </span>';
            inputEl = activeLine.querySelector('.terminal-input');
            if (!window.matchMedia('(pointer: coarse)').matches) {
                inputEl.focus({ preventScroll: true });
            }
            scrollDown();

            inputEl.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    var v = inputEl.textContent;
                    // Geler la ligne courante
                    activeLine.querySelector('.terminal-caret').remove();
                    inputEl.removeAttribute('contenteditable');
                    inputEl.classList.add('terminal-cmd');
                    inputEl.classList.remove('terminal-input');
                    activeLine = null;
                    inputEl = null;
                    execCommand(v);
                }
            });
        }

        // Intro scriptée puis prompt
        var intro = [
            { cmd: 'whoami',  out: T.whoami },
            { cmd: 'skills',  out: T.skills },
        ];
        var idx = 0;
        function playIntro() {
            if (idx >= intro.length) {
                out(T.hello);
                showPrompt();
                return;
            }
            var it = intro[idx++];
            typeCmd(it.cmd, function () {
                out(it.out);
                setTimeout(playIntro, 520);
            });
        }
        setTimeout(playIntro, 450);

        // Au clic dans la zone terminal, refocus l'input s'il existe
        body.addEventListener('click', function () {
            if (inputEl) inputEl.focus({ preventScroll: true });
        });
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
