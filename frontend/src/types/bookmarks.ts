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
 * Тип заголовка панели списка закладок
 */
export type BookmarksListPanelHeader = {
  title: string;
  icon: string;  
}

/**
 * Данные закладки, полученные после парсинга URL
 */
export type BookmarksParsedData = {
  url: string;
  title: string;
  description: string;
  preview: string;
};

/**
 * Данные формы для создания/редактирования закладки
 */
export type BookmarksFormData = {
  url: string;
  title: string;
  description: string;
  categoryId: string;
  tags: string[];
  preview: string;
  favorite: boolean;
};