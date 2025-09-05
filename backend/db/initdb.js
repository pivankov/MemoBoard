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
  { uid: 'h3j6q', user_id: 1, title: 'Всемирный день борьбы со СПИДом', type: 'other', start_at: '2024-12-01T00:00:00Z', description: 'Международный день, направленный на повышение осведомленности о ВИЧ/СПИДе и демонстрацию международной солидарности перед лицом пандемии.', is_yearly: 0 },
  { uid: 'f1v7y', user_id: 1, title: 'День Конституции Российской Федерации', type: 'holiday', start_at: '2024-12-12T00:00:00Z', description: 'Государственный праздник, посвященный принятию Конституции РФ на всенародном голосовании 12 декабря 1993 года.', is_yearly: 0 },
  { uid: 'b8n2z', user_id: 1, title: 'Новогодний праздник', type: 'holiday', start_at: '2024-12-31T00:00:00Z', description: 'Главный праздник года, отмечаемый в ночь с 31 декабря на 1 января. Время подведения итогов и загадывания желаний.', is_yearly: 0 },
  { uid: 'e4c9m', user_id: 1, title: 'Рождество Христово', type: 'holiday', start_at: '2025-01-07T00:00:00Z', description: 'Один из главных христианских праздников, установленный в честь рождения Иисуса Христа в Вифлееме.', is_yearly: 0 },
  { uid: 'a6d3k', user_id: 1, title: 'День защитника Отечества', type: 'holiday', start_at: '2025-02-23T00:00:00Z', description: 'Государственный праздник, посвященный вооруженным силам России. Традиционно считается мужским праздником.', is_yearly: 0 },
  { uid: 's2g5l', user_id: 1, title: 'Международный женский день', type: 'holiday', start_at: '2025-03-08T00:00:00Z', description: 'Международный праздник, отмечаемый ежегодно 8 марта в ряде стран как день солидарности женщин в борьбе за равные права.', is_yearly: 0 },
  { uid: 'u7i1x', user_id: 1, title: 'День космонавтики', type: 'other', start_at: '2025-04-12T00:00:00Z', description: 'Памятная дата, установленная в ознаменование первого полета человека в космос. 12 апреля 1961 года Юрий Гагарин совершил первый космический полет.', is_yearly: 0 },
  { uid: 'w9o4p', user_id: 1, title: 'День Победы', type: 'holiday', start_at: '2025-05-09T00:00:00Z', description: 'Праздник победы Красной армии и советского народа над нацистской Германией в Великой Отечественной войне 1941-1945 годов.', is_yearly: 0 },
  { uid: 'q6r8t', user_id: 1, title: 'День России', type: 'holiday', start_at: '2025-06-12T00:00:00Z', description: 'Государственный праздник Российской Федерации, отмечаемый ежегодно 12 июня. В этот день в 1990 году была принята Декларация о государственном суверенитете РСФСР.', is_yearly: 0 },
  { uid: 'z3h2j', user_id: 1, title: 'День знаний', type: 'other', start_at: '2025-09-01T00:00:00Z', description: 'Праздник начала нового учебного года для школьников, студентов, учителей и преподавателей. Традиционно отмечается 1 сентября.', is_yearly: 0 },
  { uid: 'l5k7n', user_id: 1, title: 'День учителя', type: 'other', start_at: '2025-10-05T00:00:00Z', description: 'Профессиональный праздник работников сферы образования. В России отмечается 5 октября, в день, когда в 1966 году была принята международная рекомендация о статусе учителей.', is_yearly: 0 },
  { uid: 'm1v4b', user_id: 1, title: 'День народного единства', type: 'holiday', start_at: '2025-11-04T00:00:00Z', description: 'Государственный праздник, посвященный событиям 1612 года, когда народное ополчение под предводительством Минина и Пожарского освободило Москву от польских интервентов.', is_yearly: 0 },
  { uid: 'x8c6f', user_id: 1, title: 'Международный день инвалидов', type: 'other', start_at: '2025-12-03T00:00:00Z', description: 'Международный день, направленный на привлечение внимания к проблемам инвалидов, защиту их достоинства, прав и благополучия.', is_yearly: 0 },
  { uid: 'y2g9h', user_id: 1, title: 'День энергетика', type: 'other', start_at: '2025-12-22T00:00:00Z', description: 'Профессиональный праздник работников энергетической промышленности, отмечаемый в день зимнего солнцестояния.', is_yearly: 0 },
  { uid: 'd7s3a', user_id: 1, title: 'День спасателя Российской Федерации', type: 'other', start_at: '2025-12-27T00:00:00Z', description: 'Профессиональный праздник сотрудников МЧС России, установленный в честь создания Российского корпуса спасателей в 1990 году.', is_yearly: 0 },
  { uid: 'n4w1e', user_id: 1, title: 'Международный день солидарности людей', type: 'other', start_at: '2025-12-20T00:00:00Z', description: 'Международный день, провозглашенный Генеральной Ассамблеей ООН для укрепления солидарности между народами и государствами.', is_yearly: 0 },
  { uid: 't6q8i', user_id: 1, title: 'День зимнего солнцестояния', type: 'other', start_at: '2025-12-21T00:00:00Z', description: 'Астрономическое явление, когда Солнце находится на самом большом угловом расстоянии от небесного экватора. Самый короткий день в году.', is_yearly: 0 },
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
   is_yearly: 'INTEGER NOT NULL DEFAULT 0 CHECK (is_yearly IN (0,1))',
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
      is_yearly ${EVENTS_FIELDS.is_yearly},
      created_at ${EVENTS_FIELDS.created_at},
      updated_at ${EVENTS_FIELDS.updated_at},
      UNIQUE (user_id, uid)
    );
  `;

  const createEventsUpdatedAtTrigger = `
    CREATE TRIGGER IF NOT EXISTS events_set_updated_at
    AFTER UPDATE OF uid, user_id, title, type_id, start_at, description, is_yearly, created_at ON events
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
      });

      seedEventTypes();

      const insertEvent = db.prepare(`
        INSERT INTO events (uid, user_id, title, type_id, start_at, description, is_yearly)
        VALUES (@uid, @user_id, @title, @type_id, @start_at, @description, @is_yearly)
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
          is_yearly: e.is_yearly,
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
