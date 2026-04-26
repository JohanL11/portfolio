(function () {
    // ── Copie email au clic ──
    var emailItem = document.getElementById('emailCopyItem');
    if (emailItem) {
        emailItem.addEventListener('mouseenter', function () {
            emailItem.style.background = 'rgba(99,102,241,0.05)';
        });
        emailItem.addEventListener('mouseleave', function () {
            emailItem.style.background = '';
        });
        emailItem.addEventListener('click', function () {
            navigator.clipboard.writeText('louap.johan@outlook.fr').then(function () {
                var badge = document.getElementById('emailCopyBadge');
                if (!badge) return;
                badge.style.opacity = '1';
                setTimeout(function () { badge.style.opacity = '0'; }, 2500);
            });
        });
    }

    // ── Confetti au succès du formulaire ──
    function confetti() {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        var cnv = document.createElement('canvas');
        cnv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
        document.body.appendChild(cnv);
        var dpr = window.devicePixelRatio || 1;
        var w = cnv.width  = window.innerWidth  * dpr;
        var h = cnv.height = window.innerHeight * dpr;
        cnv.style.width  = window.innerWidth  + 'px';
        cnv.style.height = window.innerHeight + 'px';

        var ctx = cnv.getContext('2d');
        ctx.scale(dpr, dpr);

        var colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#a78bfa'];
        var parts  = [];
        var W = window.innerWidth, H = window.innerHeight;

        function spawn(originX) {
            for (var i = 0; i < 90; i++) {
                var angle = (-Math.PI / 2) + (Math.random() - 0.5) * (Math.PI * 0.7);
                var speed = 8 + Math.random() * 9;
                parts.push({
                    x: originX,
                    y: H * 0.6,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: colors[(Math.random() * colors.length) | 0],
                    size: 5 + Math.random() * 7,
                    rot: Math.random() * Math.PI * 2,
                    vrot: (Math.random() - 0.5) * 0.25,
                    life: 1
                });
            }
        }
        spawn(W * 0.3);
        spawn(W * 0.7);

        var t0 = performance.now();
        function tick(now) {
            ctx.clearRect(0, 0, W, H);
            var alive = 0;
            parts.forEach(function (p) {
                p.vy += 0.32;
                p.vx *= 0.995;
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vrot;
                if (p.y > H + 40) p.life = 0;
                if (p.life <= 0) return;
                alive++;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                ctx.restore();
            });
            if (alive > 0 && now - t0 < 5000) {
                requestAnimationFrame(tick);
            } else {
                cnv.remove();
            }
        }
        requestAnimationFrame(tick);
    }

    // Détection d'un flash success affiché par Symfony après PRG
    var flashSuccess = document.querySelector('.flash--success');
    if (flashSuccess) {
        // léger délai pour laisser la page se peindre
        setTimeout(confetti, 180);
    }
})();
