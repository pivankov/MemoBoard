import { useMemo } from 'react';
import { Alert, Button, Modal, Select, Spin, Typography } from 'antd';

import BookmarksCategoriesReorderList from 'components/Bookmarks/BookmarksCategoriesReorderList';
import { useMoveEntityModal } from 'hooks/useMoveEntityModal';

import { SYSTEM_CATEGORIES } from 'constants/bookmarks';
import { useBookmarksModalContext } from 'contexts/BookmarksModalContext';

interface MoveEntityModalProps {
  /** Тип сущности */
  entityType: 'collection' | 'category';
  /** ID сущности */
  entityId: string;
}

const MODAL_TITLES: Record<MoveEntityModalProps['entityType'], string> = {
  collection: 'Порядок коллекций',
  category: 'Переместить категорию',
};

/**
 * Модальное окно для изменения порядка и/или коллекции у категории
 *
 * Для collection: отображает список коллекций с кнопками изменения порядка.
 * Для category: отображает селект выбора коллекции и список категорий с кнопками порядка.
 *
 * Презентационный компонент — вся логика инкапсулирована в useMoveEntityModal.
 */
const MoveEntityModal: React.FC<MoveEntityModalProps> = ({ entityType, entityId }) => {
  const { closeModal } = useBookmarksModalContext();

  const {
    loading,
    isSubmitting,
    isDirty,
    error,
    localCollections,
    localCategories,
    selectedCollectionId,
    handleCollectionChange,
    handleMoveItem,
    handleSubmit,
  } = useMoveEntityModal(entityId, entityType);

  const collectionOptions = useMemo(
    () => localCollections
      .filter(c => c.id !== SYSTEM_CATEGORIES.SYSTEM)
      .map(c => ({ value: c.id, label: c.title })),
    [localCollections],
  );

  return (
    <Modal
      title={MODAL_TITLES[entityType]}
      open={true}
      onCancel={closeModal}
      footer={[
        <Button key="cancel" onClick={closeModal}>
          Отмена
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isSubmitting}
          disabled={!!error || !isDirty}
          onClick={handleSubmit}
        >
          Сохранить
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        <div style={{ minHeight: 100 }}>
          {error ? (
            <Alert type="error" message={error} />
          ) : (
            <div className="mt-6 mb-6">
              {entityType === 'collection' && (
                <BookmarksCategoriesReorderList
                  items={localCollections}
                  activeId={entityId}
                  disabledIds={[SYSTEM_CATEGORIES.SYSTEM]}
                  onMove={(index, direction) => handleMoveItem('collections', index, direction)}
                />
              )}

              {entityType === 'category' && (
                <>
                  <div className="form-field__item">
                    <label className="form-field__item-label" htmlFor="collectionSelect">Коллекция</label>
                    <Select
                      id="collectionSelect"
                      style={{ width: '100%', marginTop: 4, marginBottom: 16 }}
                      value={selectedCollectionId}
                      options={collectionOptions}
                      onChange={handleCollectionChange}
                    />
                  </div>

                  <div className="form-field__item">
                    <label className="form-field__item-label">Порядок категорий</label>
                    <BookmarksCategoriesReorderList
                      items={localCategories}
                      activeId={entityId}
                      onMove={(index, direction) => handleMoveItem('categories', index, direction)}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Spin>
    </Modal>
  );
};

export default MoveEntityModal;
