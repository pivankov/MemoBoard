/**
 * Константы для работы с API
 */

const API_PORT = 4000;
const API_BASE_URL = `http://localhost:${API_PORT}/api`;

/**
 * Базовый URL для статических файлов бэкенда (превью, изображения и т.д.)
 * @example 'http://localhost:4000'
 */
export const API_STATIC_BASE_URL = `http://localhost:${API_PORT}`;

/**
 * Базовый URL для работы с API закладок
 * @example 'http://localhost:4000/api/bookmarks'
 */
export const API_BOOKMARKS_BASE_URL = `${API_BASE_URL}/bookmarks`;

/**
 * Базовый URL для работы с API событий
 * @example 'http://localhost:4000/api/events'
 */
export const API_EVENTS_BASE_URL = `${API_BASE_URL}/events`;

