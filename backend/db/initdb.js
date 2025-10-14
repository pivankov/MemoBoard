import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import argon2 from 'argon2';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database(path.join(__dirname, 'data.db'));

const SCHEMA_VERSION = 1;
const ARGON2_TIME_COST = 3;
const ARGON2_MEMORY_COST = 65536; // 2^16
const ARGON2_PARALLELISM = 1;
const ADMIN_EMAIL = 'admin@example.com';
const GUEST_EMAIL = 'guest@example.com';

const DUMMY_EVENTS = [
  { start_at: '2025-01-01', recurrence: 'yearly', uid: '1', type: 'holiday', user_id: 1, title: 'Новый год', description: 'Празднование начала нового календарного года.' },
  { start_at: '2025-01-07', recurrence: 'yearly', uid: '2', type: 'church', user_id: 1, title: 'Рождество Христово', description: '' },
  { start_at: '2025-01-14', recurrence: 'yearly', uid: '3', type: 'holiday', user_id: 1, title: 'Старый Новый год', description: '' },
  { start_at: '2025-01-25', recurrence: 'yearly', uid: '4', type: 'holiday', user_id: 1, title: 'Татьянин день', description: '' },
  { start_at: '2025-02-23', recurrence: 'yearly', uid: '5', type: 'holiday', user_id: 1, title: 'День защитника Отечества', description: '' },
  { start_at: '2025-03-08', recurrence: 'yearly', uid: '6', type: 'holiday', user_id: 1, title: 'Международный женский день', description: '' },
  { start_at: '2025-04-12', recurrence: 'yearly', uid: '7', type: 'holiday', user_id: 1, title: 'День космонавтики', description: '' },
  { start_at: '2025-05-01', recurrence: 'yearly', uid: '8', type: 'holiday', user_id: 1, title: 'Первомай', description: 'День солидарности трудящихся, выходящий из советских времен.' },
  { start_at: '2025-05-09', recurrence: 'yearly', uid: '9', type: 'holiday', user_id: 1, title: 'День Победы', description: '' },
  { start_at: '2025-06-12', recurrence: 'yearly', uid: '10', type: 'holiday', user_id: 1, title: 'День России', description: 'государственный праздник, отмечаемый в честь принятия декларации о суверенитете РСФСР.' },
  { start_at: '2025-09-01', recurrence: 'yearly', uid: '11', type: 'holiday', user_id: 1, title: 'День знаний', description: '' },
  { start_at: '2025-10-01', recurrence: 'yearly', uid: '12', type: 'holiday', user_id: 1, title: 'День пожилого человека', description: '' },
  { start_at: '2025-10-05', recurrence: 'yearly', uid: '13', type: 'holiday', user_id: 1, title: 'День учителя', description: '' },
  { start_at: '2025-10-14', recurrence: 'yearly', uid: '14', type: 'church', user_id: 1, title: 'Покрова', description: 'Покро́в день — день в народном календаре восточных славян, приходящийся на 1 октября. В народной традиции этот день отмечал встречу осени с зимой, начало вечерних девичьих посиделок и осеннего свадебного сезона.' },
  { start_at: '2025-11-04', recurrence: 'yearly', uid: '15', type: 'holiday', user_id: 1, title: 'День народного единства', description: '' },
  { start_at: '2025-12-12', recurrence: 'yearly', uid: '16', type: 'holiday', user_id: 1, title: 'День Конституции РФ', description: '' },
  { start_at: '1982-03-02', recurrence: 'yearly', uid: '17', type: 'birthday', user_id: 1, title: 'День рождения Ильи', description: '' },
  { start_at: '2013-05-29', recurrence: 'none', uid: '18', type: 'other', user_id: 1, title: 'React дата первого релиза', description: 'React впервые был выпущен 29 мая 2013 года как проект с открытым исходным кодом на GitHub, разработанный Джорданом Уоком из Facebook. ' },
];

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

