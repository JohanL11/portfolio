(function () {
    var raw = document.getElementById('league-data');
    if (!raw) return;
    var d = JSON.parse(raw.textContent);

    var matchesData   = d.matches;
    var ddVersion     = d.ddVersion;
    var chartData     = d.chartData;
    var queueDist     = d.queueDist;
    var masteriesData = d.masteries;
    var championStats = d.championStats || [];
    var lastGameTs    = d.lastGameTs;
    var liveGameStart = d.liveGameStart;
    var liveGamePath  = d.liveGamePath;

    function getLocale() { return window.APP_LOCALE || document.documentElement.lang || 'fr'; }

    // ── MODAL ──
    function openModal(idx) {
        var m = matchesData[idx];
        if (!m) return;

        var mins = Math.round(m.duration / 60);
        document.getElementById('modalTitle').textContent =
            m.championName + ' — ' + m.queueName + ' — ' + (m.win ? 'Victoire' : 'Défaite') + ' (' + mins + ' min)';

        var team1 = m.participants.filter(function (p) { return p.teamId === 100; });
        var team2 = m.participants.filter(function (p) { return p.teamId === 200; });
        var won1  = team1.some(function (p) { return p.win; });
        var parseDmg = function (v) { return parseInt(String(v).replace(/[^0-9]/g, '')) || 0; };
        var maxDmg   = Math.max.apply(null, m.participants.map(function (p) { return parseDmg(p.damage); }));

        function renderTeam(players, win) {
            return '<div>' +
                '<div class="team-label team-label--' + (win ? 'win' : 'loss') + '">' + (win ? 'Victoire' : 'Défaite') + '</div>' +
                '<div class="modal-participants">' +
                players.map(function (p) {
                    var items = p.items.concat(p.trinket > 0 ? [p.trinket] : []).map(function (id, i) {
                        return '<img src="https://ddragon.leagueoflegends.com/cdn/' + ddVersion + '/img/item/' + id + '.png" alt="item"' + (i === p.items.length ? ' style="opacity:.55"' : '') + '>';
                    }).join('');
                    var dmgPct = maxDmg > 0 ? Math.round(parseDmg(p.damage) / maxDmg * 100) : 0;
                    return '<div class="modal-player ' + (p.isMe ? 'modal-player--me' : '') + '">' +
                        '<img src="' + p.imageUrl + '" alt="' + p.championName + '">' +
                        '<div style="flex:1;min-width:0;">' +
                        '<div style="display:flex;align-items:center;gap:0.45rem;">' +
                        '<div class="modal-player__name">' + p.name + '</div>' +
                        '<div class="modal-player__kda">' + p.kills + '/' + p.deaths + '/' + p.assists + '</div>' +
                        (p.pentaKills > 0 ? '<span style="font-size:0.65rem;color:#f0c040;font-weight:800;margin-left:auto;">PENTA</span>' : '') +
                        '</div>' +
                        '<div style="display:flex;align-items:center;gap:0.4rem;margin-top:0.25rem;">' +
                        '<span style="font-size:0.63rem;color:#777;width:32px;flex-shrink:0;">' + p.cs + 'cs</span>' +
                        '<span style="font-size:0.63rem;color:#a89b5c;width:44px;flex-shrink:0;">' + p.gold + 'g</span>' +
                        '<div style="width:80px;flex-shrink:0;height:4px;background:rgba(255,255,255,0.07);border-radius:999px;overflow:hidden;">' +
                        '<div style="height:100%;width:' + dmgPct + '%;background:linear-gradient(90deg,#a03030,#e05555);border-radius:999px;"></div></div>' +
                        '<span style="font-size:0.6rem;color:#c06060;width:48px;flex-shrink:0;text-align:right;">' + p.damage + '</span>' +
                        '</div></div>' +
                        '<div class="modal-player__items" style="width:148px;flex-shrink:0;align-self:center;justify-content:flex-end;">' + items + '</div>' +
                        '</div>';
                }).join('') +
                '</div></div>';
        }

        document.getElementById('modalContent').innerHTML =
            '<div class="modal-teams">' + renderTeam(team1, won1) + renderTeam(team2, !won1) + '</div>';

        document.getElementById('matchModal').classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        document.getElementById('matchModal').classList.remove('open');
        document.body.style.overflow = '';
    }

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

    // ── SHOW 5 / LOAD MORE / FILTER ──
    var PAGE_SIZE = 5;
    var showAll = false;
    var currentFilter = null;

    function applyVisibility() {
        var rows     = Array.from(document.querySelectorAll('.match-row'));
        var filtered = currentFilter
            ? rows.filter(function (r) { return currentFilter.includes(r.dataset.queue); })
            : rows;

        rows.forEach(function (r) { r.style.display = 'none'; });

        var visible = 0;
        filtered.forEach(function (r) {
            if (!showAll && visible >= PAGE_SIZE) return;
            r.style.display = '';
            visible++;
        });

        var btn = document.getElementById('loadMoreBtn');
        if (!btn) return;
        if (showAll || visible >= filtered.length) {
            btn.disabled = false;
            btn.innerHTML = 'Réduire <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>';
            btn.onclick = function () { showAll = false; applyVisibility(); };
        } else {
            btn.disabled = false;
            btn.innerHTML = 'Charger plus <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>';
            btn.onclick = loadMore;
        }
    }

    function loadMore() {
        showAll = true;
        applyVisibility();
    }

    function initFilters() {
        var tabs = document.getElementById('filterTabs');
        if (!tabs) return;
        var newTabs = tabs.cloneNode(true);
        tabs.parentNode.replaceChild(newTabs, tabs);
        newTabs.addEventListener('click', function (e) {
            var btn = e.target.closest('.filter-tab');
            if (!btn) return;
            newTabs.querySelectorAll('.filter-tab').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var filter = btn.dataset.filter;
            currentFilter = filter === 'all' ? null : filter.split(',');
            showAll = false;
            applyVisibility();
        });
    }

    // ── HELPERS VISUEL ──
    function makeAreaGradient(ctx, area, topColor, bottomColor) {
        var g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
        g.addColorStop(0, topColor);
        g.addColorStop(1, bottomColor);
        return g;
    }

    // Plugin glow : ombre douce sur la ligne et les points (datasets de type "line")
    var glowLinePlugin = {
        id: 'glowLine',
        beforeDatasetDraw: function (chart, args) {
            if (!args.meta || args.meta.type !== 'line') return;
            var opts = (chart.options.plugins && chart.options.plugins.glowLine) || {};
            chart.ctx.save();
            chart.ctx.shadowColor = opts.color || 'rgba(200,170,110,0.55)';
            chart.ctx.shadowBlur  = opts.blur  || 14;
        },
        afterDatasetDraw: function (chart, args) {
            if (!args.meta || args.meta.type !== 'line') return;
            chart.ctx.restore();
        }
    };

    // Plugin shadow : drop-shadow sous le doughnut pour le décoller du fond
    var arcShadowPlugin = {
        id: 'arcShadow',
        beforeDatasetDraw: function (chart, args) {
            if (!args.meta || args.meta.type !== 'doughnut') return;
            chart.ctx.save();
            chart.ctx.shadowColor = 'rgba(0,0,0,0.55)';
            chart.ctx.shadowBlur  = 16;
            chart.ctx.shadowOffsetY = 4;
        },
        afterDatasetDraw: function (chart, args) {
            if (!args.meta || args.meta.type !== 'doughnut') return;
            chart.ctx.restore();
        }
    };

    // ── CHART KDA ──
    var kdaChartInstance = null;

    function buildChart() {
        var canvas = document.getElementById('kdaChart');
        if (!canvas || typeof Chart === 'undefined') return;
        if (kdaChartInstance) { kdaChartInstance.destroy(); kdaChartInstance = null; }
        kdaChartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels: chartData.map(function (_, i) { return i + 1; }),
                datasets: [{
                    data: chartData.map(function (d) { return d.kda; }),
                    borderColor: '#C8AA6E',
                    backgroundColor: function (context) {
                        var c = context.chart;
                        if (!c.chartArea) return 'rgba(200,170,110,0.08)';
                        return makeAreaGradient(c.ctx, c.chartArea, 'rgba(200,170,110,0.38)', 'rgba(200,170,110,0)');
                    },
                    pointBackgroundColor: chartData.map(function (d) { return d.win ? '#4CAF50' : '#E05555'; }),
                    pointBorderColor: '#050F23',
                    pointBorderWidth: 1.5,
                    pointRadius: 5, pointHoverRadius: 8,
                    tension: 0.4, fill: true, borderWidth: 2,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                animation: { duration: 900, easing: 'easeOutQuart', onComplete: function () { var s = document.getElementById('kdaChartSkeleton'); if (s) s.remove(); } },
                plugins: {
                    legend: { display: false },
                    glowLine: { color: 'rgba(200,170,110,0.6)', blur: 16 },
                    tooltip: {
                        callbacks: {
                            title: function (items) { return chartData[items[0].dataIndex].champ; },
                            label: function (item) { return 'KDA ' + item.raw + ' — ' + chartData[item.dataIndex].score + ' — ' + (chartData[item.dataIndex].win ? 'Victoire' : 'Défaite'); },
                        },
                        backgroundColor: '#050F23', borderColor: 'rgba(200,170,110,0.3)', borderWidth: 1,
                        titleColor: '#C8AA6E', bodyColor: '#aaa',
                    }
                },
                scales: {
                    x: { display: false },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.04)' },
                        ticks: { color: '#555', font: { size: 11 } }
                    }
                }
            },
            plugins: [glowLinePlugin]
        });
    }

    // ── QUEUE DONUT ──
    var queueChartInstance = null;

    function buildQueueChart() {
        var canvas = document.getElementById('queueChart');
        if (!canvas || typeof Chart === 'undefined') return;
        if (queueChartInstance) { queueChartInstance.destroy(); queueChartInstance = null; }
        var labels = Object.keys(queueDist);
        var values = Object.values(queueDist);
        var colors = ['#C8AA6E','#0AC8B9','#9D48E0','#4CAF50','#E05555','#f0c040'];
        queueChartInstance = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#050F23',
                    hoverOffset: 10,
                    hoverBorderColor: 'rgba(200,170,110,0.4)',
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                animation: { duration: 900, easing: 'easeOutQuart', animateRotate: true, animateScale: true, onComplete: function () { var s = document.getElementById('queueChartSkeleton'); if (s) s.remove(); } },
                plugins: {
                    legend: { position: 'right', labels: { color: '#888', font: { size: 11 }, boxWidth: 12, padding: 10 } },
                    tooltip: {
                        backgroundColor: '#050F23', borderColor: 'rgba(200,170,110,0.3)', borderWidth: 1,
                        titleColor: '#C8AA6E', bodyColor: '#aaa',
                        callbacks: { label: function (item) { var g = getLocale() === 'en' ? ' game' : ' partie'; return ' ' + item.raw + g + (item.raw > 1 ? 's' : '') + ' (' + Math.round(item.raw / values.reduce(function (a, b) { return a + b; }, 0) * 100) + '%)'; } }
                    }
                },
                cutout: '65%',
            },
            plugins: [arcShadowPlugin]
        });
    }

    // ── HEATMAP ──
    var MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
    var MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    function buildHeatmap() {
        var locale = getLocale();
        var MONTHS = locale === 'en' ? MONTHS_EN : MONTHS_FR;
        var grid   = document.getElementById('heatmapGrid');
        var mLabel = document.getElementById('heatmapMonths');
        if (!grid) return;

        var dateMap = {};
        matchesData.forEach(function (m) {
            if (m.gameDateISO) dateMap[m.gameDateISO] = (dateMap[m.gameDateISO] || 0) + 1;
        });

        var today = new Date(); today.setHours(0,0,0,0);
        var startOffset = (today.getDay() + 6) % 7;
        var start = new Date(today);
        start.setDate(start.getDate() - 90 - startOffset);

        var cells = [];
        for (var dd = new Date(start); dd <= today; dd.setDate(dd.getDate() + 1)) {
            var key = dd.toISOString().slice(0, 10);
            cells.push({ key: key, count: dateMap[key] || 0, d: new Date(dd) });
        }

        var maxCount = Math.max.apply(null, cells.map(function (c) { return c.count; }).concat([1]));
        grid.innerHTML = cells.map(function (c) {
            var alpha   = c.count === 0 ? 0.06 : 0.2 + (c.count / maxCount) * 0.8;
            var dtLocale = locale === 'en' ? 'en-US' : 'fr-FR';
            var dateStr = c.d.toLocaleDateString(dtLocale, { day: 'numeric', month: 'short', year: 'numeric' });
            var gameWord = locale === 'en' ? ' game' : ' partie';
            return '<div class="heatmap-cell" title="' + dateStr + ' — ' + c.count + gameWord + (c.count !== 1 ? 's' : '') + '" style="background:rgba(200,170,110,' + alpha.toFixed(2) + ')"></div>';
        }).join('');

        if (!mLabel) return;
        var weeks = Math.ceil(cells.length / 7);
        var html = ''; var lastMonth = -1;
        for (var w = 0; w < weeks; w++) {
            var cell = cells[w * 7];
            if (!cell) { html += '<div style="width:12px"></div>'; continue; }
            var mo = cell.d.getMonth();
            if (mo !== lastMonth) {
                html += '<div class="heatmap-month-label" style="width:' + (12 + 3) + 'px">' + MONTHS[mo] + '</div>';
                lastMonth = mo;
            } else {
                html += '<div style="width:' + (12 + 3) + 'px"></div>';
            }
        }
        mLabel.innerHTML = html;
    }

    // ── LP PROGRESSION ──
    var lpChartInstance = null;

    function buildLpChart() {
        var canvas = document.getElementById('lpChart');
        if (!canvas || typeof Chart === 'undefined') return;
        if (lpChartInstance) { lpChartInstance.destroy(); lpChartInstance = null; }

        var tierVal   = { GOLD: 1, PLATINUM: 2, EMERALD: 3, DIAMOND: 4, MASTER: 5 };
        var divOff    = { 'I': 0.75, 'II': 0.5, 'III': 0.25, 'IV': 0 };
        var tierColor = { GOLD: '#C8AA6E', PLATINUM: '#4dcfc3', EMERALD: '#4cd98a', DIAMOND: '#57c8e8', MASTER: '#b77de8' };

        var seasons = [
            { label: 'S21',    tier: 'GOLD',     div: 'II',  lp: 79 },
            { label: 'S22',    tier: 'PLATINUM', div: 'IV',  lp: 36 },
            { label: 'S23 S1', tier: 'DIAMOND',  div: 'IV',  lp: 1  },
            { label: 'S23 S2', tier: 'MASTER',   div: '',    lp: 0  },
            { label: 'S24 S1', tier: 'DIAMOND',  div: 'III', lp: 0  },
            { label: 'S24 S2', tier: 'EMERALD',  div: 'I',   lp: 75 },
            { label: 'S24 S3', tier: 'EMERALD',  div: 'I',   lp: 75 },
            { label: 'S25',    tier: 'EMERALD',  div: 'III', lp: 21 },
        ];

        var values = seasons.map(function (s) { return +((tierVal[s.tier] || 1) + (divOff[s.div] !== undefined ? divOff[s.div] : 0) + s.lp / 100).toFixed(2); });
        var colors = seasons.map(function (s) { return tierColor[s.tier] || '#C8AA6E'; });

        lpChartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels: seasons.map(function (s) { return s.label; }),
                datasets: [{
                    data: values,
                    borderColor: 'rgba(200,170,110,0.65)',
                    backgroundColor: function (context) {
                        var c = context.chart;
                        if (!c.chartArea) return 'rgba(200,170,110,0.04)';
                        return makeAreaGradient(c.ctx, c.chartArea, 'rgba(200,170,110,0.22)', 'rgba(200,170,110,0)');
                    },
                    pointBackgroundColor: colors,
                    pointBorderColor: '#050F23',
                    pointBorderWidth: 1.5,
                    pointRadius: 5, pointHoverRadius: 7,
                    tension: 0.35, fill: true, borderWidth: 2,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                animation: { duration: 1000, easing: 'easeOutQuart', onComplete: function () { syncMasteryHeight(); } },
                plugins: {
                    legend: { display: false },
                    glowLine: { color: 'rgba(200,170,110,0.5)', blur: 14 },
                    tooltip: {
                        backgroundColor: '#050F23', borderColor: 'rgba(200,170,110,0.3)', borderWidth: 1,
                        titleColor: '#C8AA6E', bodyColor: '#aaa',
                        callbacks: {
                            title: function (items) { return seasons[items[0].dataIndex].label; },
                            label: function (item)  { var s = seasons[item.dataIndex]; return s.tier + (s.div ? ' ' + s.div : '') + ' · ' + s.lp + ' LP'; },
                        }
                    }
                },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#444', font: { size: 9 } } },
                    y: { display: false, min: 0.8, max: 5.9 },
                }
            },
            plugins: [glowLinePlugin]
        });
    }

    // ── SPARKLINE FORME (20 dernières) ──
    function buildSparkline() {
        var cells = document.getElementById('winrateSparkCells');
        var meta  = document.getElementById('winrateSparkMeta');
        if (!cells || !chartData || !chartData.length) return;

        // chartData est en ordre chronologique ascendant — derniers 20
        var data = chartData.slice(-20);
        var wins = 0, losses = 0;
        var html = '';
        data.forEach(function (g, i) {
            var cls = g.win ? 'winrate-spark__cell--win' : 'winrate-spark__cell--loss';
            if (g.win) wins++; else losses++;
            html += '<div class="winrate-spark__cell ' + cls + '" style="animation-delay:' + (i * 25) + 'ms" title="' + g.champ + ' — ' + g.score + '"></div>';
        });
        cells.innerHTML = html;

        var total = wins + losses;
        var wr    = total > 0 ? Math.round((wins / total) * 100) : 0;
        meta.innerHTML = wins + 'V ' + losses + 'D — <strong>' + wr + '%</strong>';
    }

    // ── TREEMAP CHAMPIONS (slice-and-dice) ──
    function squarify(items, x, y, w, h) {
        if (!items.length) return [];
        if (items.length === 1) return [Object.assign({}, items[0], { x: x, y: y, w: w, h: h })];
        var total = items.reduce(function (s, i) { return s + i.value; }, 0);
        var horizontal = w >= h;
        var ratio = items[0].value / total;
        var splitW = horizontal ? w * ratio : w;
        var splitH = horizontal ? h : h * ratio;
        var first = Object.assign({}, items[0], { x: x, y: y, w: splitW, h: splitH });
        var rest = horizontal
            ? squarify(items.slice(1), x + splitW, y, w - splitW, h)
            : squarify(items.slice(1), x, y + splitH, w, h - splitH);
        return [first].concat(rest);
    }

    function wrColor(wr) {
        if (wr >= 65) return { bg: 'rgba(76,175,80,0.5)',  border: 'rgba(76,175,80,0.7)',  text: '#7eda85' };
        if (wr >= 55) return { bg: 'rgba(76,175,80,0.3)',  border: 'rgba(76,175,80,0.5)',  text: '#7eda85' };
        if (wr >= 45) return { bg: 'rgba(200,170,110,0.3)', border: 'rgba(200,170,110,0.5)', text: '#d4b878' };
        if (wr >= 35) return { bg: 'rgba(224,85,85,0.3)',  border: 'rgba(224,85,85,0.5)',  text: '#e88a8a' };
        return            { bg: 'rgba(224,85,85,0.5)',  border: 'rgba(224,85,85,0.7)',  text: '#e88a8a' };
    }

    function buildChampTreemap() {
        var root = document.getElementById('champTreemap');
        if (!root || !championStats.length) return;
        var rect = root.getBoundingClientRect();
        var W = rect.width, H = rect.height;
        if (W < 10 || H < 10) return;

        var items = championStats.map(function (c) { return Object.assign({}, c, { value: c.games }); });
        items.sort(function (a, b) { return b.value - a.value; });

        var tiles = squarify(items, 0, 0, W, H);
        root.innerHTML = tiles.map(function (t) {
            var wr = t.games > 0 ? Math.round((t.wins / t.games) * 100) : 0;
            var col = wrColor(wr);
            var smallCls = (t.w < 90 || t.h < 60) ? ' champ-treemap__tile--small' : '';
            return '<div class="champ-treemap__tile' + smallCls + '" style="' +
                'left:' + t.x + 'px;top:' + t.y + 'px;width:' + t.w + 'px;height:' + t.h + 'px;' +
                'background:' + col.bg + ';border-color:' + col.border + ';" ' +
                'title="' + t.championName + ' — ' + t.games + ' games — ' + wr + '% WR">' +
                '<div class="champ-treemap__bg" style="background-image:url(' + t.imageUrl + ')"></div>' +
                '<div class="champ-treemap__overlay"></div>' +
                '<div class="champ-treemap__name">' + t.championName + '</div>' +
                '<div class="champ-treemap__meta" style="color:' + col.text + ';">' + t.games + 'g · ' + wr + '%</div>' +
                '</div>';
        }).join('');
    }

    function buildAllCharts() {
        buildSparkline();
        buildChampTreemap();
        if (typeof Chart !== 'undefined') {
            buildChart();
            buildQueueChart();
            buildLpChart();
        } else if (!document.getElementById('chartjs-cdn')) {
            var s = document.createElement('script');
            s.id  = 'chartjs-cdn';
            s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
            s.onload = function () { buildChart(); buildQueueChart(); buildLpChart(); };
            document.head.appendChild(s);
        }
        buildHeatmap();
    }

    // Re-layout treemap au resize (sinon les tuiles gardent leurs px figés)
    var treemapResizeTimer = null;
    window.addEventListener('resize', function () {
        clearTimeout(treemapResizeTimer);
        treemapResizeTimer = setTimeout(buildChampTreemap, 150);
    });

    // ── LIVE GAME ──
    function updateLiveTimer() {
        var el = document.getElementById('liveTimer');
        if (!el || !liveGameStart) return;
        var elapsed = Math.floor((Date.now() - liveGameStart) / 1000);
        if (elapsed < 0) { el.textContent = 'En attente...'; return; }
        var m = Math.floor(elapsed / 60);
        var s = elapsed % 60;
        el.textContent = m + ':' + String(s).padStart(2, '0');
    }
    if (liveGameStart) {
        updateLiveTimer();
        setInterval(updateLiveTimer, 1000);
    }

    setInterval(async function () {
        try {
            var res  = await fetch(liveGamePath);
            var game = await res.json();
            var banner = document.getElementById('liveGameBanner');
            if (!banner) return;
            if (game) {
                banner.style.display = 'flex';
                banner.querySelector('.live-banner').style.display = 'flex';
                liveGameStart = game.startTime || 0;
            } else {
                banner.style.display = 'none';
            }
        } catch (_) {}
    }, 60000);

    // ── PARTICLES ──
    function initParticles() {
        var container = document.getElementById('lol-particles');
        if (!container) return;
        container.innerHTML = '';
        for (var i = 0; i < 25; i++) {
            var p = document.createElement('div');
            p.className = 'lol-particle';
            var size = 2 + Math.random() * 3;
            p.style.cssText = [
                'left:' + Math.random() * 100 + '%',
                'width:' + size + 'px', 'height:' + size + 'px',
                'animation-duration:' + (7 + Math.random() * 8) + 's',
                'animation-delay:' + Math.random() * 10 + 's',
                'opacity:' + (0.3 + Math.random() * 0.5),
                'box-shadow:0 0 ' + (size * 2) + 'px rgba(200,170,110,0.8)'
            ].join(';');
            container.appendChild(p);
        }
    }

    // ── PARALLAX SPLASH ──
    function initParallax() {
        var hero   = document.querySelector('.lol-hero');
        var splash = document.querySelector('.lol-hero__splash');
        if (!hero || !splash) return;
        hero.addEventListener('mousemove', function (e) {
            var r  = hero.getBoundingClientRect();
            var cx = (e.clientX - r.left) / r.width  - 0.5;
            var cy = (e.clientY - r.top)  / r.height - 0.5;
            splash.style.transform = 'translate(' + (cx * -18) + 'px, ' + (cy * -10) + 'px) scale(1.04)';
        });
        hero.addEventListener('mouseleave', function () { splash.style.transform = ''; });
    }

    // ── SCROLL ANIMATIONS ──
    function initScrollAnimations() {
        var els = document.querySelectorAll('.lol-card, .record-card');
        els.forEach(function (el, i) {
            el.style.opacity    = '0';
            el.style.transform  = 'translateY(22px)';
            el.style.transition = 'opacity 0.55s ease ' + ((i % 4) * 0.07) + 's, transform 0.55s ease ' + ((i % 4) * 0.07) + 's';
        });
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                e.target.style.opacity   = '1';
                e.target.style.transform = 'none';
                obs.unobserve(e.target);
            });
        }, { threshold: 0.08 });
        els.forEach(function (el) { obs.observe(el); });
    }

    // ── GLOW SOURIS SUR LES CARTES ──
    function initGlowCards() {
        document.querySelectorAll('.lol-card, .record-card').forEach(function (card) {
            card.addEventListener('mousemove', function (e) {
                var r = card.getBoundingClientRect();
                var x = ((e.clientX - r.left) / r.width)  * 100;
                var y = ((e.clientY - r.top)  / r.height) * 100;
                card.style.background = 'radial-gradient(circle at ' + x + '% ' + y + '%, rgba(200,170,110,0.09) 0%, var(--lol-card) 55%)';
            });
            card.addEventListener('mouseleave', function () { card.style.background = ''; });
        });
    }

    // ── COMPTEURS ANIMÉS ──
    function animateCounter(el) {
        var target   = parseFloat(el.dataset.count) || 0;
        var decimals = parseInt(el.dataset.decimals) || 0;
        var dur = 900, start = performance.now();
        var tick = function (now) {
            var p    = Math.min((now - start) / dur, 1);
            var ease = 1 - Math.pow(1 - p, 3);
            el.textContent = (target * ease).toFixed(decimals);
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = target.toFixed(decimals);
        };
        requestAnimationFrame(tick);
    }
    function initCounters() {
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                animateCounter(e.target);
                obs.unobserve(e.target);
            });
        }, { threshold: 0.5 });
        document.querySelectorAll('[data-count]').forEach(function (el) { obs.observe(el); });
    }

    // ── BARRES ANIMÉES ──
    function initRoleBars() {
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                e.target.style.transition = 'width 0.8s cubic-bezier(0.4,0,0.2,1)';
                e.target.style.width = e.target.dataset.width + '%';
                obs.unobserve(e.target);
            });
        }, { threshold: 0.5 });
        document.querySelectorAll('.role-bar__fill[data-width]').forEach(function (el) { obs.observe(el); });
    }

    // ── TOOLTIP CHAMPION ──
    function initChampionTooltip() {
        var tooltip = document.getElementById('champTooltip');
        if (!tooltip) return;
        document.querySelectorAll('.mastery-row').forEach(function (row) {
            var idx = parseInt(row.dataset.masteryIdx);
            var m   = masteriesData[idx];
            if (!m) return;
            row.addEventListener('mouseenter', function () {
                tooltip.querySelector('.champ-tooltip__splash').src = m.splashUrl;
                tooltip.querySelector('.champ-tooltip__name').textContent = m.championName;
                tooltip.querySelector('.champ-tooltip__sub').textContent  =
                    'Maîtrise ' + m.championLevel + ' · ' + (m.championPoints / 1000).toFixed(1) + 'k pts';
                tooltip.classList.add('visible');
            });
            row.addEventListener('mousemove', function (e) {
                var tx = e.clientX + 18, ty = e.clientY - 40;
                tooltip.style.left = Math.min(tx, window.innerWidth  - 210) + 'px';
                tooltip.style.top  = Math.max(ty, 8) + 'px';
            });
            row.addEventListener('mouseleave', function () { tooltip.classList.remove('visible'); });
        });
    }

    // ── DERNIÈRE PARTIE + TENDANCE ──
    function initHeroBadges() {
        if (lastGameTs > 0) {
            var diff = Math.floor(Date.now() / 1000 - lastGameTs);
            var label;
            if      (diff < 3600)  label = 'il y a ' + Math.floor(diff / 60) + 'min';
            else if (diff < 86400) label = 'il y a ' + Math.floor(diff / 3600) + 'h';
            else { var dd = Math.floor(diff / 86400); label = 'il y a ' + dd + ' jour' + (dd > 1 ? 's' : ''); }
            var el = document.getElementById('lastGameBadge');
            if (el) { el.textContent = '🕐 Dernière partie ' + label; el.style.display = ''; }
        }
        if (matchesData.length >= 10) {
            var kda = function (arr) { var k = arr.reduce(function (s, m) { return s + m.kills + m.assists; }, 0), dd = arr.reduce(function (s, m) { return s + m.deaths; }, 0); return dd > 0 ? k / dd : k; };
            var recent = kda(matchesData.slice(0, 5)), prev = kda(matchesData.slice(5, 10));
            var diff2  = recent - prev;
            var el2 = document.getElementById('trendBadge');
            if (el2 && Math.abs(diff2) > 0.1) {
                var up = diff2 > 0;
                el2.textContent  = (up ? '↑' : '↓') + ' Forme ' + (up ? '+' : '') + diff2.toFixed(1) + ' KDA';
                el2.style.cssText += 'display:\'\';background:' + (up ? 'rgba(76,175,80,0.15)' : 'rgba(224,85,85,0.12)') + ';border-color:' + (up ? 'var(--win)' : 'var(--loss)') + ';color:' + (up ? 'var(--win)' : 'var(--loss)');
                el2.style.display = '';
            }
        }
    }

    function syncMasteryHeight() {
        var rank    = document.getElementById('rankCard');
        var mastery = document.getElementById('masteryCard');
        var list    = document.getElementById('masteryList');
        if (!rank || !mastery || !list) return;
        var rankH = rank.getBoundingClientRect().height;
        if (rankH < 10) return;
        mastery.style.height = rankH + 'px';
        var title  = mastery.querySelector('.lol-card__title');
        var titleH = title ? title.getBoundingClientRect().height + parseInt(getComputedStyle(title).marginBottom || 0) + parseInt(getComputedStyle(title).marginTop || 0) : 50;
        list.style.maxHeight = (rankH - titleH - 32) + 'px';
    }

    // ── EVENT LISTENERS ──
    function initEventListeners() {
        // Match row clicks
        document.querySelectorAll('.match-row:not([data-listener])').forEach(function (row) {
            row.dataset.listener = '1';
            row.addEventListener('click', function () { openModal(parseInt(row.dataset.idx)); });
        });

        // Modal backdrop + close button
        var matchModal = document.getElementById('matchModal');
        if (matchModal && !matchModal.dataset.initialized) {
            matchModal.dataset.initialized = '1';
            matchModal.addEventListener('click', function (e) { if (e.target === matchModal) closeModal(); });
            var closeBtn = matchModal.querySelector('.lol-modal__close');
            if (closeBtn) closeBtn.addEventListener('click', closeModal);
        }
    }

    function initAll() {
        showAll = false;
        currentFilter = null;
        initParticles();
        buildAllCharts();
        initFilters();
        applyVisibility();
        initParallax();
        initScrollAnimations();
        initGlowCards();
        initCounters();
        initRoleBars();
        initChampionTooltip();
        initHeroBadges();
        initEventListeners();
    }

    document.addEventListener('turbo:load', initAll);
    window.addEventListener('pageshow', function (e) { if (e.persisted) initAll(); });
    initAll();
})();
