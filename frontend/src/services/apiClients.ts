import ApiClient from './ApiClient';
import { API_BOOKMARKS_BASE_URL, API_EVENTS_BASE_URL } from 'constants/api';

/**
 * API-клиент для сервиса событий
 * Базовый URL: /api/events
 */
export const eventsApiClient = new ApiClient({ baseURL: API_EVENTS_BASE_URL });

/**
 * API-клиент для сервиса закладок
 * Базовый URL: /api/bookmarks
 */
export const bookmarksApiClient = new ApiClient({ baseURL: API_BOOKMARKS_BASE_URL });
