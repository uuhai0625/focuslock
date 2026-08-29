const flStorage = (() => {
  const DEFAULT_SETTINGS = { isPro: false, phrase: '' };
  const DEFAULT_SESSION = { active: false, endsAt: null, durationMinutes: null };

  async function getSettings() {
    const result = await chrome.storage.local.get('settings');
    return { ...DEFAULT_SETTINGS, ...(result.settings || {}) };
  }

  async function setSettings(patch) {
    const current = await getSettings();
    const next = { ...current, ...patch };
    await chrome.storage.local.set({ settings: next });
    return next;
  }

  async function getBlockList() {
    const result = await chrome.storage.local.get('blockList');
    return result.blockList || [];
  }

  async function setBlockList(list) {
    await chrome.storage.local.set({ blockList: list });
    return list;
  }

  async function allocateId() {
    // declarativeNetRequestのルールIDは小さな正の整数(1〜2^31-1)である必要があるため、
    // Date.now()のような大きな値ではなく、永続化した連番カウンタを使う(衝突を構造的に防ぐ)。
    const result = await chrome.storage.local.get('nextId');
    const next = (result.nextId || 1) + 1;
    await chrome.storage.local.set({ nextId: next });
    return result.nextId || 1;
  }

  async function addSite(pattern, label) {
    const list = await getBlockList();
    const id = await allocateId();
    list.push({ id, pattern, label: label || pattern });
    await setBlockList(list);
    return list;
  }

  async function removeSite(id) {
    const list = await getBlockList();
    const next = list.filter((item) => item.id !== id);
    await setBlockList(next);
    return next;
  }

  async function getSession() {
    const result = await chrome.storage.local.get('session');
    return { ...DEFAULT_SESSION, ...(result.session || {}) };
  }

  async function setSession(patch) {
    const current = await getSession();
    const next = { ...current, ...patch };
    await chrome.storage.local.set({ session: next });
    return next;
  }

  async function getManualBlockOn() {
    const result = await chrome.storage.local.get('manualBlockOn');
    return Boolean(result.manualBlockOn);
  }

  async function setManualBlockOn(on) {
    await chrome.storage.local.set({ manualBlockOn: Boolean(on) });
  }

  async function getSchedule() {
    const result = await chrome.storage.local.get('schedule');
    return result.schedule || [];
  }

  async function setSchedule(list) {
    await chrome.storage.local.set({ schedule: list });
    return list;
  }

  async function getStats() {
    const result = await chrome.storage.local.get('stats');
    return { totalSessions: 0, totalFocusMinutes: 0, ...(result.stats || {}) };
  }

  async function addCompletedSession(minutes) {
    const stats = await getStats();
    const next = {
      totalSessions: stats.totalSessions + 1,
      totalFocusMinutes: stats.totalFocusMinutes + Math.round(minutes)
    };
    await chrome.storage.local.set({ stats: next });
    return next;
  }

  return {
    getSettings,
    setSettings,
    getBlockList,
    setBlockList,
    addSite,
    removeSite,
    getSession,
    setSession,
    getManualBlockOn,
    setManualBlockOn,
    getSchedule,
    setSchedule,
    getStats,
    addCompletedSession
  };
})();