function getUserVersion() {
  return db.pragma('user_version', { simple: true });
}

function setUserVersion(version) {
  db.pragma(`user_version = ${version}`);
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

  const dropObsoleteIndexesSql = `
    DROP INDEX IF EXISTS idx_users_email;
  `;

  const createIndexesSql = `
    CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_user_start_at ON events(user_id, start_at);
    CREATE INDEX IF NOT EXISTS idx_events_user_type ON events(user_id, type_id);
  `;

  const createAll = db.transaction(() => {
    db.exec(createUsersSql);
    db.exec(createEventTypesSql);
    db.exec(createEventsSql);
    db.exec(dropObsoleteIndexesSql);
    db.exec(createIndexesSql);
    db.exec(createUsersUpdatedAtTrigger);
    db.exec(createEventsUpdatedAtTrigger);
  });

  const migrateFrom0To1 = async () => {
    createAll();

    if (seed) {
      const insertUser = db.prepare('INSERT INTO users (uid, email, name, password_hash, password_algo) VALUES (@uid, @email, @name, @password_hash, @password_algo)');
      const insertEventType = db.prepare('INSERT OR IGNORE INTO event_types (title, slug) VALUES (@title, @slug)');
      const adminPassword = 'admin';
      const guestPassword = 'guest';
      const [adminHash, guestHash] = await Promise.all([
        argon2.hash(adminPassword, { type: argon2.argon2id, timeCost: ARGON2_TIME_COST, memoryCost: ARGON2_MEMORY_COST, parallelism: ARGON2_PARALLELISM }),
        argon2.hash(guestPassword, { type: argon2.argon2id, timeCost: ARGON2_TIME_COST, memoryCost: ARGON2_MEMORY_COST, parallelism: ARGON2_PARALLELISM })
      ]);

      const seedUsers = db.transaction(() => {
        insertUser.run({ uid: randomUUID(), email: ADMIN_EMAIL, name: 'admin', password_hash: adminHash, password_algo: 'argon2id' });
        insertUser.run({ uid: randomUUID(), email: GUEST_EMAIL, name: 'guest', password_hash: guestHash, password_algo: 'argon2id' });
      });

      seedUsers();

      const seedEventTypes = db.transaction(() => {
        insertEventType.run({ title: 'Другое', slug: 'other' });
        insertEventType.run({ title: 'Праздник', slug: 'holiday' });
        insertEventType.run({ title: 'День рождения', slug: 'birthday' });
        insertEventType.run({ title: 'Церковный праздник', slug: 'church' });
      });

      seedEventTypes();

      const insertEvent = db.prepare(`
        INSERT INTO events (uid, user_id, title, type_id, start_at, description, recurrence)
        VALUES (@uid, @user_id, @title, @type_id, @start_at, @description, @recurrence)
      `);
      const typeRows = db.prepare('SELECT id, slug FROM event_types').all();
      const slugToId = Object.fromEntries(typeRows.map(r => [r.slug, r.id]));
      const adminRow = db.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').get(ADMIN_EMAIL);
      const adminId = adminRow?.id;
      if (adminId) {
        const eventsPrepared = DUMMY_EVENTS.map(e => ({
          uid: e.uid,
          user_id: adminId,
          title: e.title,
          type_id: slugToId[e.type],
          start_at: e.start_at,
          description: e.description,
          recurrence: e.recurrence ?? 'none',
        }));
        
        const seedEvents = db.transaction(() => {
          for (const ev of eventsPrepared) insertEvent.run(ev);
        });

        seedEvents();
      }
    }
  };

  let currentVersion = getUserVersion();
  while (currentVersion < SCHEMA_VERSION) {
    if (currentVersion === 0) {
      await migrateFrom0To1();
      setUserVersion(1);
      currentVersion = 1;
      continue;
    }
    break;
  }
}

export { db, USERS_FIELDS, EVENTS_FIELDS, initDb };
