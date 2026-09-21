/**
 * Сервис создания дефолтной структуры закладок для новых пользователей.
 */

import { db } from '../db/initdb.js';
import { generateCategoryUid } from '../utils/uid.js';

/** Название коллекции, создаваемой по умолчанию для нового пользователя. */
export const DEFAULT_COLLECTION_TITLE = 'Коллекция';

/** Название категории внутри дефолтной коллекции. */
export const DEFAULT_CATEGORY_TITLE = 'Категория';

/**
 * Создаёт дефолтную коллекцию с категорией внутри, для указанного пользователя.
 *
 * Функция синхронная (использует только `db.prepare().run()`),
 * что позволяет безопасно вызывать её внутри `db.transaction()`.
 *
 * @param {number} userId - Внутренний id пользователя (users.id)
 * @returns {{ collectionId: number, collectionUid: string, categoryId: number, categoryUid: string }}
 */
export function createDefaultBookmarkStructure(userId) {
  const collectionUid = generateCategoryUid();

  const insertCollection = db.prepare(`
    INSERT INTO bookmark_categories (
      uid, user_id, parent_id, title, icon, position, created_at, updated_at
    )
    VALUES (
      @uid, @user_id, NULL, @title, NULL, 0, datetime('now'), datetime('now')
    )
  `);

  const collectionResult = insertCollection.run({
    uid: collectionUid,
    user_id: userId,
    title: DEFAULT_COLLECTION_TITLE,
  });

  const collectionId = collectionResult.lastInsertRowid;
  const categoryUid = generateCategoryUid();

  const insertCategory = db.prepare(`
    INSERT INTO bookmark_categories (
      uid, user_id, parent_id, title, icon, position, created_at, updated_at
    )
    VALUES (
      @uid, @user_id, @parent_id, @title, 'Folder', 0, datetime('now'), datetime('now')
    )
  `);

  const categoryResult = insertCategory.run({
    uid: categoryUid,
    user_id: userId,
    parent_id: collectionId,
    title: DEFAULT_CATEGORY_TITLE,
  });

  return {
    collectionId,
    collectionUid,
    categoryId: categoryResult.lastInsertRowid,
    categoryUid,
  };
}
