const flPatterns = (() => {
  function extractDomain(input) {
    let value = input.trim();
    if (!value) return null;
    if (!/^[a-z]+:\/\//i.test(value)) {
      value = `https://${value}`;
    }
    try {
      const url = new URL(value);
      return url.hostname.replace(/^www\./i, '');
    } catch (e) {
      return null;
    }
  }

  function toRule(input) {
    const domain = extractDomain(input);
    if (!domain) return null;
    // "||"はAdblock Plus由来のドメインアンカー構文。chrome.declarativeNetRequestが対応しており、
    // スキーム(http/https)を問わず対象ドメイン本体+全サブドメインにマッチする。
    return { domain, pattern: `||${domain}^` };
  }

  return { extractDomain, toRule };
})();
