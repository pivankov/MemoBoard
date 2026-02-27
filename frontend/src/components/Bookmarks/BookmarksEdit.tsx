import { useEffect, useState } from 'react';
import { Alert, Button, Form, Input, Popconfirm, Spin } from 'antd';

import Panel from "components/UI/Panel/Panel"
import type { BookmarksItem, BookmarksUpdateFormData } from 'types/bookmarks';

import { useBookmarksActionsContext } from 'contexts/BookmarksActionsContext';

const { TextArea } = Input;

interface BookmarksEditProps {
  /** ID редактируемой закладки */
  bookmarkId?: string;
  /** Флаг открытия панели */
  isOpen: boolean;
  /** Коллбэк закрытия панели */
  onClose: () => void;
}

/**
 * Внутренний тип значений формы
 * Содержит только редактируемые поля
 */
interface BookmarksEditFormValues {
  url: string;
  title: string;
  description: string;
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
  const { getBookmarkById, updateBookmark, deleteBookmark } = useBookmarksActionsContext();
  
  const [form] = Form.useForm<BookmarksEditFormValues>();
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
        setBookmark(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки закладки');
      } finally {
        setLoading(false);
      }
    };

    loadBookmark();
  }, [bookmarkId, getBookmarkById]);

  /**
   * Заполняет форму данными при загрузке закладки
   */
  useEffect(() => {
    if (bookmark) {
      form.setFieldsValue({
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description,
      });
    }
  }, [bookmark]);

  /**
   * Сброс состояния при закрытии панели
   */
  const handleClose = () => {
    setBookmark(null);
    setError(null);
    onClose();
  };

  /**
   * Обработчик удаления закладки
   */
  const handleDelete = async () => {
    if (!bookmarkId) return;

    try {
      await deleteBookmark(bookmarkId);
      handleClose();
    } catch {
      // Ошибка обработана в контексте (уведомление показано)
      // Панель остается открытой
    }
  };

  /**
   * Обработчик сохранения изменений
   */
  const handleFinish = async (values: BookmarksEditFormValues) => {
    if (!bookmarkId || !bookmark) return;

    const updateData: BookmarksUpdateFormData = {
      url: values.url,
      title: values.title,
      description: values.description,
      categoryId: bookmark.categoryId,
      tags: bookmark.tags,
      preview: bookmark.preview,
      favorite: bookmark.favorite,
    };

    try {
      await updateBookmark(bookmarkId, updateData);
      handleClose();
    } catch {
      // Ошибка обработана в контексте (уведомление показано)
      // Панель остается открытой
    }
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
        <div className="bookmarks-edit">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
          >
            <div className="form-field__item">
              <label className="form-field__item-label" htmlFor="url">Адрес страницы</label>
              <Form.Item name="url">
                <Input id="url" disabled />
              </Form.Item>
            </div>

            <div className="form-field__item">
              <label className="form-field__item-label" htmlFor="title">Заголовок страницы</label>
              <Form.Item 
                name="title"
                rules={[
                  { required: true, message: 'Заголовок обязателен для заполнения' },
                  { whitespace: true, message: 'Заголовок не может состоять только из пробелов' },
                  { min: 1, message: 'Заголовок не может быть пустым' },
                ]}
              >
                <Input id="title" placeholder="Укажите заголовок страницы" />
              </Form.Item>
            </div>

            <div className="form-field__item">
              <label className="form-field__item-label" htmlFor="description">Описание страницы</label>
              <Form.Item name="description"> 
                <TextArea
                  id="description"
                  showCount
                  maxLength={250}
                  placeholder="Укажите описание страницы"
                  style={{ height: 120, resize: 'none' }}
                />
              </Form.Item>
            </div>

            <div className="form-field__footer">
              <Popconfirm
                title="Удаление закладки"
                description="Вы действительно хотите удалить эту закладку?"
                onConfirm={handleDelete}
                okText="Да"
                cancelText="Нет"
              >
                <Button
                  shape="round"
                  color="danger"
                  variant="text"
                  htmlType="button"
                >Удалить</Button>
              </Popconfirm>            
              <Button
                shape="round"
                color="default"
                variant="filled"
                className="ml-auto"
                htmlType="button"
                onClick={handleClose}
              >Отменить</Button>
              <Form.Item shouldUpdate noStyle>
                {() => (
                  <Button
                    shape="round"
                    type="primary"
                    className="ml-3"
                    htmlType="submit"
                    disabled={form.getFieldsError().some(({ errors }) => errors.length > 0)}
                  >Сохранить</Button>
                )}
              </Form.Item>
            </div>
          </Form>
        </div>
      )}
    </Panel>
  );
};

export default BookmarksEdit;
