import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import argon2 from 'argon2';

import { DUMMY_EVENTS } from './seeds/events.js';
import { DUMMY_BOOKMARK_CATEGORIES, DUMMY_BOOKMARK_TAGS, DUMMY_BOOKMARKS } from './seeds/bookmarks.js';
import { deletePreview } from '../utils/preview.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database(path.join(__dirname, 'data.db'));

const SCHEMA_VERSION = 2;
const ARGON2_TIME_COST = 3;
const ARGON2_MEMORY_COST = 65536; // 2^16
const ARGON2_PARALLELISM = 1;
const DEMO_EMAIL = 'demo@example.com';

const USERS_FIELDS = {
   id: 'INTEGER PRIMARY KEY',
   uid: 'TEXT UNIQUE NOT NULL',
   email: 'TEXT UNIQUE',
   name: 'TEXT',
   password_hash: 'TEXT NOT NULL',
   password_algo: "TEXT NOT NULL DEFAULT 'argon2id'",
   password_updated_at: "TEXT NOT NULL DEFAULT (datetime('now'))",
   created_at: "TEXT NOT NULL DEFAULT (datetime('now'))",
   updated_at: "TEXT NOT NULL DEFAULT (datetime('now'))",
};

const EVENTS_FIELDS = {
   id: 'INTEGER PRIMARY KEY',
   uid: 'TEXT NOT NULL',
   user_id: 'INTEGER NOT NULL',
   title: 'TEXT NOT NULL',
   type_id: 'INTEGER NOT NULL',
   start_at: 'TEXT NOT NULL',
   description: 'TEXT',
   recurrence: "TEXT NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none','monthly','yearly'))",
   created_at: "TEXT NOT NULL DEFAULT (datetime('now'))",
   updated_at: "TEXT NOT NULL DEFAULT (datetime('now'))",
};

const EVENT_TYPES_FIELDS = {
  id: 'INTEGER PRIMARY KEY',
  title: 'TEXT NOT NULL',
  slug: 'TEXT NOT NULL UNIQUE',
};

const BOOKMARK_CATEGORIES_FIELDS = {
  id: 'INTEGER PRIMARY KEY',
  uid: 'TEXT UNIQUE NOT NULL',
  user_id: 'INTEGER NOT NULL',
  parent_id: 'INTEGER',
  title: 'TEXT NOT NULL',
  icon: 'TEXT',
  position: "INTEGER NOT NULL DEFAULT 0",
  created_at: "TEXT NOT NULL DEFAULT (datetime('now'))",
  updated_at: "TEXT NOT NULL DEFAULT (datetime('now'))",
};

const BOOKMARK_TAGS_FIELDS = {
  id: 'INTEGER PRIMARY KEY',
  uid: 'TEXT UNIQUE NOT NULL',
  user_id: 'INTEGER NOT NULL',
  title: 'TEXT NOT NULL',
  created_at: "TEXT NOT NULL DEFAULT (datetime('now'))",
  updated_at: "TEXT NOT NULL DEFAULT (datetime('now'))",
};

const BOOKMARKS_FIELDS = {
  id: 'INTEGER PRIMARY KEY',
  uid: 'TEXT UNIQUE NOT NULL',
  user_id: 'INTEGER NOT NULL',
  category_id: 'INTEGER',
  url: 'TEXT NOT NULL',
  title: 'TEXT NOT NULL',
  description: 'TEXT',
  preview: 'TEXT',
  opened_at: 'TEXT',
  transition_counter: "INTEGER NOT NULL DEFAULT 0",
  favorite: "INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0,1))",
  in_trash: "INTEGER NOT NULL DEFAULT 0 CHECK (in_trash IN (0,1))",
  created_at: "TEXT NOT NULL DEFAULT (datetime('now'))",
  updated_at: "TEXT NOT NULL DEFAULT (datetime('now'))",
};

const BOOKMARK_TAG_RELATIONS_FIELDS = {
  bookmark_id: 'INTEGER NOT NULL',
  tag_id: 'INTEGER NOT NULL',
};

const SESSIONS_FIELDS = {
  id: 'INTEGER PRIMARY KEY',
  uid: 'TEXT UNIQUE NOT NULL',
  user_id: 'INTEGER NOT NULL',
  family_id: 'TEXT NOT NULL',
  token_hash: 'TEXT UNIQUE NOT NULL',
  expires_at: 'TEXT NOT NULL',
  revoked_at: 'TEXT',
  replaced_by_id: 'INTEGER',
  user_agent: 'TEXT',
  ip_address: 'TEXT',
  created_at: "TEXT NOT NULL DEFAULT (datetime('now'))",
  last_used_at: "TEXT NOT NULL DEFAULT (datetime('now'))",
};

