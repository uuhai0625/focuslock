importScripts('lib/ExtPay.js', 'lib/storage.js');

var extpay = ExtPay('focuslock');
extpay.startBackground();

extpay.onPaid.addListener(() => {
  flStorage.setSettings({ isPro: true });
});

const SESSION_ALARM = 'focuslock-session-end';
const SCHEDULE_ALARM = 'focuslock-schedule-check';
const RULE_ID_BASE = 100000; // 他の用途のルールIDと衝突しないためのオフセット

function siteRuleId(siteId) {
  // siteIdはlib/storage.jsの永続連番カウンタ(allocateId)由来の小さな整数なので、衝突しない。
  return RULE_ID_BASE + siteId;
}

// ADD_SITE/REMOVE_SITE/syncRules等、storageとdeclarativeNetRequestを読み書きする処理を
// 直列実行するためのキュー。並行実行を許すとread-modify-writeが競合し、
// 片方の更新が消える・ルールが古いスナップショットで上書きされる、といった不具合になる
// (SnapFolioのcaptureQueueと同じ設計)。一つの処理が失敗してもキュー自体は壊さないよう、
// 呼び出し元に返すpromiseとキューを繋ぐpromiseを分離しておく。
let opQueue = Promise.resolve();
function enqueue(fn) {
  const result = opQueue.then(fn);
  opQueue = result.catch(() => {});
  return result;
}

async function isBlockingActive() {
  const [manualOn, session, schedule] = await Promise.all([
    flStorage.getManualBlockOn(),
    flStorage.getSession(),
    flStorage.getSchedule()
  ]);
  if (manualOn) return true;
  if (session.active) return true;
  if (schedule.length > 0) {
    const now = new Date();
    const day = now.getDay();
    const minuteOfDay = now.getHours() * 60 + now.getMinutes();
    return schedule.some((rule) => {
      if (rule.startMinute <= rule.endMinute) {
        return rule.days.includes(day) && minuteOfDay >= rule.startMinute && minuteOfDay < rule.endMinute;
      }
      // 日をまたぐ設定(例: 22:00〜翌6:00)。「当日の夜(start以降)」と「前日から続く早朝(end未満)」の
      // どちらも対象にしないと、日付が変わった瞬間にrule.daysが前日のままブロックが解除されてしまう。
      const yesterday = (day + 6) % 7;
      return (
        (rule.days.includes(day) && minuteOfDay >= rule.startMinute) ||
        (rule.days.includes(yesterday) && minuteOfDay < rule.endMinute)
      );
    });
  }
  return false;
}

async function syncRulesUnsafe() {
  const [blockList, active] = await Promise.all([flStorage.getBlockList(), isBlockingActive()]);
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map((rule) => rule.id);

  const addRules = active
    ? blockList.map((site) => ({
        id: siteRuleId(site.id),
        priority: 1,
        action: { type: 'redirect', redirect: { extensionPath: '/blocked.html' } },
        condition: {
          urlFilter: site.pattern,
          resourceTypes: ['main_frame']
        }
      }))
    : [];

  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
}

function syncRules() {
  return enqueue(syncRulesUnsafe);
}

async function scheduleSessionAlarm(endsAt) {
  await chrome.alarms.clear(SESSION_ALARM);
  if (endsAt) {
    await chrome.alarms.create(SESSION_ALARM, { when: endsAt });
  }
}

function startSession(durationMinutes) {
  return enqueue(async () => {
    const endsAt = Date.now() + durationMinutes * 60 * 1000;
    const next = await flStorage.setSession({ active: true, endsAt, durationMinutes });
    await scheduleSessionAlarm(endsAt);
    await syncRulesUnsafe();
    return next;
  });
}

function finishSession(completed) {
  return enqueue(async () => {
    const session = await flStorage.getSession();
    if (session.active && completed && typeof session.durationMinutes === 'number' && session.durationMinutes > 0) {
      await flStorage.addCompletedSession(session.durationMinutes);
    }
    await flStorage.setSession({ active: false, endsAt: null, durationMinutes: null });
    await scheduleSessionAlarm(null);
    await syncRulesUnsafe();
  });
}

