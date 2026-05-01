(function () {
    var STORAGE_KEY = 'kidlovec-theme';
    var root = document.documentElement;
    var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    function getStoredTheme() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    }

    function setStoredTheme(theme) {
        try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
    }

    function systemTheme() {
        return media && media.matches ? 'dark' : 'light';
    }

    function activeTheme() {
        var stored = getStoredTheme();
        if (stored === 'dark' || stored === 'light') return stored;
        return systemTheme();
    }

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        root.style.colorScheme = theme;
        updateButtons(theme);
    }

    function updateButtons(theme) {
        var buttons = document.querySelectorAll('[data-theme-toggle]');
        for (var i = 0; i < buttons.length; i++) {
            var button = buttons[i];
            var next = theme === 'dark' ? 'light' : 'dark';
            button.setAttribute('aria-label', theme === 'dark' ? '切换到日览模式' : '切换到夜览模式');
            button.setAttribute('title', theme === 'dark' ? '切换到日览模式' : '切换到夜览模式');
            button.innerHTML = '<span class="theme-toggle-icon" aria-hidden="true">' + (theme === 'dark' ? '☀️' : '🌙') + '</span><span>' + (theme === 'dark' ? '日览模式' : '夜览模式') + '</span>';
            button.dataset.nextTheme = next;
        }
    }

    function init() {
        applyTheme(activeTheme());
        document.addEventListener('click', function (event) {
            var button = event.target.closest && event.target.closest('[data-theme-toggle]');
            if (!button) return;
            event.preventDefault();
            var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            setStoredTheme(next);
            applyTheme(next);
        });

        if (media && media.addEventListener) {
            media.addEventListener('change', function () {
                if (!getStoredTheme()) applyTheme(systemTheme());
            });
        } else if (media && media.addListener) {
            media.addListener(function () {
                if (!getStoredTheme()) applyTheme(systemTheme());
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
