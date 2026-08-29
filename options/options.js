const DAY_KEYS = ['daySun', 'dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat'];

function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function timeToMinutes(value) {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function showScheduleStatus(text) {
  const status = document.getElementById('schedule-status');
  status.textContent = text;
  status.classList.remove('hidden');
  setTimeout(() => status.classList.add('hidden'), 2500);
}

function renderScheduleList(schedule, locked) {
  const list = document.getElementById('schedule-list');
  list.innerHTML = '';
  schedule.forEach((rule) => {
    const li = document.createElement('li');
    const days = rule.days
      .slice()
      .sort((a, b) => a - b)
      .map((d) => flI18n.t(DAY_KEYS[d]))
      .join('');
    const label = document.createElement('span');
    label.textContent = `${days} ${minutesToTime(rule.startMinute)}〜${minutesToTime(rule.endMinute)}`;
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove';
    removeBtn.textContent = flI18n.t('removeButton');
    removeBtn.disabled = locked;
    removeBtn.addEventListener('click', async () => {
      const state = await sendMessage({ type: 'GET_STATE' });
      const next = state.schedule.filter((r) => r.id !== rule.id);
      const result = await sendMessage({ type: 'SET_SCHEDULE', schedule: next });
      if (!result.ok) {
        showScheduleStatus(flI18n.t('scheduleRemoveFailed'));
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
  const { settings, schedule, session, stats } = state;

  document.getElementById('phrase-input').value = settings.phrase || '';
  document.getElementById('btn-save-phrase').disabled = session.active;
  document.getElementById('phrase-input').disabled = session.active;
  document.getElementById('phrase-locked-hint').classList.toggle('hidden', !session.active);

  const scheduleLocked = session.active || !settings.isPro;
  document.getElementById('schedule-fieldset').disabled = scheduleLocked;
  document.getElementById('schedule-pro-hint').classList.toggle('hidden', settings.isPro);
  renderScheduleList(schedule, session.active || !settings.isPro);

  document.getElementById('stats-sentence').textContent = flI18n.t('statsSentence', [
    String(stats.totalSessions),
    String(stats.totalFocusMinutes)
  ]);
}

document.getElementById('btn-save-phrase').addEventListener('click', async () => {
  const phrase = document.getElementById('phrase-input').value;
  const result = await sendMessage({ type: 'SET_PHRASE', phrase });
  const status = document.getElementById('phrase-status');
  status.textContent = flI18n.t(result.ok ? 'phraseSaved' : 'phraseSaveFailed');
  status.classList.remove('hidden');
  setTimeout(() => status.classList.add('hidden'), 2000);
});

document.getElementById('btn-add-schedule').addEventListener('click', async () => {
  const days = Array.from(document.querySelectorAll('#schedule-form input[type="checkbox"]:checked')).map((el) =>
    Number(el.value)
  );
  if (days.length === 0) return;
  const startMinute = timeToMinutes(document.getElementById('schedule-start').value);
  const endMinute = timeToMinutes(document.getElementById('schedule-end').value);
  const state = await sendMessage({ type: 'GET_STATE' });
  const next = state.schedule.concat([{ id: Date.now(), days, startMinute, endMinute }]);
  const result = await sendMessage({ type: 'SET_SCHEDULE', schedule: next });
  if (!result.ok) {
    showScheduleStatus(flI18n.t('scheduleAddFailed'));
    return;
  }
  render();
});

flI18n.apply();
render();