async function attemptEndSessionEarly(phraseAttempt) {
  const settings = await flStorage.getSettings();
  const expected = (settings.phrase || '').trim();
  if (!expected) {
    // 合言葉が未設定の場合はロックできない設計なので、常に終了を許可する
    await finishSession(false);
    return { ok: true };
  }
  if (phraseAttempt.trim() === expected) {
    await finishSession(false);
    return { ok: true };
  }
  return { ok: false, error: 'phrase_mismatch' };
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SESSION_ALARM) {
    finishSession(true);
  } else if (alarm.name === SCHEDULE_ALARM) {
    syncRules();
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.alarms.create(SCHEDULE_ALARM, { periodInMinutes: 1 });
  await syncRules();
});

chrome.runtime.onStartup.addListener(async () => {
  // ブラウザ再起動時、セッションが既に終了時刻を過ぎていれば片付ける
  const session = await flStorage.getSession();
  if (session.active && session.endsAt && session.endsAt <= Date.now()) {
    await finishSession(true);
  } else if (session.active && session.endsAt) {
    await scheduleSessionAlarm(session.endsAt);
  }
  await syncRules();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    const session = await flStorage.getSession();
    switch (message.type) {
      case 'GET_STATE': {
        const [settings, blockList, manualOn, schedule, stats] = await Promise.all([
          flStorage.getSettings(),
          flStorage.getBlockList(),
          flStorage.getManualBlockOn(),
          flStorage.getSchedule(),
          flStorage.getStats()
        ]);
        sendResponse({ settings, blockList, manualOn, schedule, stats, session });
        break;
      }
      case 'ADD_SITE': {
        if (session.active) {
          sendResponse({ ok: false, error: 'locked' });
          break;
        }
        const list = await enqueue(async () => {
          const result = await flStorage.addSite(message.pattern, message.label);
          await syncRulesUnsafe();
          return result;
        });
        sendResponse({ ok: true, list });
        break;
      }
      case 'REMOVE_SITE': {
        if (session.active) {
          sendResponse({ ok: false, error: 'locked' });
          break;
        }
        const list = await enqueue(async () => {
          const result = await flStorage.removeSite(message.id);
          await syncRulesUnsafe();
          return result;
        });
        sendResponse({ ok: true, list });
        break;
      }
      case 'SET_MANUAL_BLOCK': {
        if (session.active) {
          sendResponse({ ok: false, error: 'locked' });
          break;
        }
        await enqueue(async () => {
          await flStorage.setManualBlockOn(message.on);
          await syncRulesUnsafe();
        });
        sendResponse({ ok: true });
        break;
      }
      case 'START_SESSION': {
        if (session.active) {
          sendResponse({ ok: false, error: 'already_active' });
          break;
        }
        if (!Number.isFinite(message.minutes) || message.minutes <= 0) {
          sendResponse({ ok: false, error: 'invalid_duration' });
          break;
        }
        const settings = await flStorage.getSettings();
        if (!settings.isPro) {
          sendResponse({ ok: false, error: 'pro_required' });
          break;
        }
        const next = await startSession(message.minutes);
        sendResponse({ ok: true, session: next });
        break;
      }
      case 'END_SESSION_EARLY': {
        const result = await attemptEndSessionEarly(message.phrase || '');
        sendResponse(result);
        break;
      }
      case 'SET_PHRASE': {
        if (session.active) {
          sendResponse({ ok: false, error: 'locked' });
          break;
        }
        await flStorage.setSettings({ phrase: message.phrase });
        sendResponse({ ok: true });
        break;
      }
      case 'SET_SCHEDULE': {
        if (session.active) {
          sendResponse({ ok: false, error: 'locked' });
          break;
        }
        const settings = await flStorage.getSettings();
        if (!settings.isPro) {
          sendResponse({ ok: false, error: 'pro_required' });
          break;
        }
        await enqueue(async () => {
          await flStorage.setSchedule(message.schedule);
          await syncRulesUnsafe();
        });
        sendResponse({ ok: true });
        break;
      }
      default:
        sendResponse({ ok: false, error: 'unknown_message' });
    }
  })();
  return true; // 非同期でsendResponseを呼ぶために必須
});