function getUserVersion() {
  return db.pragma('user_version', { simple: true });
}

function setUserVersion(version) {
  db.pragma(`user_version = ${version}`);
}

/**
 * Наполняет БД dummy-данными для указанного пользователя.
 * Идемпотентна: при повторном запуске пропускает записи, уже существующие по uid.
 * Используется как для первичного посева, так и для периодического ресета demo-аккаунта.
 */
function seedUserData(userId) {
  // === Типы событий (глобальная таблица, без user_id) ===
  const insertEventType = db.prepare('INSERT OR IGNORE INTO event_types (title, slug) VALUES (@title, @slug)');
  const seedEventTypes = db.transaction(() => {
    insertEventType.run({ title: 'Другое', slug: 'other' });
    insertEventType.run({ title: 'Праздник', slug: 'holiday' });
    insertEventType.run({ title: 'День рождения', slug: 'birthday' });
    insertEventType.run({ title: 'Церковный праздник', slug: 'church' });
  });
  seedEventTypes();

  // === События ===
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (uid, user_id, title, type_id, start_at, description, recurrence)
    VALUES (@uid, @user_id, @title, @type_id, @start_at, @description, @recurrence)
  `);
  const selectEvent = db.prepare('SELECT id FROM events WHERE user_id = ? AND uid = ? LIMIT 1');
  const typeRows = db.prepare('SELECT id, slug FROM event_types').all();
  const slugToId = Object.fromEntries(typeRows.map(r => [r.slug, r.id]));

  const eventsPrepared = DUMMY_EVENTS.map(e => ({
    uid: e.uid,
    user_id: userId,
    title: e.title,
    type_id: slugToId[e.type],
    start_at: e.start_at,
    description: e.description,
    recurrence: e.recurrence ?? 'none',
  }));

  const seedEvents = db.transaction(() => {
    for (const ev of eventsPrepared) {
      const existing = selectEvent.get(ev.user_id, ev.uid);
      if (!existing) {
        insertEvent.run(ev);
      }
    }
  });
  seedEvents();

  // === Категории закладок ===
  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO bookmark_categories (uid, user_id, parent_id, title, icon, position, created_at, updated_at)
    VALUES (@uid, @user_id, @parent_id, @title, @icon, @position, datetime('now'), datetime('now'))
  `);
  const selectCategoryUid = db.prepare('SELECT id FROM bookmark_categories WHERE uid = ? AND user_id = ? LIMIT 1');

  const uidToCategoryId = {};
  const existingCategories = db.prepare('SELECT id, uid FROM bookmark_categories WHERE user_id = ?').all(userId);
  for (const cat of existingCategories) {
    uidToCategoryId[cat.uid] = cat.id;
  }

  // Топологическая сортировка категорий для корректной обработки многоуровневой иерархии
  const categoryMap = new Map(DUMMY_BOOKMARK_CATEGORIES.map(cat => [cat.uid, cat]));
  const sortedCategories = [];
  const processed = new Set();
  const visiting = new Set();

  const visit = (catUid) => {
    if (visiting.has(catUid)) {
      throw new Error(`Циклическая зависимость обнаружена в категориях: ${catUid}`);
    }
    if (processed.has(catUid)) {
      return;
    }

    const cat = categoryMap.get(catUid);
    if (!cat) {
      throw new Error(`Категория ${catUid} не найдена, но на неё ссылается другая категория`);
    }

    visiting.add(catUid);

    const parentUid = cat.parent_uid && cat.parent_uid !== "0" && cat.parent_uid !== "" ? cat.parent_uid : null;

    if (parentUid && !processed.has(parentUid) && categoryMap.has(parentUid)) {
      visit(parentUid);
    }

    visiting.delete(catUid);
    processed.add(catUid);
    sortedCategories.push(cat);
  };

  for (const cat of DUMMY_BOOKMARK_CATEGORIES) {
    if (!processed.has(cat.uid)) {
      visit(cat.uid);
    }
  }

  const seedCategories = db.transaction(() => {
    for (const cat of sortedCategories) {
      const existing = selectCategoryUid.get(cat.uid, userId);
      if (existing) {
        uidToCategoryId[cat.uid] = existing.id;
        continue;
      }

      const parentIdValue = cat.parent_uid && cat.parent_uid !== "0" && cat.parent_uid !== ""
        ? uidToCategoryId[cat.parent_uid] ?? null
        : null;

      const result = insertCategory.run({
        uid: cat.uid,
        user_id: userId,
        parent_id: parentIdValue,
        title: cat.title,
        icon: cat.icon || null,
        position: cat.position,
      });

      if (result.changes > 0) {
        uidToCategoryId[cat.uid] = result.lastInsertRowid;
      } else {
        const existingCat = selectCategoryUid.get(cat.uid, userId);
        if (existingCat) {
          uidToCategoryId[cat.uid] = existingCat.id;
        }
      }
    }
  });

  seedCategories();

  // === Теги закладок ===
  const insertTag = db.prepare(`
    INSERT OR IGNORE INTO bookmark_tags (uid, user_id, title, created_at, updated_at)
    VALUES (@uid, @user_id, @title, datetime('now'), datetime('now'))
  `);
  const selectTagUid = db.prepare('SELECT id FROM bookmark_tags WHERE uid = ? AND user_id = ? LIMIT 1');

  const uidToTagId = {};
  const existingTags = db.prepare('SELECT id, uid FROM bookmark_tags WHERE user_id = ?').all(userId);
  for (const tag of existingTags) {
    uidToTagId[tag.uid] = tag.id;
  }

  for (const tag of DUMMY_BOOKMARK_TAGS) {
    const existing = selectTagUid.get(tag.uid, userId);
    if (existing) {
      uidToTagId[tag.uid] = existing.id;
      continue;
    }
    const result = insertTag.run({
      uid: tag.uid,
      user_id: userId,
      title: tag.title,
    });
    if (result.changes > 0) {
      uidToTagId[tag.uid] = result.lastInsertRowid;
    } else {
      const existingTag = selectTagUid.get(tag.uid, userId);
      if (existingTag) {
        uidToTagId[tag.uid] = existingTag.id;
      }
    }
  }

  // === Закладки ===
  const insertBookmark = db.prepare(`
    INSERT OR IGNORE INTO bookmarks (uid, user_id, category_id, url, title, description, preview, transition_counter, favorite, in_trash, created_at, updated_at)
    VALUES (@uid, @user_id, @category_id, @url, @title, @description, @preview, @transition_counter, @favorite, @in_trash, @created_at, @updated_at)
  `);
  const insertBookmarkTagRelation = db.prepare(`
    INSERT OR IGNORE INTO bookmark_tag_relations (bookmark_id, tag_id)
    VALUES (@bookmark_id, @tag_id)
  `);
  const selectBookmarkUid = db.prepare('SELECT id FROM bookmarks WHERE uid = ? AND user_id = ? LIMIT 1');

  const categoryRows = db.prepare('SELECT id, uid FROM bookmark_categories WHERE user_id = ?').all(userId);
  const categoryUidToId = Object.fromEntries(categoryRows.map(r => [r.uid, r.id]));

  for (const bm of DUMMY_BOOKMARKS) {
    const existing = selectBookmarkUid.get(bm.uid, userId);
    if (existing) {
      continue;
    }
    const categoryId = bm.category_uid ? categoryUidToId[bm.category_uid] ?? null : null;
    if (bm.category_uid && !categoryId) {
      console.warn(`Предупреждение: категория с uid "${bm.category_uid}" не найдена для закладки "${bm.title}" (uid: ${bm.uid})`);
    }
    const createdAt = bm.created_at ? bm.created_at.replace(' ', 'T') + 'Z' : new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const updatedAt = bm.updated_at ? bm.updated_at.replace(' ', 'T') + 'Z' : createdAt;
    const result = insertBookmark.run({
      uid: bm.uid,
      user_id: userId,
      category_id: categoryId,
      url: bm.url,
      title: bm.title,
      description: bm.description || null,
      preview: bm.preview || null,
      transition_counter: bm.transition_counter ?? 0,
      favorite: bm.favorite ? 1 : 0,
      in_trash: bm.in_trash ? 1 : 0,
      created_at: createdAt,
      updated_at: updatedAt,
    });
    let bookmarkId;
    if (result.changes > 0) {
      bookmarkId = result.lastInsertRowid;
    } else {
      const existingBm = selectBookmarkUid.get(bm.uid, userId);
      if (!existingBm) continue;
      bookmarkId = existingBm.id;
    }
    if (bm.tags && Array.isArray(bm.tags)) {
      for (const tagUid of bm.tags) {
        const tagId = uidToTagId[tagUid];
        if (tagId) {
          insertBookmarkTagRelation.run({ bookmark_id: bookmarkId, tag_id: tagId });
        } else {
          console.warn(`Предупреждение: тег с uid "${tagUid}" не найден для закладки "${bm.title}" (uid: ${bm.uid})`);
        }
      }
    }
  }
}

