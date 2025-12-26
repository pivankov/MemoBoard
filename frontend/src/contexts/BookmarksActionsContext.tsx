import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';

import { useBookmarksActions } from 'hooks/useBookmarksActions';
import { BookmarksCreateFormData, BookmarksItem, BookmarksUpdateFormData } from 'types/bookmarks';
import { getApiErrorMessage } from 'utils/errors';

import { SYSTEM_CATEGORIES } from 'constants/bookmarks';
import { useNotifications } from 'providers/NotificationsProvider';

/**
 * Значение контекста действий с закладками
 */
interface BookmarksActionsContextValue {
  /** Метод для обновления списка закладок после изменений */
  refreshBookmarks: () => Promise<void>;
  /** Создает новую закладку */
  createBookmark: (data: BookmarksCreateFormData) => Promise<void>;
  /** Удаляет закладку окончательно */
  deleteBookmark: (id: string) => Promise<void>;
  /** Обновляет существующую закладку */
  updateBookmark: (id: string, data: BookmarksUpdateFormData) => Promise<void>;  
  /** Перемещает закладку в корзину */
  moveToTrash: (id: string) => Promise<void>;
  /** 
   * Убирает закладку из видимости
   * Если закладка в корзине - удаляет окончательно, иначе - перемещает в корзину
   */
  removeBookmark: (bookmarkId: string, bookmarkCategoryId: string) => void;
  /** Получает закладку по ID */
  getBookmarkById: (id: string) => Promise<BookmarksItem>;
}

const BookmarksActionsContext = createContext<BookmarksActionsContextValue | null>(null);

interface BookmarksActionsProviderProps {
  children: ReactNode;
  /** Метод обновления списка закладок из родительского компонента */
  refreshBookmarks: () => Promise<void>;
}

/**
 * Provider для CRUD операций с закладками
 * 
 * Предоставляет стабильные методы для работы с закладками через API.
 * Не содержит изменяемого state, поэтому не вызывает лишние ре-рендеры.
 * 
 * @param refreshBookmarks - метод для обновления списка закладок после изменений
 */
export const BookmarksActionsProvider: React.FC<BookmarksActionsProviderProps> = ({ 
  children,
  refreshBookmarks 
}) => {
  const { 
    createBookmark: createBookmarkAction,
    moveToTrash: moveToTrashAction,
    deleteBookmark: deleteBookmarkAction,
    updateBookmark: updateBookmarkAction,
    getBookmarkById: getBookmarkByIdAction,
  } = useBookmarksActions();
  
  const { notifySuccess, notifyError } = useNotifications();

  const createBookmark = useCallback(async (data: BookmarksCreateFormData) => {
    try {
      await createBookmarkAction(data);

      notifySuccess({ description: 'Закладка создана' });

      await refreshBookmarks();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось создать закладку');
      
      notifyError({ description: errorMessage });
      console.error('Ошибка создания закладки:', error);

      throw error;
    }
  }, [createBookmarkAction, refreshBookmarks, notifySuccess, notifyError]);

  const deleteBookmark = useCallback(async (id: string) => {
    try {
      await deleteBookmarkAction(id);

      notifySuccess({ description: 'Закладка удалена' });

      await refreshBookmarks();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось удалить закладку');
      
      notifyError({ description: errorMessage });
      console.error('Ошибка удаления закладки:', error);

      throw error;
    }
  }, [deleteBookmarkAction, refreshBookmarks, notifySuccess, notifyError]);  

  const updateBookmark = useCallback(async (id: string, data: BookmarksUpdateFormData) => {
    try {
      await updateBookmarkAction(id, data);

      notifySuccess({ description: 'Закладка обновлена' });

      await refreshBookmarks();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось обновить закладку');

      notifyError({ description: errorMessage });
      console.error('Ошибка обновления закладки:', error);

      throw error;
    }
  }, [updateBookmarkAction, refreshBookmarks, notifySuccess, notifyError]);  

  const moveToTrash = useCallback(async (id: string) => {
    try {
      await moveToTrashAction(id);
      
      notifySuccess({ description: 'Закладка перемещена в корзину' });
            
      await refreshBookmarks();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось переместить закладку в корзину');
      
      notifyError({ description: errorMessage });
      console.error('Ошибка перемещения закладки в корзину:', error);

      throw error;
    }
  }, [moveToTrashAction, refreshBookmarks, notifySuccess, notifyError]);

  /**
   * Убирает закладку из видимости
   * Если закладка в корзине - удаляет окончательно, иначе - перемещает в корзину
   * @param bookmarkId - ID закладки
   * @param bookmarkCategoryId - ID текущей категории закладки
   */
  const removeBookmark = useCallback((bookmarkId: string, bookmarkCategoryId: string) => {
    if (bookmarkCategoryId === SYSTEM_CATEGORIES.TRASH) {
      deleteBookmark(bookmarkId);
    } else {
      moveToTrash(bookmarkId);
    }
  }, [deleteBookmark, moveToTrash]);

  /**
   * Получает закладку по ID
   * @param id - ID закладки
   */
  const getBookmarkById = useCallback(async (id: string): Promise<BookmarksItem> => {
    try {
      return await getBookmarkByIdAction(id);
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось загрузить закладку');

      notifyError({ description: errorMessage });
      console.error('Ошибка загрузки закладки:', error);

      throw error;
    }
  }, [getBookmarkByIdAction, notifyError]);

  const value = useMemo(() => ({
    createBookmark,
    deleteBookmark,    
    updateBookmark,
    moveToTrash,
    removeBookmark,
    refreshBookmarks,
    getBookmarkById,
  }), [createBookmark, deleteBookmark, updateBookmark, moveToTrash, removeBookmark, refreshBookmarks, getBookmarkById]);
  
  return (
    <BookmarksActionsContext.Provider value={value}>
      {children}
    </BookmarksActionsContext.Provider>
  );
};

/**
 * Хук для доступа к действиям с закладками
 * 
 * Предоставляет CRUD методы для работы с закладками.
 * Должен использоваться внутри BookmarksActionsProvider.
 * 
 * @returns объект с методами для работы с закладками
 */
export const useBookmarksActionsContext = (): BookmarksActionsContextValue => {
  const context = useContext(BookmarksActionsContext);
  
  if (!context) {
    throw new Error('useBookmarksActionsContext должен использоваться внутри BookmarksActionsProvider');
  }
  
  return context;
};

