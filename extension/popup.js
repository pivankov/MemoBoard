const TOKEN_KEY = 'mb_pat';

const keyScreen = document.getElementById('key-screen');
const mainScreen = document.getElementById('main-screen');
const keyInput = document.getElementById('key-input');
const saveKeyBtn = document.getElementById('save-key');
const urlInput = document.getElementById('url-input');
const pasteClipboardBtn = document.getElementById('paste-clipboard');
const sendBtn = document.getElementById('send');
const resetKeyBtn = document.getElementById('reset-key');
const statusEl = document.getElementById('status');

function isValidHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

async function getToken() {
  const data = await chrome.storage.local.get(TOKEN_KEY);
  return data[TOKEN_KEY] || null;
}

// Сразу после открытия попапа document ещё может быть не в фокусе —
// navigator.clipboard.readText() в этот момент падает с NotAllowedError.
// Повторяем с нарастающей задержкой, пока фокус не установится.
async function readClipboardTextWithRetry() {
  const retryDelaysMs = [0, 120, 300];
  let lastError = null;
  for (const delay of retryDelaysMs) {
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      lastError = error;
    }
  }
  console.warn('[MemoBoard] Не удалось прочитать буфер обмена:', lastError);
  return null;
}

async function getActiveTabUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return (tab && tab.url) || null;
  } catch (error) {
    console.warn('[MemoBoard] Не удалось получить URL текущей страницы:', error);
    return null;
  }
}

async function prefillFromActiveTab() {
  const url = await getActiveTabUrl();
  if (url && isValidHttpUrl(url)) {
    urlInput.value = url;
  }
}

async function showMain() {
  keyScreen.hidden = true;
  mainScreen.hidden = false;
  await prefillFromActiveTab();
  urlInput.focus();
}

function showKey() {
  mainScreen.hidden = true;
  keyScreen.hidden = false;
  keyInput.focus();
}

async function init() {
  const token = await getToken();
  if (token) {
    await showMain();
  } else {
    showKey();
  }
}

saveKeyBtn.addEventListener('click', async () => {
  const value = keyInput.value.trim();
  if (!value.startsWith('mb_pat_')) {
    statusEl.textContent = 'Ключ должен начинаться с mb_pat_';
    return;
  }
  await chrome.storage.local.set({ [TOKEN_KEY]: value });
  statusEl.textContent = '';
  await showMain();
});

resetKeyBtn.addEventListener('click', async () => {
  await chrome.storage.local.remove(TOKEN_KEY);
  keyInput.value = '';
  statusEl.textContent = '';
  showKey();
});

pasteClipboardBtn.addEventListener('click', async () => {
  const text = await readClipboardTextWithRetry();
  const trimmed = text ? text.trim() : '';
  if (trimmed && isValidHttpUrl(trimmed)) {
    urlInput.value = trimmed;
    statusEl.textContent = '';
    urlInput.focus();
  } else {
    statusEl.textContent = 'В буфере обмена нет корректного URL';
  }
});

sendBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  if (!isValidHttpUrl(url)) {
    statusEl.textContent = 'Введите корректный http/https URL';
    return;
  }
  sendBtn.disabled = true;
  sendBtn.textContent = 'Отправляется…';
  statusEl.textContent = '';

  chrome.runtime.sendMessage({ type: 'CREATE_BOOKMARK', url }, (result) => {
    // Если попап ещё открыт — покажем результат. Если закрылся — SW покажет системное уведомление.
    if (chrome.runtime.lastError) {
      return;
    }
    if (result && result.ok) {
      // Успех: попап закрывается сразу, подтверждение — системное уведомление от SW.
      window.close();
      return;
    }
    sendBtn.disabled = false;
    sendBtn.textContent = 'Отправить';
    statusEl.textContent = (result && result.error) || 'Ошибка';
  });
});

init();
