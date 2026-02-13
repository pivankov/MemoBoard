import AddBookmarkModal from './AddBookmarkModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import EntityModal from './EntityModal';
import { useBookmarksModalContext } from 'contexts/BookmarksModalContext';

/**
 * Менеджер модальных окон для закладок
 * 
 * Рендерит нужное модальное окно на основе текущего состояния из контекста.
 * Каждое модальное окно является независимым компонентом с собственной логикой.
 */
const ModalManager: React.FC = () => {
  const { modalState } = useBookmarksModalContext();

  if (!modalState) return null;

  switch (modalState.type) {
    case 'add-bookmark':
      return <AddBookmarkModal categoryId={modalState.categoryId} />;

    case 'create-entity':
      return (
        <EntityModal
          mode="create"
          entityType={modalState.entityType}
          collectionId={modalState.collectionId}
        />
      );

    case 'rename-entity':
      return (
        <EntityModal
          mode="rename"
          entityType={modalState.entityType}
          entityId={modalState.entityId}
          currentTitle={modalState.currentTitle}
        />
      );

    case 'delete-confirm':
      return (
        <DeleteConfirmModal
          entityType={modalState.entityType}
          entityId={modalState.entityId}
          entityName={modalState.entityName}
        />
      );      
    
    default:
      return null;
  }
};

export default ModalManager;