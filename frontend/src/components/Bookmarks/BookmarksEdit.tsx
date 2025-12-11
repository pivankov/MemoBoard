import { useEffect, useState } from 'react';
import { Alert, Spin } from 'antd';

import Panel from "components/UI/Panel/Panel"
import { BookmarksItem } from 'types/bookmarks';

import { useBookmarksActionsContext } from 'contexts/BookmarksActionsContext';

interface BookmarksEditProps {
  /** ID редактируемой закладки */
  bookmarkId?: string;
  /** Флаг открытия панели */
  isOpen: boolean;
  /** Коллбэк закрытия панели */
  onClose: () => void;
}

/**
 * Компонент панели редактирования закладки
 * 
 * Управляет загрузкой данных закладки через контекст и отображением формы редактирования.
 * Роутинг управляется родительским компонентом через props.
 */
const BookmarksEdit: React.FC<BookmarksEditProps> = ({ 
  bookmarkId,
  isOpen, 
  onClose 
}) => {
  const { getBookmarkById } = useBookmarksActionsContext();
  
  const [bookmark, setBookmark] = useState<BookmarksItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Загружает данные закладки при изменении bookmarkId
   */
  useEffect(() => {
    const loadBookmark = async () => {
      if (!bookmarkId) {
        setBookmark(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getBookmarkById(bookmarkId);
        
        if (data) {
          setBookmark(data);
        } else {
          setError('Закладка не найдена');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки закладки');
      } finally {
        setLoading(false);
      }
    };

    loadBookmark();
  }, [bookmarkId, getBookmarkById]);

  /**
   * Сброс состояния при закрытии панели
   */
  const handleClose = () => {
    setBookmark(null);
    setError(null);
    onClose();
  };

  return (
    <Panel 
      title="Редактирование закладки"
      isOpened={isOpen} 
      onClose={handleClose}
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
        </div>
      )}

      {error && (
        <Alert 
          message="Ошибка" 
          description={error} 
          type="error" 
          showIcon 
          style={{ marginBottom: 16 }}
        />
      )}

      {!loading && !error && bookmark && (
        <div>
          <p><strong>ID:</strong> {bookmark.id}</p>
          <p><strong>Название:</strong> {bookmark.title}</p>
          <p><strong>URL:</strong> {bookmark.url}</p>
          <p><strong>Описание:</strong> {bookmark.description || 'Нет описания'}</p>
          <p><strong>Теги:</strong> {bookmark.tags.join(', ') || 'Нет тегов'}</p>
          <hr />
          <p style={{ color: '#999' }}>Здесь будет форма редактирования</p>
        </div>
      )}
    </Panel>
  );
};

export default BookmarksEdit;
