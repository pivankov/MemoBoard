import { useCallback, useMemo } from 'react';

import { BookmarksCategoriesReorderItem, BookmarksCreateFormData, BookmarksItem, BookmarksUpdateFormData } from 'types/bookmarks';

import { API_BOOKMARKS_BASE_URL } from 'constants/api';
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
  /** Восстанавливает закладку из корзины */
  restoreFromTrash: (id: string) => Promise<void>;
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
  /** Обновляет позиции и/или коллекцию у категорий/коллекций */
  reorderCategories: (items: BookmarksCategoriesReorderItem[]) => Promise<void>;
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
    const payload = await apiClient.get<{ data: BookmarksItem }>(`/${id}`);
    return payload.data;
  }, [apiClient]);

  /**
   * Создает новую закладку
   */
  const createBookmark = useCallback(async (data: BookmarksCreateFormData): Promise<void> => {
    await apiClient.post('/', data);
  }, [apiClient]);

  /**
   * Обновляет существующую закладку
   */
  const updateBookmark = useCallback(async (id: string, data: BookmarksUpdateFormData): Promise<void> => {
    await apiClient.put(`/${id}`, data);
  }, [apiClient]);

  /**
   * Удаляет закладку
   */
  const deleteBookmark = useCallback(async (id: string): Promise<void> => {
    await apiClient.delete(`/${id}`);
  }, [apiClient]);

  /**
   * Перемещает закладку в корзину
   */
  const moveToTrash = useCallback(async (id: string): Promise<void> => {
    await apiClient.patch(`/${id}/trash`, { inTrash: true });
  }, [apiClient]);

  /**
   * Восстанавливает закладку из корзины
   */
  const restoreFromTrash = useCallback(async (id: string): Promise<void> => {
    await apiClient.patch(`/${id}/trash`, { inTrash: false });
  }, [apiClient]);

  /**
   * Переключает статус избранного для закладки (изменяет favorite на противоположное)
   */
  const toggleBookmarkFavorite = useCallback(async (id: string): Promise<void> => {
    const bookmark = await getBookmarkById(id);
    const updatedBookmark: BookmarksUpdateFormData = {
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description,
      categoryId: bookmark.categoryId,
      existingTagIds: bookmark.tags,
      newTagTitles: [],
      preview: bookmark.preview,
      favorite: !bookmark.favorite,
    };
    await updateBookmark(id, updatedBookmark);
  }, [getBookmarkById, updateBookmark]);

  const createCollection = useCallback(async (title: string): Promise<void> => {
    await apiClient.post('/categories', { title });
  }, [apiClient]);

  const createCategory = useCallback(async (title: string, parentId: string, icon: string): Promise<void> => {
    await apiClient.post('/categories', { title, parentId, icon });
  }, [apiClient]);

  const createTag = useCallback(async (title: string): Promise<void> => {
    await apiClient.post('/tags', { title });
  }, [apiClient]);

  const deleteCategoryEntity = useCallback(async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  }, [apiClient]);

  const deleteTag = useCallback(async (id: string): Promise<void> => {
    await apiClient.delete(`/tags/${id}`);
  }, [apiClient]);

  const updateCategory = useCallback(async (data: { id: string, title?: string, icon?: string }): Promise<void> => {
    await apiClient.patch(`/categories/${data.id}`, { title: data.title, icon: data.icon });
  }, [apiClient]);

  const updateTag = useCallback(async (data: { id: string, title: string }): Promise<void> => {
    await apiClient.patch(`/tags/${data.id}`, { title: data.title });
  }, [apiClient]);

  const reorderCategories = useCallback(async (items: BookmarksCategoriesReorderItem[]): Promise<void> => {
    await apiClient.patch('/categories/reorder', { items });
  }, [apiClient]);

  return {
    getBookmarkById,    
    createBookmark,
    updateBookmark,
    deleteBookmark,    
    moveToTrash,
    restoreFromTrash,
    toggleBookmarkFavorite,
    createCollection,
    createCategory,
    createTag,
    deleteCategoryEntity,
    deleteTag,
    updateCategory,
    updateTag,
    reorderCategories,
  };
};
