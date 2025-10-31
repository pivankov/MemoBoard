/**
 * Основной тип закладки
 */
export type Bookmark = {
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
export type Tag = {
  id: string;
  title: string;
  amount: number;
};

/**
 * Тип категории закладки
 */
export type Category = {
  id: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  position: number;
  amount: number;
  createdAt: string;
  updatedAt: string | null;
};