import { useCallback, useEffect, useState } from 'react';

import { BookmarksCategory, BookmarksItem, BookmarksSystemCounts, BookmarksTag } from 'types/bookmarks';

import { API_BOOKMARKS_BASE_URL } from 'constants/api';
import { SYSTEM_ROUTES } from 'constants/bookmarks';

const SYSTEM_ROUTE_API_PATHS: Record<string, string> = {
  [SYSTEM_ROUTES.ALL]: API_BOOKMARKS_BASE_URL,
  [SYSTEM_ROUTES.FAVORITES]: `${API_BOOKMARKS_BASE_URL}/favorites`,
  [SYSTEM_ROUTES.UNSORTED]: `${API_BOOKMARKS_BASE_URL}/unsorted`,
  [SYSTEM_ROUTES.TRASH]: `${API_BOOKMARKS_BASE_URL}/trash`,
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

  /**
   * Загружает закладки по системному роуту (all/favorites/unsorted/trash)
   */
  const fetchBookmarksBySystemRoute = useCallback(async (route: string) => {
    const path = SYSTEM_ROUTE_API_PATHS[route];

    if (!path) return;

    try {
      const response = await fetch(path);

      if (!response.ok) {
        throw new Error(`Ошибка загрузки закладок: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();
      const list: BookmarksItem[] = Array.isArray(payload?.data) ? payload.data : [];

      setBookmarks(list);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке закладок';

      setError(errorMessage);
      console.error('Ошибка загрузки закладок:', err);
      throw err;
    }
  }, []);  

  /**
   * Загружает список закладок по указанному ID тега
   */  
  const fetchBookmarksByTag = useCallback(async (id: string) => {
    try {
      const path = `${API_BOOKMARKS_BASE_URL}/tags/${id}`;
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки закладок по тегу: ${response.status} ${response.statusText}`);
      }
      
      const payload = await response.json();
      const list: BookmarksItem[] = Array.isArray(payload?.data) ? payload.data : [];

      setBookmarks(list);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке закладок';

      setError(errorMessage);
      console.error('Ошибка загрузки закладок:', err);
      throw err;
    }
  }, []);

  /**
   * Загружает список закладок по указанному ID категории
   */  
  const fetchBookmarksByCategory = useCallback(async (id: string) => {
    try {
      const path = `${API_BOOKMARKS_BASE_URL}/categories/${id}`;
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки закладок по категории: ${response.status} ${response.statusText}`);
      }
      
      const payload = await response.json();
      const list: BookmarksItem[] = Array.isArray(payload?.data) ? payload.data : [];

      setBookmarks(list);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке закладок';

      setError(errorMessage);
      console.error('Ошибка загрузки закладок:', err);
      throw err;
    }
  }, []);  

  /**
   * Загружает список всех тегов с сервера
   */
  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch(`${API_BOOKMARKS_BASE_URL}/tags`);
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки тегов: ${response.status} ${response.statusText}`);
      }
      
      const payload = await response.json();
      const list: BookmarksTag[] = Array.isArray(payload?.data) ? payload.data : [];

      setTags(list);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке тегов';
      setError(errorMessage);
      console.error('Ошибка загрузки тегов:', err);
      throw err;
    }
  }, []);

  /**
   * Загружает список всех категорий с сервера
   */
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_BOOKMARKS_BASE_URL}/categories`);
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки категорий: ${response.status} ${response.statusText}`);
      }
      
      const payload = await response.json();
      const list: BookmarksCategory[] = Array.isArray(payload?.data) ? payload.data : [];

      setCategories(list);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке категорий';
      setError(errorMessage);
      console.error('Ошибка загрузки категорий:', err);
      throw err;
    }
  }, []);

  /**
   * Загружает счётчики закладок для системных категорий
   */
  const fetchSystemCounts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BOOKMARKS_BASE_URL}/counts`);

      if (!response.ok) {
        throw new Error(`Ошибка загрузки счётчиков: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();
      const counts: BookmarksSystemCounts = payload?.data ?? { all: 0, favorites: 0, unsorted: 0, trash: 0 };

      setSystemCounts(counts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке счётчиков';
      setError(errorMessage);
      console.error('Ошибка загрузки счётчиков:', err);
      throw err;
    }
  }, []);

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
