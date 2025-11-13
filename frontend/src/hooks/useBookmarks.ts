import { useCallback, useEffect, useState } from 'react';

import { BookmarksCategory, BookmarksItem, BookmarksTag } from 'types/bookmarks';

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
}

const API_BASE_URL = 'http://localhost:4000/api/bookmarks';

/**
 * Хук для работы с закладками через REST API
 * 
 * Предоставляет методы для загрузки закладок, тегов и категорий.
 * Автоматически загружает все данные при монтировании компонента.
 * 
 * @returns объект с методами и состоянием для работы с закладками
 */
export const useBookmarks = ({ tagId, categoryId }: UseBookmarksParams = {}): UseBookmarksReturn => {
  const [bookmarks, setBookmarks] = useState<BookmarksItem[]>([]);
  const [tags, setTags] = useState<BookmarksTag[]>([]);
  const [categories, setCategories] = useState<BookmarksCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Загружает список всех закладок с сервера
   */
  const fetchBookmarks = useCallback(async () => {
    try {
      const response = await fetch(API_BASE_URL);
      
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
      const path = `${API_BASE_URL}/tags/${id}/bookmarks`;
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
      const path = `${API_BASE_URL}/categories/${id}/bookmarks`;
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
      const response = await fetch(`${API_BASE_URL}/tags`);
      
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
      const response = await fetch(`${API_BASE_URL}/categories`);
      
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
   * Загружает список закладок в зависимости от выбранных фильтров
   */
  const fetchFilteredBookmarks = useCallback(async () => {
    if (categoryId) {
      await fetchBookmarksByCategory(categoryId);
      return;
    }

    if (tagId) {
      await fetchBookmarksByTag(tagId);
      return;
    }

    await fetchBookmarks();
  }, [categoryId, tagId, fetchBookmarksByCategory, fetchBookmarksByTag, fetchBookmarks]);

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
      ]);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFilteredBookmarks, fetchTags, fetchCategories]);

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
    loading,
    error,
    refreshBookmarks
  };
};
