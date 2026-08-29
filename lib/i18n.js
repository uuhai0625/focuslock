const flI18n = (() => {
  function t(key, substitutions) {
    return chrome.i18n.getMessage(key, substitutions);
  }

  // data-i18n="key" → textContent、data-i18n-placeholder="key" → placeholder属性を
  // ページ内の該当要素に一括反映する。ブラウザのUI言語に応じてchrome.i18nが
  // 自動的にja/enを切り替えるため、明示的な言語切替UIは不要。
  function apply(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const message = t(el.getAttribute('data-i18n'));
      if (message) el.textContent = message;
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const message = t(el.getAttribute('data-i18n-placeholder'));
      if (message) el.setAttribute('placeholder', message);
    });
  }

  return { t, apply };
})();
