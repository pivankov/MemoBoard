import { useState } from 'react';
import { Button, Input, Modal } from 'antd';

import { useBookmarksActionsContext } from 'contexts/BookmarksActionsContext';
import { useBookmarksModalContext } from 'contexts/BookmarksModalContext';

interface CreateCategoryModalProps {
  collectionId: string;
}

/**
 * Модальное окно создания категории
 * 
 * Отображает форму для ввода названия новой категории.
 * При успешном создании автоматически закрывается.
 */
const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({ collectionId }) => {
  const { closeModal } = useBookmarksModalContext();
  const { createCategory } = useBookmarksActionsContext();
  
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createCategory(collectionId, name.trim());
      closeModal();
    } catch (error) {
      // Ошибка обрабатывается в BookmarksActionsContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Создание категории"
      open={true}
      onCancel={closeModal}
      footer={[
        <Button key="cancel" onClick={closeModal}>
          Отмена
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleSubmit}
          disabled={!name.trim() || isSubmitting}
          loading={isSubmitting}
        >
          Создать
        </Button>,
      ]}
    >
      <Input
        placeholder="Название категории"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onPressEnter={handleSubmit}
        autoFocus
      />
    </Modal>
  );
};

export default CreateCategoryModal;