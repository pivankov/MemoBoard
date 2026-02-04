import { useEffect, useState } from 'react';
import { Button, Input, Modal } from 'antd';

import { readClipboardText } from 'utils/clipboard';
import { isValidUrl } from 'utils/http';

import { useBookmarksActionsContext } from 'contexts/BookmarksActionsContext';
import { useBookmarksModalContext } from 'contexts/BookmarksModalContext';

import "./AddBookmarkModal.css";

interface AddBookmarkModalProps {
  categoryId?: string;
}

/**
 * Модальное окно добавления закладки
 * 
 * Позволяет добавить новую закладку по URL.
 * Автоматически подставляет URL из буфера обмена при открытии.
 * При успешном создании автоматически закрывается.
 */
const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({ categoryId }) => {
  const { closeModal } = useBookmarksModalContext();
  const { createBookmark } = useBookmarksActionsContext();
  
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Загружает URL из буфера обмена при открытии модалки
   */
  useEffect(() => {
    const loadClipboardUrl = async () => {
      const clipboardText = await readClipboardText();
      
      if (clipboardText && isValidUrl(clipboardText.trim())) {
        setUrl(clipboardText.trim());
      }
    };
    
    loadClipboardUrl();
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSubmit = async () => {
    if (!isValidUrl(url)) return;
    
    setIsSubmitting(true);
    
    try {
      await createBookmark({
        url,
        categoryId: categoryId || null,
      });
      
      setUrl('');
      closeModal();
    } catch (error) {
      // Ошибка обрабатывается в BookmarksActionsContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setUrl('');
    closeModal();
  };

  const isSubmitDisabled = !url.trim() || !isValidUrl(url) || isSubmitting;

  return (
    <Modal
      title="Добавление закладки"
      open={true}
      onCancel={handleCancel}
      footer={false}
      keyboard={true}
    >
      <div className="add-bookmark-modal__form">
        <Input 
          id="url" 
          placeholder="https://" 
          value={url}
          onChange={handleUrlChange}
          onPressEnter={handleSubmit}
          autoFocus
        />
        <Button 
          onClick={handleSubmit} 
          type="primary" 
          className="ml-2"
          disabled={isSubmitDisabled}
          loading={isSubmitting}
        >
          Отправить
        </Button>
      </div>
    </Modal>
  );
};

export default AddBookmarkModal;