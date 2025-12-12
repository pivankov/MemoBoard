import { useCallback } from 'react';

import { BookmarksCreateFormData, BookmarksItem, BookmarksUpdateFormData } from 'types/bookmarks';

import { API_BOOKMARKS_BASE_URL } from 'constants/api';
import { SYSTEM_CATEGORIES } from 'constants/bookmarks';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * Возвращаемое значение хука useBookmarksActions
 */
interface UseBookmarksActionsReturn {
  /** Создает новую закладку */
  createBookmark: (data: BookmarksCreateFormData) => Promise<void>;
  /** Обновляет существующую закладку */
  updateBookmark: (id: string, data: BookmarksUpdateFormData) => Promise<void>;
  /** Перемещает закладку в корзину */
  moveToTrash: (id: string) => Promise<void>;
  /** Удаляет закладку */
  deleteBookmark: (id: string) => Promise<void>;
  /** Получает одну закладку по ID */
  getBookmarkById: (id: string) => Promise<BookmarksItem | null>;
}

/**
 * Хук для CRUD операций с закладками
 * 
 * Предоставляет методы для создания, редактирования, удаления и парсинга закладок.
 * Не управляет state - только выполняет API запросы.
 * 
 * @returns объект с методами для работы с закладками
 */
export const useBookmarksActions = (): UseBookmarksActionsReturn => {
  /**
   * Получает одну закладку по ID
   */
  const getBookmarkById = useCallback(async (id: string): Promise<BookmarksItem | null> => {
    try {
      const response = await fetch(`${API_BOOKMARKS_BASE_URL}/${id}`);
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки закладки: ${response.status} ${response.statusText}`);
      }
      
      const payload = await response.json();

      return payload.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке закладки';
      console.error('Ошибка загрузки закладки:', err);
      throw new Error(errorMessage);
    }
  }, []);
    
  /**
   * Создает новую закладку
   */
  const createBookmark = useCallback(async (data: BookmarksCreateFormData): Promise<void> => {
    try {
      const response = await fetch(API_BOOKMARKS_BASE_URL, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка создания закладки: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при создании закладки';
      console.error('Ошибка создания закладки:', err);
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Обновляет существующую закладку
   */
  const updateBookmark = useCallback(async (id: string, data: BookmarksUpdateFormData): Promise<void> => {
    try {
      const response = await fetch(`${API_BOOKMARKS_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: JSON_HEADERS,
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка обновления закладки: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при обновлении закладки';
      console.error('Ошибка обновления закладки:', err);
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Перемещает закладку в корзину (изменяет категорию на "Корзина")
   */
  const moveToTrash = useCallback(async (id: string): Promise<void> => {
    try {
      const bookmark = await getBookmarkById(id);
      
      if (!bookmark) {
        throw new Error('Закладка не найдена');
      }
      
      await updateBookmark(id, {
        ...bookmark,
        categoryId: SYSTEM_CATEGORIES.TRASH,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при перемещении закладки в корзину';
      console.error('Ошибка перемещения закладки в корзину:', err);
      throw new Error(errorMessage);
    }
  }, [getBookmarkById, updateBookmark]);

  /**
   * Удаляет закладку
   */
  const deleteBookmark = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BOOKMARKS_BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка удаления закладки: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при удалении закладки';
      console.error('Ошибка удаления закладки:', err);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    createBookmark,
    updateBookmark,
    moveToTrash,
    deleteBookmark,
    getBookmarkById,
  };
};

