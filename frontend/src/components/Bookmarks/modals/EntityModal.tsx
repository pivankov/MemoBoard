import { useRef,useState } from 'react';
import { Button, Input, Modal } from 'antd';

import type { InputRef } from 'antd';
import { useBookmarksActionsContext } from 'contexts/BookmarksActionsContext';
import { useBookmarksModalContext } from 'contexts/BookmarksModalContext';

/**
 * Конфигурация для разных типов сущностей
 */
const ENTITY_CONFIG = {
  collection: {
    createTitle: 'Создание коллекции',
    renameTitle: 'Переименование коллекции',
    placeholder: 'Название коллекции',
  },
  category: {
    createTitle: 'Создание категории',
    renameTitle: 'Переименование категории',
    placeholder: 'Название категории',
  },
  tag: {
    createTitle: 'Создание тега',
    renameTitle: 'Переименование тега',
    placeholder: 'Название тега',
  },
} as const;

type EntityType = keyof typeof ENTITY_CONFIG;

interface EntityModalProps {
  /** Тип операции */
  mode: 'create' | 'rename';
  /** Тип сущности */
  entityType: EntityType;
  /** Текущее имя (для режима rename) */
  currentTitle?: string;
  /** ID сущности (для режима rename) */
  entityId?: string;
  /** ID коллекции (для создания категории) */
  collectionId?: string;
}

/**
 * Универсальное модальное окно для создания/переименования сущностей
 * 
 * Поддерживает два режима:
 * - create: создание новой сущности (коллекция, категория, тег)
 * - rename: переименование существующей сущности
 * 
 * Автоматически выбирает нужный метод API и текст интерфейса
 * на основе переданных параметров.
 */
const EntityModal: React.FC<EntityModalProps> = ({
  mode,
  entityType,
  currentTitle = '',
  entityId,
  collectionId,
}) => {
  const { closeModal } = useBookmarksModalContext();
  const {
    createCollection,
    createCategory,
    createTag,
    renameCollection,
    renameCategory,
    renameTag,
  } = useBookmarksActionsContext();

  const [title, setTitle] = useState(currentTitle);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<InputRef>(null);

  const config = ENTITY_CONFIG[entityType];
  const modalTitle = mode === 'create' ? config.createTitle : config.renameTitle;
  const buttonText = mode === 'create' ? 'Создать' : 'Переименовать';

  const callApiMethod = async (trimmedTitle: string): Promise<void> => {
    if (mode === 'create') {
      // Создание
      switch (entityType) {
        case 'collection':
          return createCollection(trimmedTitle);
        case 'category':
          if (!collectionId) {
            throw new Error('collectionId is required for creating category');
          }
          return createCategory(collectionId, trimmedTitle);
        case 'tag':
          return createTag(trimmedTitle);
      }
    } else {
      // Переименование
      if (!entityId) {
        throw new Error('entityId is required for rename operation');
      }

      switch (entityType) {
        case 'collection':
          return renameCollection(entityId, trimmedTitle);
        case 'category':
          return renameCategory(entityId, trimmedTitle);
        case 'tag':
          return renameTag(entityId, trimmedTitle);
      }
    }
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    
    if (!trimmedTitle) return;

    setIsSubmitting(true);
    try {
      await callApiMethod(trimmedTitle);
      closeModal();
    } catch (error) {
      // Ошибка обрабатывается в BookmarksActionsContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAfterOpenChange = (open: boolean) => {
    if (open) {
      // Устанавливаем фокус после завершения анимации открытия
      inputRef.current?.focus();
    }
  };

  return (
    <Modal
      title={modalTitle}
      open={true}
      onCancel={closeModal}
      afterOpenChange={handleAfterOpenChange}
      footer={[
        <Button key="cancel" onClick={closeModal}>
          Отмена
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          disabled={!title.trim() || isSubmitting}
          loading={isSubmitting}
        >
          {buttonText}
        </Button>,
      ]}
    >
      <Input
        ref={inputRef}
        placeholder={config.placeholder}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onPressEnter={handleSubmit}
      />
    </Modal>
  );
};

export default EntityModal;