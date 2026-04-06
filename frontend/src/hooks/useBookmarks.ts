import { useCallback, useEffect, useMemo, useState } from 'react';

import { BookmarksCategory, BookmarksItem, BookmarksSystemCounts, BookmarksTag } from 'types/bookmarks';
import { getApiErrorMessage } from 'utils/errors';

import { API_BOOKMARKS_BASE_URL } from 'constants/api';
import { SYSTEM_ROUTES } from 'constants/bookmarks';
import { getApiClient } from 'services/ApiClient';

const SYSTEM_ROUTE_API_PATHS: Record<string, string> = {
  [SYSTEM_ROUTES.ALL]: '',
  [SYSTEM_ROUTES.FAVORITES]: '/favorites',
  [SYSTEM_ROUTES.UNSORTED]: '/unsorted',
  [SYSTEM_ROUTES.TRASH]: '/trash',
};

/**
 * Возвращаемое значение хука useBookmarks
 */
interface UseBookmarksReturn {
  /** Список всех закладок */
  bookmarks: BookmarksItem[];
  /** Список всех тегов */
  tags: BookmarksTag[];
  /** Список всех категорий */
  categories: BookmarksCategory[];
  /** Счётчики закладок для системных категорий */
  systemCounts: BookmarksSystemCounts;
  /** Флаг загрузки данных */
  loading: boolean;
  /** Сообщение об ошибке или null */
  error: string | null;
  /** Метод принудительного обновления всех списков */
  refreshBookmarks: () => Promise<void>;  
}

/**
 * Параметры хука useBookmarks
 */
interface UseBookmarksParams {
  /** ID тега для фильтрации закладок */
  tagId?: string;
  /** ID категории для фильтрации закладок */
  categoryId?: string;
  /** Системный роут для фильтрации закладок (all/favorites/unsorted/trash) */
  systemRoute?: string;
}

/**
 * Хук для работы с закладками через REST API
 * 
 * Предоставляет методы для загрузки закладок, тегов и категорий.
 * Автоматически загружает все данные при монтировании компонента.
 * 
 * @returns объект с методами и состоянием для работы с закладками
 */
export const useBookmarks = ({ tagId, categoryId, systemRoute }: UseBookmarksParams = {}): UseBookmarksReturn => {
  const [bookmarks, setBookmarks] = useState<BookmarksItem[]>([]);
  const [tags, setTags] = useState<BookmarksTag[]>([]);
  const [categories, setCategories] = useState<BookmarksCategory[]>([]);
  const [systemCounts, setSystemCounts] = useState<BookmarksSystemCounts>({ all: 0, favorites: 0, unsorted: 0, trash: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiClient = useMemo(() => getApiClient({ baseURL: API_BOOKMARKS_BASE_URL }), []);

  /**
   * Загружает закладки по системному роуту (all/favorites/unsorted/trash)
   */
  const fetchBookmarksBySystemRoute = useCallback(async (route: string) => {
    const path = SYSTEM_ROUTE_API_PATHS[route];

    if (path === undefined) return;

    const payload = await apiClient.get<{ data: BookmarksItem[] }>(path);
    setBookmarks(Array.isArray(payload?.data) ? payload.data : []);
  }, [apiClient]);

  /**
   * Загружает список закладок по указанному ID тега
   */
  const fetchBookmarksByTag = useCallback(async (id: string) => {
    const payload = await apiClient.get<{ data: BookmarksItem[] }>(`/tags/${id}`);
    setBookmarks(Array.isArray(payload?.data) ? payload.data : []);
  }, [apiClient]);

  /**
   * Загружает список закладок по указанному ID категории
   */
  const fetchBookmarksByCategory = useCallback(async (id: string) => {
    const payload = await apiClient.get<{ data: BookmarksItem[] }>(`/categories/${id}`);
    setBookmarks(Array.isArray(payload?.data) ? payload.data : []);
  }, [apiClient]);

  /**
   * Загружает список всех тегов с сервера
   */
  const fetchTags = useCallback(async () => {
    const payload = await apiClient.get<{ data: BookmarksTag[] }>('/tags');
    setTags(Array.isArray(payload?.data) ? payload.data : []);
  }, [apiClient]);

  /**
   * Загружает список всех категорий с сервера
   */
  const fetchCategories = useCallback(async () => {
    const payload = await apiClient.get<{ data: BookmarksCategory[] }>('/categories');
    setCategories(Array.isArray(payload?.data) ? payload.data : []);
  }, [apiClient]);

  /**
   * Загружает счётчики закладок для системных категорий
   */
  const fetchSystemCounts = useCallback(async () => {
    const payload = await apiClient.get<{ data: BookmarksSystemCounts }>('/counts');
    setSystemCounts(payload?.data ?? { all: 0, favorites: 0, unsorted: 0, trash: 0 });
  }, [apiClient]);

  /**
   * Загружает список закладок в зависимости от выбранных фильтров
   */
  const fetchFilteredBookmarks = useCallback(async () => {
    if (systemRoute) {
      await fetchBookmarksBySystemRoute(systemRoute);
      return;
    }

    if (categoryId) {
      await fetchBookmarksByCategory(categoryId);
      return;
    }

    if (tagId) {
      await fetchBookmarksByTag(tagId);
      return;
    }
  }, [systemRoute, categoryId, tagId, fetchBookmarksBySystemRoute, fetchBookmarksByCategory, fetchBookmarksByTag]);

  /**
   * Загружает все данные: закладки, теги и категории
   */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchFilteredBookmarks(),
        fetchTags(),
        fetchCategories(),
        fetchSystemCounts(),
      ]);
    } catch (err) {
      const errorMessage = getApiErrorMessage(err, 'Не удалось загрузить данные');
      setError(errorMessage);
      console.error('Ошибка загрузки данных:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFilteredBookmarks, fetchTags, fetchCategories, fetchSystemCounts]);

  /**
   * Принудительно обновляет все списки с сервера
   */
  const refreshBookmarks = useCallback(async () => {
    await fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    bookmarks,
    tags,
    categories,
    systemCounts,
    loading,
    error,
    refreshBookmarks
  };
};
