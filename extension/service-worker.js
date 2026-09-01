importScripts('config.js');

const TOKEN_KEY = 'mb_pat';

async function getToken() {
  const data = await chrome.storage.local.get(TOKEN_KEY);
  return data[TOKEN_KEY] || null;
}

async function createBookmark(url) {
  const token = await getToken();
  if (!token) {
    return { ok: false, error: 'Ключ не сохранён' };
  }
  try {
    const res = await fetch(`${API_BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    });
    if (res.status === 201) {
      return { ok: true };
    }
    if (res.status === 401) {
      return { ok: false, error: 'Ключ недействителен (401). Сгенерируйте новый в MemoBoard.' };
    }
    let msg = `Ошибка сервера (${res.status})`;
    try {
      const data = await res.json();
      if (data && data.error) msg = data.error;
    } catch (_) { /* тело не JSON — оставляем дефолтное сообщение */ }
    return { ok: false, error: msg };
  } catch (e) {
    return { ok: false, error: `Сеть недоступна: ${e.message}` };
  }
}

function notify(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
  });
}

// Попап отправляет CREATE_BOOKMARK и может закрыться до ответа —
// SW доводит fetch до конца и уведомляет через chrome.notifications.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'CREATE_BOOKMARK') {
    createBookmark(msg.url).then((result) => {
      if (result.ok) {
        notify('MemoBoard', 'Закладка добавлена');
      } else {
        notify('MemoBoard — ошибка', result.error);
      }
      // Попап мог закрыться — sendResponse может не дойти, это ожидаемо.
      try { sendResponse(result); } catch (_) {}
    });
    return true; // держим канал открытым для асинхронного ответа
  }
  return false;
});
