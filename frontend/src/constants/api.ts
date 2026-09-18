/**
 * Константы для работы с API.
 *
 * Все URL относительные: в dev их проксирует CRA (см. proxy в package.json),
 * в prod фронт отдаётся тем же Express-процессом, что и API → same-origin.
 */

const API_BASE_URL = '/api';

/**
 * Базовый URL для статических файлов бэкенда (превью и т.д.).
 * Пустая строка = тот же origin, что и страница.
 */
export const API_STATIC_BASE_URL = '';

export const API_BOOKMARKS_BASE_URL = `${API_BASE_URL}/bookmarks`;
export const API_EVENTS_BASE_URL = `${API_BASE_URL}/events`;
export const API_AUTH_BASE_URL = `${API_BASE_URL}/auth`;
export const API_ADMIN_BASE_URL = `${API_BASE_URL}/admin`;
