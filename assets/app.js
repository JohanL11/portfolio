import './stimulus_bootstrap.js';
import './styles/app.css';

// ─── Initialisation de la page ────────────────────────────────────
function initPage() {
    // Navbar scroll state
    const navbar = document.getElementById('navbar');
    if (navbar) {
        navbar.classList.toggle('navbar--scrolled', window.scrollY > 20);
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('navbar--scrolled', window.scrollY > 20);
        }, { passive: true });
    }

    // Skill bar animations
    const barObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.style.animationPlayState = 'running';
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.skill-card__fill').forEach(el => {
        el.style.animationPlayState = 'paused';
        barObserver.observe(el);
    });

    // Card entrance animations
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                entry.target.style.transitionDelay = `${i * 0.07}s`;
                entry.target.classList.add('visible');
                cardObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });

    document.querySelectorAll('.project-card, .skill-card, .edu-card, .timeline__content, .svc-card, .process-step, .svc-block').forEach(card => {
        card.classList.add('animate-in');
        cardObserver.observe(card);
    });
}

// ─── Transitions de page (Turbo) ─────────────────────────────────

// Empêche Turbo/navigateur de restaurer la position de scroll
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}

document.addEventListener('turbo:before-visit', () => {
    document.documentElement.classList.add('page-leaving');
});

// turbo:render se déclenche après l'injection du HTML — scroll ici
document.addEventListener('turbo:render', () => {
    window.scrollTo(0, 0);
});

// turbo:load se déclenche au premier chargement ET à chaque navigation
document.addEventListener('turbo:load', () => {
    document.documentElement.classList.remove('page-leaving');
    initPage();
});
