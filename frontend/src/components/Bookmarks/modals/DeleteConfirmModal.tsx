import { Button, Modal } from 'antd';

import { useBookmarksDeleteEntity } from 'hooks/useBookmarksDeleteEntity';

import { useBookmarksModalContext } from 'contexts/BookmarksModalContext';

interface DeleteConfirmModalProps {
  entityType: 'collection' | 'category' | 'tag';
  entityId: string;
  entityName: string;
}

/**
 * Модальное окно подтверждения удаления сущности
 * 
 * Презентационный компонент - отвечает только за отображение UI
 */
const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  entityType,
  entityId,
  entityName,
}) => {
  const { closeModal } = useBookmarksModalContext();
  const { handleDelete } = useBookmarksDeleteEntity();

  const entityLabels = {
    collection: 'коллекцию',
    category: 'категорию',
    tag: 'тег',
  };

  const onConfirm = async () => {
    try {
      await handleDelete(entityType, entityId);
      closeModal();
    } catch (error) {
      // Ошибка обрабатывается в контексте
    }
  };

  return (
    <Modal
      title={`Удалить ${entityLabels[entityType]}?`}
      open={true}
      onCancel={closeModal}
      footer={[
        <Button key="cancel" onClick={closeModal}>
          Отмена
        </Button>,
        <Button
          key="submit"
          color="danger"
          variant="solid"
          onClick={onConfirm}
        >
          Удалить
        </Button>,
      ]}      
    >
      <p>
        Вы уверены, что хотите удалить {entityLabels[entityType]} <strong>"{entityName}"</strong>?
      </p>
    </Modal>
  );
};

export default DeleteConfirmModal;