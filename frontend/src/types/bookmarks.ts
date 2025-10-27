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
  isFavorite: boolean;
};