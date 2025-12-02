import { useState } from 'react';

import BookmarksModal from './BookmarksModal';
import { useBookmarksActionsContext } from 'contexts/BookmarksActionsContext';
import { useBookmarksUIContext } from 'contexts/BookmarksUIContext';
import { useNotifications } from 'providers/NotificationsProvider';

interface BookmarksModalContainerProps {
  categoryId?: string;
}

const BookmarksModalContainer: React.FC<BookmarksModalContainerProps> = ({ categoryId }) => {
  const { createBookmark } = useBookmarksActionsContext();
  const { isAddModalOpen, closeAddModal } = useBookmarksUIContext();
  const { notifySuccess, notifyError } = useNotifications();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateBookmark = async (url: string) => {
    setIsSubmitting(true);
    
    try {
      await createBookmark({
        url,
        categoryId: categoryId || null,
      });
      
      closeAddModal();
      notifySuccess({ 
        message: 'Закладка создана',
        description: 'Закладка успешно добавлена' 
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Не удалось создать закладку';
      
      notifyError({ 
        message: 'Ошибка создания',
        description: errorMessage + '. Попробуйте еще раз.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BookmarksModal 
      isOpen={isAddModalOpen}
      isSubmitting={isSubmitting}
      onClose={closeAddModal}
      onSubmit={handleCreateBookmark}
    />
  );
};

export default BookmarksModalContainer;

