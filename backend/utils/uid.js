import { nanoid } from 'nanoid';
import { db } from '../db/initdb.js';

/**
 * Размеры UID для разных сущностей
 */
export const UID_LENGTH = {
  BOOKMARK: 8,
  CATEGORY: 4,
  TAG: 5,
  EVENT: 8,
  USER: 8,
};

/**
 * Генерирует уникальный UID для закладки
 * @returns {string} Уникальный UID длиной 8 символов
 */
export const generateBookmarkUid = () => {
  return generateUniqueUid('bookmarks', UID_LENGTH.BOOKMARK);
};

/**
 * Генерирует уникальный UID для категории
 * @returns {string} Уникальный UID длиной 4 символа
 */
export const generateCategoryUid = () => {
  return generateUniqueUid('bookmark_categories', UID_LENGTH.CATEGORY);
};

/**
 * Универсальная функция генерации уникального UID
 * Проверяет уникальность в БД, делает до 10 попыток при коллизии
 * 
 * @param {string} tableName - название таблицы для проверки уникальности
 * @param {number} length - длина генерируемого UID
 * @returns {string} уникальный UID
 * @throws {Error} если не удалось сгенерировать уникальный UID за 10 попыток
 */
function generateUniqueUid(tableName, length) {
  let uid;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    uid = nanoid(length);
    const existing = db.prepare(`SELECT id FROM ${tableName} WHERE uid = ?`).get(uid);
    attempts++;
    
    if (!existing) break;
    if (attempts >= maxAttempts) {
      throw new Error(`Не удалось сгенерировать уникальный UID для ${tableName} за ${maxAttempts} попыток`);
    }
  } while (attempts < maxAttempts);
  
  return uid;
}

