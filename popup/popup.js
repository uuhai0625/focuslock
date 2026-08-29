let countdownTimer = null;

function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function showToast(text) {
  const toast = document.getElementById('toast');
  toast.textContent = text;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2200);
}

function startCountdown(endsAt) {
  clearInterval(countdownTimer);
  const el = document.getElementById('countdown');
  const tick = () => {
    const remaining = endsAt - Date.now();
    if (remaining <= 0) {
      el.textContent = '00:00';
      clearInterval(countdownTimer);
      render();
      return;
    }
    el.textContent = flCountdown.format(remaining);
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}

function renderSiteList(blockList, locked) {
  const list = document.getElementById('site-list');
  list.innerHTML = '';
  if (blockList.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-hint';
    li.textContent = flI18n.t('emptyBlockListHint');
    list.appendChild(li);
    return;
  }
  blockList.forEach((site) => {
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = site.label;
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove';
    removeBtn.textContent = '✕';
    removeBtn.disabled = locked;
    removeBtn.addEventListener('click', async () => {
      const result = await sendMessage({ type: 'REMOVE_SITE', id: site.id });
      if (!result.ok) {
        showToast(flI18n.t('toastLocked'));
        return;
      }
      render();
    });
    li.appendChild(label);
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

async function render() {
  const state = await sendMessage({ type: 'GET_STATE' });
  const { settings, blockList, manualOn, session } = state;

  const idleBlock = document.getElementById('session-idle');
  const activeBlock = document.getElementById('session-active');
  const proHint = document.getElementById('pro-hint');

  if (session.active) {
    idleBlock.classList.add('hidden');
    activeBlock.classList.remove('hidden');
    startCountdown(session.endsAt);
    document.getElementById('phrase-prompt').classList.add('hidden');
  } else {
    idleBlock.classList.remove('hidden');
    activeBlock.classList.add('hidden');
    clearInterval(countdownTimer);
    proHint.classList.toggle('hidden', settings.isPro);
    document.querySelectorAll('.session-btn').forEach((btn) => {
      btn.disabled = !settings.isPro;
    });
  }

  const manualToggle = document.getElementById('manual-toggle');
  manualToggle.checked = manualOn;
  manualToggle.disabled = session.active;

  document.getElementById('site-input').disabled = session.active;
  document.getElementById('btn-add-site').disabled = session.active;
  renderSiteList(blockList, session.active);

  document.getElementById('plan-label').textContent = flI18n.t(settings.isPro ? 'planPro' : 'planFree');
  document.getElementById('btn-upgrade').classList.toggle('hidden', settings.isPro);
}

document.querySelectorAll('.session-btn').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const minutes = Number(btn.dataset.minutes);
    const result = await sendMessage({ type: 'START_SESSION', minutes });
    if (!result.ok) {
      if (result.error === 'pro_required') {
        showToast(flI18n.t('toastProRequired'));
      } else {
        showToast(flI18n.t('toastSessionStartFailed'));
      }
      return;
    }
    render();
  });
});

document.getElementById('btn-end-early').addEventListener('click', () => {
  document.getElementById('phrase-prompt').classList.remove('hidden');
  document.getElementById('phrase-input').focus();
});

document.getElementById('btn-confirm-end').addEventListener('click', async () => {
  const phrase = document.getElementById('phrase-input').value;
  const result = await sendMessage({ type: 'END_SESSION_EARLY', phrase });
  if (result.ok) {
    document.getElementById('phrase-error').classList.add('hidden');
    render();
  } else {
    document.getElementById('phrase-error').classList.remove('hidden');
  }
});

document.getElementById('manual-toggle').addEventListener('change', async (e) => {
  const on = e.target.checked;
  const result = await sendMessage({ type: 'SET_MANUAL_BLOCK', on });
  if (!result.ok) {
    e.target.checked = !on;
    showToast(flI18n.t('toastLocked'));
  }
});

document.getElementById('btn-add-site').addEventListener('click', async () => {
  const input = document.getElementById('site-input');
  const rule = flPatterns.toRule(input.value);
  if (!rule) {
    showToast(flI18n.t('toastInvalidSite'));
    return;
  }
  const result = await sendMessage({ type: 'ADD_SITE', pattern: rule.pattern, label: rule.domain });
  if (!result.ok) {
    showToast(flI18n.t('toastLocked'));
    return;
  }
  input.value = '';
  render();
});

document.getElementById('site-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-add-site').click();
});

document.getElementById('btn-upgrade').addEventListener('click', () => {
  const extpay = ExtPay('uuhai-focuslock');
  extpay.openPaymentPage();
});

document.getElementById('btn-options').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

flI18n.apply();
render();
