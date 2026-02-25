import { useCallback, useMemo } from 'react';

import { BookmarksCreateFormData, BookmarksItem, BookmarksUpdateFormData } from 'types/bookmarks';

import { API_BOOKMARKS_BASE_URL } from 'constants/api';
import { SYSTEM_CATEGORIES } from 'constants/bookmarks';
import { getApiClient } from 'services/ApiClient';

/**
 * Возвращаемое значение хука useBookmarksActions
 */
interface UseBookmarksActionsReturn {
  /** Получает одну закладку по ID */
  getBookmarkById: (id: string) => Promise<BookmarksItem>;  
  /** Создает новую закладку */
  createBookmark: (data: BookmarksCreateFormData) => Promise<void>;
  /** Обновляет существующую закладку */
  updateBookmark: (id: string, data: BookmarksUpdateFormData) => Promise<void>;
  /** Удаляет закладку */
  deleteBookmark: (id: string) => Promise<void>;  
  /** Перемещает закладку в корзину */
  moveToTrash: (id: string) => Promise<void>;
  /** Переключает статус избранного для закладки (изменяет favorite на противоположное) */
  toggleBookmarkFavorite: (id: string) => Promise<void>;  
  /** Создает коллекцию для категорий закладок */
  createCollection: (title: string) => Promise<void>;
  /** Создает категорию закладки */
  createCategory: (title: string, parentId: string, icon: string) => Promise<void>;
  /** Создает тег для закладок */
  createTag: (title: string) => Promise<void>;  
  /** Удаляет коллекцию/категорию */
  deleteCategoryEntity: (id: string) => Promise<void>;
  /** Удаляет тег */
  deleteTag: (id: string) => Promise<void>;
  /** Обновляет категорию */
  updateCategory: (data: { id: string, title?: string, icon?: string }) => Promise<void>;
  /** Обновляет тег */
  updateTag: (data: { id: string, title: string }) => Promise<void>;
}

/**
 * Хук для CRUD операций с закладками
 * 
 * Предоставляет методы для создания, редактирования, удаления и парсинга закладок.
 * Не управляет state - только выполняет API запросы.
 * Использует Singleton ApiClient для централизации HTTP логики.
 * 
 * @returns объект с методами для работы с закладками
 */
export const useBookmarksActions = (): UseBookmarksActionsReturn => {
  // Инициализируем API клиент один раз
  const apiClient = useMemo(() => {
    return getApiClient({ baseURL: API_BOOKMARKS_BASE_URL });
  }, []);

  /**
   * Получает одну закладку по ID
   */
  const getBookmarkById = useCallback(async (id: string): Promise<BookmarksItem> => {
    try {
      const payload = await apiClient.get<{ data: BookmarksItem }>(`/${id}`);
      
      return payload.data;
    } catch (err) {
      throw err;
    }
  }, [apiClient]);
    
  /**
   * Создает новую закладку
   */
  const createBookmark = useCallback(async (data: BookmarksCreateFormData): Promise<void> => {
    try {
      await apiClient.post('/', data);
    } catch (err) {
      throw err;
    }
  }, [apiClient]);

  /**
   * Обновляет существующую закладку
   */
  const updateBookmark = useCallback(async (id: string, data: BookmarksUpdateFormData): Promise<void> => {
    try {
      await apiClient.put(`/${id}`, data);
    } catch (err) {
      throw err;
    }
  }, [apiClient]);

  /**
   * Удаляет закладку
   */
  const deleteBookmark = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/${id}`);
    } catch (err) {
      throw err;
    }
  }, [apiClient]);  

  /**
   * Перемещает закладку в корзину (изменяет категорию на "Корзина")
   */
  const moveToTrash = useCallback(async (id: string): Promise<void> => {
    try {
      const bookmark = await getBookmarkById(id);
      const updatedBookmark = {
        ...bookmark,
        categoryId: SYSTEM_CATEGORIES.TRASH,
      };
      
      await updateBookmark(id, updatedBookmark);
    } catch (err) {
      throw err;
    }
  }, [getBookmarkById, updateBookmark]);

  /**
   * Переключает статус избранного для закладки (изменяет favorite на противоположное)
   */
  const toggleBookmarkFavorite = useCallback(async (id: string): Promise<void> => {
    try {
      const bookmark = await getBookmarkById(id);
      const updatedBookmark = {
        ...bookmark,
        favorite: !bookmark.favorite,
      };      
      
      await updateBookmark(id, updatedBookmark);
    } catch (err) {
      throw err;
    }
  }, [getBookmarkById, updateBookmark]);

  const createCollection = useCallback(async (title: string): Promise<void> => {
    try {
      await apiClient.post('/categories', { title });
    } catch (err) {
      throw err;
    }
  }, [apiClient]);

  const createCategory = useCallback(async (title: string, parentId: string, icon: string): Promise<void> => {
    try {
      await apiClient.post('/categories', { title, parentId, icon });
    } catch (err) {
      throw err;
    }
  }, [apiClient]);

  const createTag = useCallback(async (title: string): Promise<void> => {
    try {
      await apiClient.post('/tags', { title });
    } catch (err) {
      throw err;
    }
  }, [apiClient]);

  const deleteCategoryEntity = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/categories/${id}`);
    } catch (err) {
      throw err;
    }
  }, [apiClient]);

  const deleteTag = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/tags/${id}`);
    } catch (err) {
      throw err;
    }
  }, [apiClient]);

  const updateCategory = useCallback(async (data: { id: string, title?: string, icon?: string }): Promise<void> => {
    try {
      await apiClient.patch(`/categories/${data.id}`, { title: data.title, icon: data.icon });
    } catch (err) {
      throw err;
    }
  }, [apiClient]);

  const updateTag = useCallback(async (data: { id: string, title: string }): Promise<void> => {
    try {
      await apiClient.patch(`/tags/${data.id}`, { title: data.title });
    } catch (err) {
      throw err;
    }
  }, [apiClient]);

  return {
    getBookmarkById,    
    createBookmark,
    updateBookmark,
    deleteBookmark,    
    moveToTrash,
    toggleBookmarkFavorite,
    createCollection,
    createCategory,
    createTag,
    deleteCategoryEntity,
    deleteTag,
    updateCategory,
    updateTag,
  };
};
