/**
 * Константы для работы с закладками
 */

export const SYSTEM_ROUTES = {
  /** Роут локальной страницы 404 */
  NOT_FOUND: 'not-found',
  /** Роут "Все закладки" */
  ALL: 'all',
  /** Роут "Избранные" */
  FAVORITES: 'favorites',
  /** Роут "Несортированные" */
  UNSORTED: 'unsorted',
  /** Роут "Корзина" */
  TRASH: 'trash',
} as const;

/**
 * Конфигурация системных роутов: заголовок, иконка и ссылка для каждого пункта меню
 */
export const SYSTEM_ROUTE_CONFIG = {
  [SYSTEM_ROUTES.ALL]: {
    title: 'Все закладки',
    icon: 'Book',
    link: `/bookmarks`,
  },
  [SYSTEM_ROUTES.FAVORITES]: {
    title: 'Избранные',
    icon: 'Star',
    link: `/bookmarks/${SYSTEM_ROUTES.FAVORITES}`,
  },
  [SYSTEM_ROUTES.UNSORTED]: {
    title: 'Несортированные',
    icon: 'Inbox',
    link: `/bookmarks/${SYSTEM_ROUTES.UNSORTED}`,
  },
  [SYSTEM_ROUTES.TRASH]: {
    title: 'Корзина',
    icon: 'Trash',
    link: `/bookmarks/${SYSTEM_ROUTES.TRASH}`,
  },
} as const;

/**
 * ID системных категорий
 */
export const SYSTEM_CATEGORIES = {
  /** ID коллекции "Теги" (виртуальная системная коллекция) */
  TAGS: '0001',
} as const;

