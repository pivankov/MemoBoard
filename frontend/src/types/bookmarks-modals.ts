/** Базовый тип модального окна */
type BaseModalState = {
  type: string;
};

/** Создание категории */
type CreateCategoryModalState = {
  type: 'create-category';
  collectionId: string;
};

/** Переименование категории */
type RenameCategoryModalState = {
  type: 'rename-category';
  categoryId: string;
  currentName: string;
};

/** Переименование тега */
type RenameTagModalState = {
  type: 'rename-tag';
  tagId: string;
  currentName: string;
};

/** Создание тега */
type CreateTagModalState = {
  type: 'create-tag';
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
  | CreateCategoryModalState
  | RenameCategoryModalState
  | RenameTagModalState
  | CreateTagModalState
  | DeleteConfirmModalState
  | AddBookmarkModalState
  | null;  // закрыто