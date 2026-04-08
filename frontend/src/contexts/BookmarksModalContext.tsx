import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

import { ModalState } from 'types/bookmarks-modals';

interface BookmarksModalContextValue {
  /** Текущее состояние модального окна */
  modalState: ModalState;
  /** Открывает модальное окно с заданным состоянием */
  openModal: (state: NonNullable<ModalState>) => void;
  /** Закрывает модальное окно */
  closeModal: () => void;
}

const BookmarksModalContext = createContext<BookmarksModalContextValue | null>(null);

export const BookmarksModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalState>(null);

  const openModal = useCallback((state: NonNullable<ModalState>) => {
    setModalState(state);
  }, []);

  const closeModal = useCallback(() => {
    setModalState(null);
  }, []);

  return (
    <BookmarksModalContext.Provider value={{ modalState, openModal, closeModal }}>
      {children}
    </BookmarksModalContext.Provider>
  );
};

export const useBookmarksModalContext = () => {
  const context = useContext(BookmarksModalContext);

  if (!context) {
    throw new Error('useBookmarksModalContext must be used within BookmarksModalProvider');
  }
  return context;
};