let tickTimer = null;

async function init() {
  document.title = flI18n.t('blockedPageTitle');
  const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
  const countdownEl = document.getElementById('countdown');
  const messageEl = document.getElementById('message');
  clearInterval(tickTimer);

  if (state.session.active) {
    countdownEl.classList.remove('hidden');
    const tick = () => {
      const remaining = state.session.endsAt - Date.now();
      if (remaining <= 0) {
        // セッションのアラームが発火してブロックが解除されたはずなので、状態を取り直して表示を更新する。
        clearInterval(tickTimer);
        init();
        return;
      }
      countdownEl.textContent = flCountdown.format(remaining);
    };
    tick();
    tickTimer = setInterval(tick, 1000);
    messageEl.textContent = flI18n.t('blockedSessionMessage');
  } else {
    countdownEl.classList.add('hidden');
    messageEl.textContent = flI18n.t('blockedGeneralMessage');
  }
}

document.getElementById('btn-back').addEventListener('click', () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.close();
  }
});

flI18n.apply();
init();
