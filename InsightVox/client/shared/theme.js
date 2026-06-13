// @ts-nocheck
// Applies the saved theme as early as possible and wires up any
// .theme-toggle button found on the page.

(function () {
  const saved = localStorage.getItem('insightvox-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();

function initThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  toggle.setAttribute('aria-label', 'Toggle light/dark theme');
  toggle.title = 'Toggle light/dark theme';

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('insightvox-theme', next);
  });
}

document.addEventListener('DOMContentLoaded', initThemeToggle);
