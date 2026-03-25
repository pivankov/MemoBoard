/**
 * Основной тип закладки
 */
export type BookmarksItem = {
  id: string;
  categoryId: string;
  url: string;
  title: string;
  description: string;
  tags: string[];
  preview: string;
  createdAt: string;
  updatedAt: string | null;
  transitionCounter: number | null;
  favorite: boolean;
  inTrash?: boolean;
};

/**
 * Тип тега
 */
export type BookmarksTag = {
  id: string;
  title: string;
  amount: number;
};

/**
 * Расширенный тип тега с флагом выбора
 * Используется для отображения тегов в списке закладок
 */
export type BookmarksTagWithSelected = BookmarksTag & {
  selected: boolean;
};

/**
 * Тип категории закладки
 */
export type BookmarksCategory = {
  id: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  position: number;
  amount: number;
  createdAt: string;
  updatedAt: string | null;
};

/**
 * Тип сгруппированных категорий
 */
export type BookmarksCategoriesGrouped = {
  id: string;
  title: string;
  children: BookmarksCategory[];
}

/**
 * Счётчики закладок для системных категорий
 */
export type BookmarksSystemCounts = {
  all: number;
  favorites: number;
  unsorted: number;
  trash: number;
};

/**
 * Тип заголовка панели списка закладок
 */
export type BookmarksListPanelHeader = {
  title: string;
  icon: string;  
}

/**
 * Данные формы для создания закладки
 */
export type BookmarksCreateFormData = {
  url: string;
  categoryId: string | null;
};

/**
 * Данные формы для редактирования закладки
 */
export type BookmarksUpdateFormData = {
  url: string;
  title: string;
  description: string;
  categoryId: string;
  /** ID существующих тегов, которые нужно сохранить */
  existingTagIds: string[];
  /** Названия новых тегов, которые нужно создать и привязать */
  newTagTitles: string[];
  preview: string;
  favorite: boolean;
};

/**
 * Типы сущностей меню-списка в боковом меню
 */
export type BookmarksSidebarListType = 'collection' | 'tags-collection' | 'category' | 'tag';

/**
 * Элемент для batch-обновления позиции категории/коллекции
 * Используется в эндпоинте PATCH /categories/reorder
 */
export type BookmarksCategoriesReorderItem = {
  /** UID категории или коллекции */
  id: string;
  /** Новая позиция среди одноуровневых сородичей */
  position: number;
  /** Новый parentId — передаётся только при смене коллекции у категории */
  parentId?: string;
};