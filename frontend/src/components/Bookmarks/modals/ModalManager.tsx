import AddBookmarkModal from './AddBookmarkModal';
import CreateCategoryModal from './CreateCategoryModal';
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

    case 'create-category':
      return <CreateCategoryModal collectionId={modalState.collectionId} />;
    
    default:
      return null;
  }
};

export default ModalManager;