/**
 * Удаляет все данные demo-пользователя и заново засевает их из DUMMY_*.
 * Файлы превью, принадлежащие закладкам demo, удаляются с диска (best-effort).
 * Если demo-пользователь не найден — ничего не делает.
 *
 * @returns {Promise<{ reset: boolean, deletedPreviews: number }>}
 */
async function resetDemoData() {
  const demoRow = db.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').get(DEMO_EMAIL);
  if (!demoRow) {
    console.warn(`[resetDemoData] Демо-пользователь ${DEMO_EMAIL} не найден, пропускаю ресет.`);
    return { reset: false, deletedPreviews: 0 };
  }
  const demoId = demoRow.id;

  // Собираем пути к файлам превью ДО удаления записей
  const previewsToDelete = db.prepare(
    `SELECT preview FROM bookmarks WHERE user_id = ? AND preview IS NOT NULL AND preview != ''`
  ).all(demoId).map(r => r.preview);

  // Транзакционно чистим данные demo-пользователя.
  // bookmark_tag_relations чистятся каскадно (FK ON DELETE CASCADE).
  const wipe = db.transaction(() => {
    db.prepare('DELETE FROM bookmarks WHERE user_id = ?').run(demoId);
    db.prepare('DELETE FROM bookmark_tags WHERE user_id = ?').run(demoId);
    db.prepare('DELETE FROM bookmark_categories WHERE user_id = ?').run(demoId);
    db.prepare('DELETE FROM events WHERE user_id = ?').run(demoId);
  });
  wipe();

  // Удаляем файлы превью вне транзакции (fs-операции). Ошибки не критичны.
  for (const previewPath of previewsToDelete) {
    await deletePreview(previewPath);
  }

  seedUserData(demoId);

  return { reset: true, deletedPreviews: previewsToDelete.length };
}

