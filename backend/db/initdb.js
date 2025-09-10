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

// const DUMMY_EVENTS = [
//   { start_at: '2024-05-01T00:00:00Z', is_yearly: 0, uid: 'h3j6q', type: 'other', user_id: 1, title: 'Всемирный день борьбы со СПИДом', description: 'Международный день, направленный на повышение осведомленности о ВИЧ/СПИДе и демонстрацию международной солидарности перед лицом пандемии.' },
//   { start_at: '2024-05-12T00:00:00Z', is_yearly: 0, uid: 'f1v7y', type: 'holiday', user_id: 1, title: 'День Конституции Российской Федерации', description: 'Государственный праздник, посвященный принятию Конституции РФ на всенародном голосовании 12 декабря 1993 года.' },
//   { start_at: '2024-06-31T00:00:00Z', is_yearly: 0, uid: 'b8n2z', type: 'holiday', user_id: 1, title: 'Новогодний праздник', description: 'Главный праздник года, отмечаемый в ночь с 31 декабря на 1 января. Время подведения итогов и загадывания желаний.' },
//   { start_at: '2025-08-07T00:00:00Z', is_yearly: 0, uid: 'e4c9m', type: 'holiday', user_id: 1, title: 'Рождество Христово', description: 'Один из главных христианских праздников, установленный в честь рождения Иисуса Христа в Вифлееме.' },
//   { start_at: '2025-08-23T00:00:00Z', is_yearly: 0, uid: 'a6d3k', type: 'holiday', user_id: 1, title: 'День защитника Отечества', description: 'Государственный праздник, посвященный вооруженным силам России. Традиционно считается мужским праздником.' },
//   { start_at: '2025-09-01T00:00:00Z', is_yearly: 0, uid: 's2g5l', type: 'holiday', user_id: 1, title: 'Международный женский день', description: 'Международный праздник, отмечаемый ежегодно 8 марта в ряде стран как день солидарности женщин в борьбе за равные права.' },
//   { start_at: '2025-09-02T00:00:00Z', is_yearly: 0, uid: 'u7i1x', type: 'other', user_id: 1, title: 'День космонавтики', description: 'Памятная дата, установленная в ознаменование первого полета человека в космос. 12 апреля 1961 года Юрий Гагарин совершил первый космический полет.' },
//   { start_at: '2025-09-03T00:00:00Z', is_yearly: 0, uid: 'w9o4p', type: 'holiday', user_id: 1, title: 'День Победы', description: 'Праздник победы Красной армии и советского народа над нацистской Германией в Великой Отечественной войне 1941-1945 годов.' },
//   { start_at: '2025-09-04T00:00:00Z', is_yearly: 0, uid: 'q6r8t', type: 'holiday', user_id: 1, title: 'День России', description: 'Государственный праздник Российской Федерации, отмечаемый ежегодно 12 июня. В этот день в 1990 году была принята Декларация о государственном суверенитете РСФСР.' },
//   { start_at: '2025-09-05T00:00:00Z', is_yearly: 0, uid: 'z3h2j', type: 'other', user_id: 1, title: 'День знаний', description: 'Праздник начала нового учебного года для школьников, студентов, учителей и преподавателей. Традиционно отмечается 1 сентября.' },
//   { start_at: '2025-09-05T00:00:00Z', is_yearly: 0, uid: 'l5k7n', type: 'other', user_id: 1, title: 'День учителя', description: 'Профессиональный праздник работников сферы образования. В России отмечается 5 октября, в день, когда в 1966 году была принята международная рекомендация о статусе учителей.' },
//   { start_at: '2025-09-06T00:00:00Z', is_yearly: 0, uid: 'm1v4b', type: 'holiday', user_id: 1, title: 'День народного единства', description: 'Государственный праздник, посвященный событиям 1612 года, когда народное ополчение под предводительством Минина и Пожарского освободило Москву от польских интервентов.' },
//   { start_at: '2025-10-03T00:00:00Z', is_yearly: 0, uid: 'x8c6f', type: 'other', user_id: 1, title: 'Международный день инвалидов', description: 'Международный день, направленный на привлечение внимания к проблемам инвалидов, защиту их достоинства, прав и благополучия.' },
//   { start_at: '2025-10-22T00:00:00Z', is_yearly: 0, uid: 'y2g9h', type: 'other', user_id: 1, title: 'День энергетика', description: 'Профессиональный праздник работников энергетической промышленности, отмечаемый в день зимнего солнцестояния.' },
//   { start_at: '2025-11-27T00:00:00Z', is_yearly: 0, uid: 'd7s3a', type: 'other', user_id: 1, title: 'День спасателя Российской Федерации', description: 'Профессиональный праздник сотрудников МЧС России, установленный в честь создания Российского корпуса спасателей в 1990 году.' },
//   { start_at: '2025-12-20T00:00:00Z', is_yearly: 0, uid: 'n4w1e', type: 'other', user_id: 1, title: 'Международный день солидарности людей', description: 'Международный день, провозглашенный Генеральной Ассамблеей ООН для укрепления солидарности между народами и государствами.' },
//   { start_at: '2025-12-21T00:00:00Z', is_yearly: 0, uid: 't6q8i', type: 'other', user_id: 1, title: 'День зимнего солнцестояния', description: 'Астрономическое явление, когда Солнце находится на самом большом угловом расстоянии от небесного экватора. Самый короткий день в году.' },
// ];

