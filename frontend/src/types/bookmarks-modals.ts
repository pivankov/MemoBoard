/** Создание сущности (коллекция, категория, тег) */
type CreateEntityModalState = {
  type: 'create-entity';
  entityType: 'collection' | 'category' | 'tag';
  collectionId?: string; // Только для создания категории
};

/** Переименование сущности (коллекция, категория, тег) */
type RenameEntityModalState = {
  type: 'rename-entity';
  entityType: 'collection' | 'category' | 'tag';
  entityId: string;
  currentTitle: string;
};

/** Подтверждение удаления */
type DeleteConfirmModalState = {
  type: 'delete-confirm';
  entityType: 'category' | 'tag' | 'collection';
  entityId: string;
  entityName: string;
};

/** Добавление закладки */
type AddBookmarkModalState = {
  type: 'add-bookmark';
  categoryId?: string;
};

/** Все возможные состояния модалок */
export type ModalState =
  | CreateEntityModalState
  | RenameEntityModalState
  | DeleteConfirmModalState
  | AddBookmarkModalState
  | null; // закрыто