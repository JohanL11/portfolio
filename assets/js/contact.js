(function () {
    var emailItem = document.getElementById('emailCopyItem');
    if (!emailItem) return;

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
})();