const DUMMY_EVENTS = [
  { start_at: '2024-05-02', is_yearly: 1, uid: 'h3j6q', type: 'holiday', user_id: 1, title: '1-1+', description: '' },
  { start_at: '2024-05-13', is_yearly: 1, uid: 'f1v7y', type: 'holiday', user_id: 1, title: '1-2+', description: '' },
  { start_at: '2024-06-02', is_yearly: 1, uid: 'b8n2z', type: 'holiday', user_id: 1, title: '2-1+', description: '' },
  { start_at: '2024-06-13', is_yearly: 1, uid: 'e4c9m', type: 'holiday', user_id: 1, title: '2-2+', description: '' },
  { start_at: '2025-07-13', is_yearly: 0, uid: 'a6d3k', type: 'holiday', user_id: 1, title: '3-1', description: '' },
  { start_at: '2025-07-14', is_yearly: 0, uid: 't6q8i', type: 'holiday', user_id: 1, title: '3-2', description: '' },
  { start_at: '2025-07-15', is_yearly: 0, uid: 'n4w1e', type: 'holiday', user_id: 1, title: '3-3', description: '' },
  { start_at: '2025-09-06', is_yearly: 1, uid: 'h3j6q31312312', type: 'holiday', user_id: 1, title: '4-1+', description: '' },
  { start_at: '2025-09-07', is_yearly: 0, uid: 'h3j6q313123', type: 'holiday', user_id: 1, title: '4-2', description: '' },
  { start_at: '2025-09-08', is_yearly: 0, uid: 'h3j6q31', type: 'holiday', user_id: 1, title: '4-3', description: '' },
  { start_at: '2024-09-09', is_yearly: 1, uid: 'h3j6q310', type: 'holiday', user_id: 1, title: '4-4+', description: '' },
  { start_at: '2024-09-09', is_yearly: 0, uid: 'h3j6q3101', type: 'holiday', user_id: 1, title: '4-5', description: '' },
  { start_at: '2025-09-10', is_yearly: 1, uid: 'h3j6q3', type: 'holiday', user_id: 1, title: '4-6+', description: '' },
  { start_at: '2025-09-10', is_yearly: 0, uid: 'h3j6q313', type: 'holiday', user_id: 1, title: '4-7', description: '' },
  { start_at: '2024-09-11', is_yearly: 1, uid: 'h3j6q312', type: 'holiday', user_id: 1, title: '4-8+', description: '' },
  { start_at: '2025-10-02', is_yearly: 0, uid: 'h3j6q4', type: 'holiday', user_id: 1, title: '5-1', description: '' },
  { start_at: '2025-10-13', is_yearly: 0, uid: 'h3j6q5', type: 'holiday', user_id: 1, title: '5-2', description: '' },
  { start_at: '2026-02-02', is_yearly: 0, uid: 'h3j6q6', type: 'holiday', user_id: 1, title: '6-1', description: '' },
  { start_at: '2026-05-03', is_yearly: 0, uid: 'h3j6q7', type: 'holiday', user_id: 1, title: '7-1', description: '' },
  { start_at: '2026-09-07', is_yearly: 1, uid: 'h3j6q38', type: 'holiday', user_id: 1, title: '8-1+', description: '' },
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
