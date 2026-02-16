/**
 * Константы для работы с закладками
 */

export const SYSTEM_ROUTES = {
  /** Роут локальной страницы 404 */
  NOT_FOUND: 'not-found',
} as const;

/**
 * ID системных категорий
 */
export const SYSTEM_CATEGORIES = {
  /** ID коллекции "Системные" */
  SYSTEM: '0000',
  /** ID коллекции "Теги" (виртуальная системная коллекция) */
  TAGS: '0001',
  /** ID категории "Несортированные" */
  UNSORTED: 'ktGDhX',
  /** ID категории "Корзина" */
  TRASH: 'wxiqnC',
} as const;

