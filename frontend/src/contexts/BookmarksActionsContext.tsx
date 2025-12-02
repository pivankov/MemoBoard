import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';

import { useBookmarksActions } from 'hooks/useBookmarksActions';
import { BookmarksCreateFormData } from 'types/bookmarks'

/**
 * Значение контекста действий с закладками
 */
interface BookmarksActionsContextValue {
  /** Метод для обновления списка закладок после изменений */
  refreshBookmarks: () => Promise<void>;
  /** Создает новую закладку */
  createBookmark: (data: BookmarksCreateFormData) => Promise<void>;  
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
  const { createBookmark: createBookmarkAction } = useBookmarksActions();

  const createBookmark = useCallback(async (data: BookmarksCreateFormData) => {
    await createBookmarkAction(data);
    await refreshBookmarks();
  }, [createBookmarkAction, refreshBookmarks]);

  const value = useMemo(() => ({
    createBookmark,
    refreshBookmarks,
  }), [createBookmark, refreshBookmarks]);
  
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

