import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Значение контекста UI состояния закладок
 */
interface BookmarksUIContextValue {
  /** Флаг открытия модального окна добавления */
  isAddModalOpen: boolean;
  
  /** Открывает модальное окно для ввода URL */
  openAddModal: () => void;
  /** Закрывает модальное окно добавления */
  closeAddModal: () => void;
}

const BookmarksUIContext = createContext<BookmarksUIContextValue | null>(null);

interface BookmarksUIProviderProps {
  children: ReactNode;
}

/**
 * Provider для UI состояния закладок
 * 
 * Управляет состоянием модальных окон, панелей редактирования и процессом парсинга URL.
 * Содержит изменяемый state, поэтому потребители будут ре-рендериться при изменениях.
 * 
 * Оркестрирует взаимодействие между модальным окном ввода URL и боковой панелью редактирования.
 */
export const BookmarksUIProvider: React.FC<BookmarksUIProviderProps> = ({ children }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  /**
   * Открывает модальное окно для ввода URL
   */
  const openAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);
  
  /**
   * Закрывает модальное окно и очищает данные парсинга
   */
  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);
  
  const value = useMemo(() => ({
    isAddModalOpen,
    openAddModal,
    closeAddModal,
  }), [
    isAddModalOpen,
    openAddModal,
    closeAddModal,
  ]);
  
  return (
    <BookmarksUIContext.Provider value={value}>
      {children}
    </BookmarksUIContext.Provider>
  );
};

/**
 * Хук для доступа к UI состоянию закладок
 * 
 * Предоставляет состояние модальных окон, панелей и методы для управления ими.
 * Должен использоваться внутри BookmarksUIProvider.
 * 
 * @returns объект с UI состоянием и методами управления
 */
export const useBookmarksUIContext = (): BookmarksUIContextValue => {
  const context = useContext(BookmarksUIContext);
  
  if (!context) {
    throw new Error('useBookmarksUIContext должен использоваться внутри BookmarksUIProvider');
  }
  
  return context;
};

