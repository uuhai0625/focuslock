let tickTimer = null;

async function init() {
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
    messageEl.textContent = 'セッションが終わるまで、このサイトは開けません。';
  } else {
    countdownEl.classList.add('hidden');
    messageEl.textContent = 'FocusLockの設定でブロック対象になっています。拡張機能のアイコンから設定を変更できます。';
  }
}

document.getElementById('btn-back').addEventListener('click', () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.close();
  }
});

init();
