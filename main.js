(() => {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-copy');
      if (!value) return;
      navigator.clipboard?.writeText(value).catch(() => {});
    });
  });
})();