async function initDb(options = {}) {
  const { seed = true } = options;
  db.pragma('foreign_keys = ON');

  const createUsersSql = `
    CREATE TABLE IF NOT EXISTS users (
      id ${USERS_FIELDS.id},
      uid ${USERS_FIELDS.uid},
      email ${USERS_FIELDS.email},
      name ${USERS_FIELDS.name},
      password_hash ${USERS_FIELDS.password_hash},
      password_algo ${USERS_FIELDS.password_algo},
      password_updated_at ${USERS_FIELDS.password_updated_at},
      created_at ${USERS_FIELDS.created_at},
      updated_at ${USERS_FIELDS.updated_at}
    );
  `;

  const createEventTypesSql = `
    CREATE TABLE IF NOT EXISTS event_types (
      id ${EVENT_TYPES_FIELDS.id},
      title ${EVENT_TYPES_FIELDS.title},
      slug ${EVENT_TYPES_FIELDS.slug}
    );
  `;

  const createUsersUpdatedAtTrigger = `
    CREATE TRIGGER IF NOT EXISTS users_set_updated_at
    AFTER UPDATE OF uid, email, name, password_hash, password_algo, password_updated_at, created_at ON users
    FOR EACH ROW BEGIN
      UPDATE users SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `;

  const createEventsSql = `
    CREATE TABLE IF NOT EXISTS events (
      id ${EVENTS_FIELDS.id},
      uid ${EVENTS_FIELDS.uid},
      user_id ${EVENTS_FIELDS.user_id} REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT,
      title ${EVENTS_FIELDS.title},
      type_id ${EVENTS_FIELDS.type_id} REFERENCES event_types(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
      start_at ${EVENTS_FIELDS.start_at},
      description ${EVENTS_FIELDS.description},
      recurrence ${EVENTS_FIELDS.recurrence},
      created_at ${EVENTS_FIELDS.created_at},
      updated_at ${EVENTS_FIELDS.updated_at},
      UNIQUE (user_id, uid)
    );
  `;

  const createEventsUpdatedAtTrigger = `
    CREATE TRIGGER IF NOT EXISTS events_set_updated_at
    AFTER UPDATE OF uid, user_id, title, type_id, start_at, description, recurrence, created_at ON events
    FOR EACH ROW BEGIN
      UPDATE events SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `;

  const createEventsIndexesSql = `
    CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_user_start_at ON events(user_id, start_at);
    CREATE INDEX IF NOT EXISTS idx_events_user_type ON events(user_id, type_id);
  `;

  const createBookmarkCategoriesSql = `
    CREATE TABLE IF NOT EXISTS bookmark_categories (
      id ${BOOKMARK_CATEGORIES_FIELDS.id},
      uid ${BOOKMARK_CATEGORIES_FIELDS.uid},
      user_id ${BOOKMARK_CATEGORIES_FIELDS.user_id} REFERENCES users(id) ON DELETE CASCADE,
      parent_id ${BOOKMARK_CATEGORIES_FIELDS.parent_id} REFERENCES bookmark_categories(id) ON DELETE SET NULL,
      title ${BOOKMARK_CATEGORIES_FIELDS.title},
      icon ${BOOKMARK_CATEGORIES_FIELDS.icon},
      position ${BOOKMARK_CATEGORIES_FIELDS.position},
      created_at ${BOOKMARK_CATEGORIES_FIELDS.created_at},
      updated_at ${BOOKMARK_CATEGORIES_FIELDS.updated_at}
    );
  `;

  const createBookmarkTagsSql = `
    CREATE TABLE IF NOT EXISTS bookmark_tags (
      id ${BOOKMARK_TAGS_FIELDS.id},
      uid ${BOOKMARK_TAGS_FIELDS.uid},
      user_id ${BOOKMARK_TAGS_FIELDS.user_id} REFERENCES users(id) ON DELETE CASCADE,
      title ${BOOKMARK_TAGS_FIELDS.title},
      created_at ${BOOKMARK_TAGS_FIELDS.created_at},
      updated_at ${BOOKMARK_TAGS_FIELDS.updated_at}
    );
  `;

  const createBookmarksSql = `
    CREATE TABLE IF NOT EXISTS bookmarks (
      id ${BOOKMARKS_FIELDS.id},
      uid ${BOOKMARKS_FIELDS.uid},
      user_id ${BOOKMARKS_FIELDS.user_id} REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT,
      category_id ${BOOKMARKS_FIELDS.category_id} REFERENCES bookmark_categories(id) ON DELETE SET NULL ON UPDATE RESTRICT,
      url ${BOOKMARKS_FIELDS.url},
      title ${BOOKMARKS_FIELDS.title},
      description ${BOOKMARKS_FIELDS.description},
      preview ${BOOKMARKS_FIELDS.preview},
      opened_at ${BOOKMARKS_FIELDS.opened_at},
      transition_counter ${BOOKMARKS_FIELDS.transition_counter},
      favorite ${BOOKMARKS_FIELDS.favorite},
      in_trash ${BOOKMARKS_FIELDS.in_trash},
      created_at ${BOOKMARKS_FIELDS.created_at},
      updated_at ${BOOKMARKS_FIELDS.updated_at}
    );
  `;

  const createBookmarkTagRelationsSql = `
    CREATE TABLE IF NOT EXISTS bookmark_tag_relations (
      bookmark_id ${BOOKMARK_TAG_RELATIONS_FIELDS.bookmark_id} REFERENCES bookmarks(id) ON DELETE CASCADE,
      tag_id ${BOOKMARK_TAG_RELATIONS_FIELDS.tag_id} REFERENCES bookmark_tags(id) ON DELETE CASCADE,
      PRIMARY KEY (bookmark_id, tag_id)
    );
  `;

  const createBookmarkCategoriesUpdatedAtTrigger = `
    CREATE TRIGGER IF NOT EXISTS bookmark_categories_set_updated_at
    AFTER UPDATE OF uid, user_id, parent_id, title, icon, position, created_at ON bookmark_categories
    FOR EACH ROW BEGIN
      UPDATE bookmark_categories SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `;

  const createBookmarkTagsUpdatedAtTrigger = `
    CREATE TRIGGER IF NOT EXISTS bookmark_tags_set_updated_at
    AFTER UPDATE OF uid, user_id, title, created_at ON bookmark_tags
    FOR EACH ROW BEGIN
      UPDATE bookmark_tags SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `;

  const createBookmarksUpdatedAtTrigger = `
    CREATE TRIGGER IF NOT EXISTS bookmarks_set_updated_at
    AFTER UPDATE OF uid, user_id, category_id, url, title, description, preview, opened_at, transition_counter, favorite, in_trash, created_at ON bookmarks
    FOR EACH ROW BEGIN
      UPDATE bookmarks SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `;

  const createBookmarkIndexesSql = `
    CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_category_id ON bookmarks(category_id);
    CREATE INDEX IF NOT EXISTS idx_bookmark_categories_user_id ON bookmark_categories(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookmark_tags_user_id ON bookmark_tags(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookmark_tag_relations_bookmark_id ON bookmark_tag_relations(bookmark_id);
    CREATE INDEX IF NOT EXISTS idx_bookmark_tag_relations_tag_id ON bookmark_tag_relations(tag_id);
  `;

  const createSessionsSql = `
    CREATE TABLE IF NOT EXISTS sessions (
      id ${SESSIONS_FIELDS.id},
      uid ${SESSIONS_FIELDS.uid},
      user_id ${SESSIONS_FIELDS.user_id} REFERENCES users(id) ON DELETE CASCADE,
      family_id ${SESSIONS_FIELDS.family_id},
      token_hash ${SESSIONS_FIELDS.token_hash},
      expires_at ${SESSIONS_FIELDS.expires_at},
      revoked_at ${SESSIONS_FIELDS.revoked_at},
      replaced_by_id ${SESSIONS_FIELDS.replaced_by_id} REFERENCES sessions(id) ON DELETE SET NULL,
      user_agent ${SESSIONS_FIELDS.user_agent},
      ip_address ${SESSIONS_FIELDS.ip_address},
      created_at ${SESSIONS_FIELDS.created_at},
      last_used_at ${SESSIONS_FIELDS.last_used_at}
    );
  `;

  const createSessionsIndexesSql = `
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_family_id ON sessions(family_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
  `;

  const createSchema = db.transaction(() => {
    db.exec(createUsersSql);
    db.exec(createEventTypesSql);
    db.exec(createEventsSql);
    db.exec(createBookmarkCategoriesSql);
    db.exec(createBookmarkTagsSql);
    db.exec(createBookmarksSql);
    db.exec(createBookmarkTagRelationsSql);
    db.exec(createSessionsSql);              // ← НОВОЕ
    db.exec(createEventsIndexesSql);
    db.exec(createBookmarkIndexesSql);
    db.exec(createSessionsIndexesSql);       // ← НОВОЕ
    db.exec(createUsersUpdatedAtTrigger);
    db.exec(createEventsUpdatedAtTrigger);
    db.exec(createBookmarkCategoriesUpdatedAtTrigger);
    db.exec(createBookmarkTagsUpdatedAtTrigger);
    db.exec(createBookmarksUpdatedAtTrigger);
  });

  const migrateFrom0To1 = async () => {
    createSchema();

    if (!seed) return;

    const insertUser = db.prepare('INSERT INTO users (uid, email, name, password_hash, password_algo) VALUES (@uid, @email, @name, @password_hash, @password_algo)');
    const demoPassword = 'demo';
    const demoHash = await argon2.hash(demoPassword, {
      type: argon2.argon2id,
      timeCost: ARGON2_TIME_COST,
      memoryCost: ARGON2_MEMORY_COST,
      parallelism: ARGON2_PARALLELISM,
    });

    insertUser.run({
      uid: randomUUID(),
      email: DEMO_EMAIL,
      name: 'demo',
      password_hash: demoHash,
      password_algo: 'argon2id',
    });

    const demoRow = db.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').get(DEMO_EMAIL);
    const demoId = demoRow?.id;
    if (!demoId) return;

    seedUserData(demoId);
  };

  const migrateFrom1To2 = () => {
    db.transaction(() => {
      db.exec(createSessionsSql);
      db.exec(createSessionsIndexesSql);
    })();
  };

  let currentVersion = getUserVersion();
  while (currentVersion < SCHEMA_VERSION) {
    if (currentVersion === 0) {
      await migrateFrom0To1();
      setUserVersion(1);
      currentVersion = 1;
      continue;
    }
    if (currentVersion === 1) {
      migrateFrom1To2();
      setUserVersion(2);
      currentVersion = 2;
      continue;
    }
    break;
  }
}

export {
  db,
  USERS_FIELDS,
  EVENTS_FIELDS,
  BOOKMARK_CATEGORIES_FIELDS,
  BOOKMARK_TAGS_FIELDS,
  BOOKMARKS_FIELDS,
  SESSIONS_FIELDS,
  DEMO_EMAIL,
  initDb,
  resetDemoData,
};
