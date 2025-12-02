import { useEffect,useState } from 'react';
import { Button, Input, Modal } from 'antd';

import { readClipboardText } from 'utils/clipboard'
import { isValidUrl } from 'utils/http'

import "./BookmarksModal.css";

interface BookmarksModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
}

const BookmarksModal: React.FC<BookmarksModalProps> = ({ 
  isOpen, 
  isSubmitting, 
  onClose, 
  onSubmit 
}) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    const loadClipboardUrl = async () => {
      if (!isOpen) return;
      
      const clipboardText = await readClipboardText();
      
      if (clipboardText && isValidUrl(clipboardText.trim())) {
        setUrl(clipboardText.trim());
      }
    };
    
    loadClipboardUrl();
  }, [isOpen]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSubmit = () => {
    if (!isValidUrl(url)) return;
    onSubmit(url);
    setUrl('');
  };

  const handleCancel = () => {
    setUrl('');
    onClose();
  };

  const isSubmitDisabled = !url.trim() || !isValidUrl(url) || isSubmitting;

  return (
    <Modal
      title="Добавление закладки"
      open={isOpen}
      onCancel={handleCancel}
      footer={false}
    >
      <div className="bookmarks-modal__form">
        <Input 
          id="url" 
          placeholder="https://" 
          value={url}
          onChange={handleUrlChange}
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

export default BookmarksModal;