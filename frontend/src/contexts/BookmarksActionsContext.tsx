import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';

import { useBookmarksActions } from 'hooks/useBookmarksActions';
import { BookmarksCategoriesReorderItem,BookmarksCreateFormData, BookmarksItem, BookmarksUpdateFormData } from 'types/bookmarks';
import { getApiErrorMessage } from 'utils/errors';

import { useNotifications } from 'providers/NotificationsProvider';

/**
 * Значение контекста действий с закладками
 */
interface BookmarksActionsContextValue {
  /** Метод для обновления списка закладок после изменений */
  refreshBookmarks: () => Promise<void>;
  /** Получает закладку по ID */
  getBookmarkById: (id: string) => Promise<BookmarksItem>;  
  /** Создает новую закладку */
  createBookmark: (data: BookmarksCreateFormData) => Promise<void>;
  /** Обновляет существующую закладку */
  updateBookmark: (id: string, data: BookmarksUpdateFormData) => Promise<void>;    
  /** Удаляет закладку окончательно */
  deleteBookmark: (id: string) => Promise<void>;
  /** Перемещает закладку в корзину */
  moveToTrash: (id: string) => Promise<void>;
  /** Восстанавливает закладку из корзины */
  restoreFromTrash: (id: string) => Promise<void>;
  /** 
   * Убирает закладку из видимости
   * Если закладка уже в корзине - удаляет окончательно, иначе - перемещает в корзину
   */
  removeBookmark: (bookmarkId: string, isInTrash: boolean) => void;
  /** Переключает статус избранного для закладки (изменяет favorite на противоположное) */
  toggleBookmarkFavorite: (id: string) => Promise<void>;  
  /** Создает коллекцию для категорий закладок */
  createCollection: (title: string) => Promise<void>;
  /** Создает категорию закладки */
  createCategory: (id: string, title: string, icon?: string) => Promise<void>;
  /** Создает тег */
  createTag: (title: string) => Promise<void>;  
  /** Переименовывает коллекцию */
  renameCollection: (collectionId: string, title: string) => Promise<void>;  
  /** Переименовывает категорию */
  renameCategory: (categoryId: string, title: string) => Promise<void>;  
  /** Переименовывает тег */
  renameTag: (tagId: string, title: string) => Promise<void>;  
  /** Удаляет коллекцию */
  deleteCollection: (collectionId: string) => Promise<void>;
  /** Удаляет категорию */
  deleteCategory: (categoryId: string) => Promise<void>;
  /** Удаляет тег */
  deleteTag: (tagId: string) => Promise<void>;
  /** Изменяет иконку категории */
  changeCategoryIcon: (categoryId: string, icon: string) => Promise<void>;
  /** Обновляет позиции и/или коллекцию у категорий/коллекций */
  reorderCategories: (items: BookmarksCategoriesReorderItem[]) => Promise<void>;
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
    getBookmarkById: getBookmarkByIdAction,
    createBookmark: createBookmarkAction,
    updateBookmark: updateBookmarkAction,
    deleteBookmark: deleteBookmarkAction,
    moveToTrash: moveToTrashAction,
    restoreFromTrash: restoreFromTrashAction,
    toggleBookmarkFavorite: toggleBookmarkFavoriteAction,
    createCollection: createCollectionAction,
    createCategory: createCategoryAction,
    createTag: createTagAction,
    deleteCategoryEntity: deleteCategoryEntityAction,
    deleteTag: deleteTagAction,
    updateCategory: updateCategoryAction,
    updateTag: updateTagAction,
    reorderCategories: reorderCategoriesAction,
  } = useBookmarksActions();
  
  const { notifySuccess, notifyError } = useNotifications();

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

  /**
   * Создает новую закладку
   */  
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

  /**
   * Обновляет существующую закладку
   */  
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

  /**
   * Удаляет закладку
   */  
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

  /**
   * Перемещает закладку в корзину
   */  
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
   * Восстанавливает закладку из корзины
   */
  const restoreFromTrash = useCallback(async (id: string) => {
    try {
      await restoreFromTrashAction(id);

      notifySuccess({ description: 'Закладка восстановлена из корзины' });

      await refreshBookmarks();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось восстановить закладку из корзины');

      notifyError({ description: errorMessage });
      console.error('Ошибка восстановления закладки из корзины:', error);

      throw error;
    }
  }, [restoreFromTrashAction, refreshBookmarks, notifySuccess, notifyError]);

  /**
   * Убирает закладку из видимости
   * Если закладка уже в корзине - удаляет окончательно, иначе - перемещает в корзину
   * @param bookmarkId - ID закладки
   * @param isInTrash - находится ли закладка в корзине
   */
  const removeBookmark = useCallback((bookmarkId: string, isInTrash: boolean) => {
    if (isInTrash) {
      deleteBookmark(bookmarkId);
    } else {
      moveToTrash(bookmarkId);
    }
  }, [deleteBookmark, moveToTrash]);

  /**
   * Переключает статус избранного для закладки (изменяет favorite на противоположное)
   */  
  const toggleBookmarkFavorite = useCallback(async (id: string) => {
    try {
      await toggleBookmarkFavoriteAction(id);
      
      notifySuccess({ description: 'Статус избранного изменен' });
            
      await refreshBookmarks();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось обновить закладку');
      
      notifyError({ description: errorMessage });
      console.error('Не удалось изменить статус избранного:', error);

      throw error;
    }
  }, [toggleBookmarkFavoriteAction, refreshBookmarks, notifySuccess, notifyError]);


  const createCollection = useCallback(async (title: string) => {
    try {
      await createCollectionAction(title);
      
      notifySuccess({ description: 'Коллекция создана' });
      await refreshBookmarks();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось создать коллекцию');
      notifyError({ description: errorMessage });
      throw error;
    }
  }, [createCollectionAction, refreshBookmarks, notifySuccess, notifyError]);

  const createCategory = useCallback(async (collectionId: string, title: string, icon: string = 'Folder') => {
    try {
      await createCategoryAction(title, collectionId, icon);
      
      notifySuccess({ description: 'Категория создана' });
      await refreshBookmarks();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось создать категорию');
      notifyError({ description: errorMessage });
      throw error;
    }
  }, [createCategoryAction, refreshBookmarks, notifySuccess, notifyError]);  

  const createTag = useCallback(async (title: string) => {
    try {
      await createTagAction(title);
      
      notifySuccess({ description: 'Тег создана' });
      await refreshBookmarks();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось создать тег');
      notifyError({ description: errorMessage });
      throw error;
    }
  }, [createTagAction, refreshBookmarks, notifySuccess, notifyError]);  

  const renameCollection = useCallback(async (collectionId: string, title: string) => {
    try {
      await updateCategoryAction({ id: collectionId, title });
      
      notifySuccess({ description: 'Коллекция переименованна' });
      await refreshBookmarks();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось переименовать коллекцию');
      notifyError({ description: errorMessage });
      throw error;
    }
  }, [updateCategoryAction, refreshBookmarks, notifySuccess, notifyError]);  

  const renameCategory = useCallback(async (categoryId: string, title: string) => {
    try {
      await updateCategoryAction({ id: categoryId, title });
      
      notifySuccess({ description: 'Категория переименованна' });
      await refreshBookmarks();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось переименовать категорию');
      notifyError({ description: errorMessage });
      throw error;
    }
  }, [updateCategoryAction, refreshBookmarks, notifySuccess, notifyError]);  

  const renameTag = useCallback(async (tagId: string, title: string) => {
    try {
      await updateTagAction({ id: tagId, title });
      
      notifySuccess({ description: 'Тег переименованна' });
      await refreshBookmarks();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось переименовать тег');
      notifyError({ description: errorMessage });
      throw error;
    }
  }, [updateTagAction, refreshBookmarks, notifySuccess, notifyError]);

  const changeCategoryIcon = useCallback(async (categoryId: string, icon: string) => {
    try {
      await updateCategoryAction({ id: categoryId, icon });
      
      notifySuccess({ description: 'Иконка изменена' });
      await refreshBookmarks();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось изменить иконку');
      notifyError({ description: errorMessage });
      throw error;
    }
  }, [updateCategoryAction, refreshBookmarks, notifySuccess, notifyError]);

  const deleteCollection = useCallback(async (collectionId: string) => {
    try {
      await deleteCategoryEntityAction(collectionId);
      
      notifySuccess({ description: 'Коллекция удалена' });
      await refreshBookmarks();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось удалить коллекцию');
      notifyError({ description: errorMessage });
      throw error;
    }
  }, [deleteCategoryEntityAction, refreshBookmarks, notifySuccess, notifyError]);  

  const deleteCategory = useCallback(async (categoryId: string) => {
    try {
      await deleteCategoryEntityAction(categoryId);
      
      notifySuccess({ description: 'Категория удалена' });
      // refreshBookmarks() убран - вызывается в хуке useBookmarksDeleteEntity  
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось удалить категорию');
      notifyError({ description: errorMessage });
      throw error;
    }
  }, [deleteCategoryEntityAction, notifySuccess, notifyError]);  

  const deleteTag = useCallback(async (tagId: string) => {
    try {
      await deleteTagAction(tagId);
      
      notifySuccess({ description: 'Тег удален' });
      // refreshBookmarks() убран - вызывается в хуке useBookmarksDeleteEntity  
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось удалить тег');
      notifyError({ description: errorMessage });
      throw error;
    }
  }, [deleteTagAction, notifySuccess, notifyError]);

  const reorderCategories = useCallback(async (items: BookmarksCategoriesReorderItem[]) => {
    try {
      await reorderCategoriesAction(items);

      notifySuccess({ description: 'Порядок сохранён' });
      await refreshBookmarks();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось сохранить порядок');
      notifyError({ description: errorMessage });
      throw error;
    }
  }, [reorderCategoriesAction, refreshBookmarks, notifySuccess, notifyError]);

  const value = useMemo(() => ({
    refreshBookmarks,
    getBookmarkById,    
    createBookmark,
    updateBookmark,    
    deleteBookmark,
    moveToTrash,
    restoreFromTrash,
    removeBookmark,
    toggleBookmarkFavorite,
    createCollection,
    createCategory,
    createTag,
    renameCollection,
    renameCategory,
    renameTag,
    deleteCollection,
    deleteCategory,
    deleteTag,
    changeCategoryIcon,
    reorderCategories,
  }), [
    refreshBookmarks,
    getBookmarkById,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    moveToTrash,
    restoreFromTrash,
    removeBookmark,
    toggleBookmarkFavorite,
    createCollection,
    createCategory,
    createTag,
    renameCollection,
    renameCategory,
    renameTag,
    deleteCollection,
    deleteCategory,
    deleteTag,
    changeCategoryIcon,
    reorderCategories,
  ]);
  
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

