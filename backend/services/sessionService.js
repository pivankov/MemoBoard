/**
 * Сервис управления refresh-сессиями.
 *
 * Все операции с таблицей sessions проходят через этот модуль —
 * в роутах не должно быть прямых SQL-запросов к sessions.
 *
 * Ключевая концепция: FAMILY (семейство сессий).
 * Каждый логин создаёт новое семейство (family_id = UUID).
 * Каждая успешная ротация создаёт новую сессию в том же семействе.
 * Если предъявлен refresh-токен, который уже был отротирован
 * (revoked_at IS NOT NULL AND replaced_by_id IS NOT NULL) —
 * это признак кражи, всё семейство аннулируется.
 */

import { randomUUID } from 'crypto';

import { db } from '../db/initdb.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  computeRefreshExpiresAt,
} from '../utils/refreshToken.js';

/**
 * @typedef {Object} SessionRow
 * @property {number} id
 * @property {string} uid
 * @property {number} user_id
 * @property {string} family_id
 * @property {string} token_hash
 * @property {string} expires_at
 * @property {string | null} revoked_at
 * @property {number | null} replaced_by_id
 * @property {string | null} user_agent
 * @property {string | null} ip_address
 * @property {string} created_at
 * @property {string} last_used_at
 */

/**
 * @typedef {Object} CreateSessionParams
 * @property {number} userId
 * @property {string} [familyId] - Если не передан, создаётся новый (новый логин). Если передан — ротация.
 * @property {string} [userAgent]
 * @property {string} [ipAddress]
 */

/**
 * @typedef {Object} CreatedSession
 * @property {string} refreshToken - Raw-токен. Вернуть клиенту ОДИН РАЗ, больше нигде не хранится.
 * @property {SessionRow} session - Строка БД.
 */

/**
 * Создаёт новую сессию: генерирует refresh-токен, сохраняет его хеш в БД.
 *
 * Используется:
 * - При логине / регистрации (новый family_id).
 * - При ротации внутри rotateSession (существующий family_id).
 *
 * @param {CreateSessionParams} params
 * @returns {CreatedSession}
 */
export function createSession({ userId, familyId, userAgent, ipAddress }) {
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = computeRefreshExpiresAt();
  const uid = randomUUID();
  const resolvedFamilyId = familyId ?? randomUUID();

  const result = db.prepare(`
    INSERT INTO sessions (uid, user_id, family_id, token_hash, expires_at, user_agent, ip_address)
    VALUES (@uid, @user_id, @family_id, @token_hash, @expires_at, @user_agent, @ip_address)
  `).run({
    uid,
    user_id: userId,
    family_id: resolvedFamilyId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    user_agent: userAgent ?? null,
    ip_address: ipAddress ?? null,
  });

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid);
  return { refreshToken, session };
}

/**
 * Результат попытки ротации refresh-токена.
 *
 * @typedef {Object} RotationResult
 * @property {'ok'} status - Ротация успешна, клиент получает новую пару токенов.
 * @property {string} refreshToken - Новый raw refresh-токен.
 * @property {SessionRow} oldSession - Старая (уже отозванная) сессия.
 * @property {SessionRow} newSession - Новая активная сессия.
 *
 * @typedef {Object} RotationReuseResult
 * @property {'reuse_detected'} status - Обнаружено повторное использование, всё семейство отозвано.
 * @property {number} userId - Кого разлогинивать.
 *
 * @typedef {Object} RotationFailResult
 * @property {'not_found' | 'expired' | 'revoked'} status - Токен отсутствует/истёк/уже отозван (но без повторного использования).
 */

/**
 * 🔴 SECURITY-CRITICAL
 *
 * Выполняет ротацию refresh-токена с обнаружением повторного использования.
 *
 * Алгоритм (строго в транзакции):
 * 1. Хешируем предъявленный токен, ищем сессию по token_hash.
 * 2. Если не найдена → { status: 'not_found' }.
 * 3. Если expires_at < now → { status: 'expired' }.
 * 4. Если revoked_at IS NOT NULL:
 *    a. Если replaced_by_id IS NOT NULL → REUSE DETECTED:
 *       помечаем ВСЁ семейство (family_id) как отозванное, возвращаем { status: 'reuse_detected', userId }.
 *    b. Иначе (просто отозвана, например logout) → { status: 'revoked' }.
 * 5. Иначе — создаём новую сессию в том же family_id, старую помечаем revoked_at=now, replaced_by_id=new.id.
 *    Обновляем last_used_at старой сессии (для аналитики в UI «Мои устройства»).
 *
 * Вся логика — в одной db.transaction(), чтобы избежать гонок.
 *
 * @param {string} rawRefreshToken - Raw-токен, предъявленный клиентом
 * @param {{ userAgent?: string, ipAddress?: string }} meta
 * @returns {RotationResult | RotationReuseResult | RotationFailResult}
 */
export function rotateSession(rawRefreshToken, meta = {}) {
  const tokenHash = hashRefreshToken(rawRefreshToken);

  return db.transaction(() => {
    const session = db.prepare('SELECT * FROM sessions WHERE token_hash = ?').get(tokenHash);

    if (!session) {
      return { status: 'not_found' };
    }

    const now = new Date();
    const expiresAt = new Date(session.expires_at);

    if (expiresAt.getTime() < now.getTime()) {
      return { status: 'expired' };
    }

    if (session.revoked_at) {
      if (session.replaced_by_id) {
        // REUSE DETECTED: этот токен УЖЕ был использован для ротации.
        // Кто-то предъявил его снова → значит, у атакующего была копия.
        // Аннулируем всё семейство.
        db.prepare(`
          UPDATE sessions
          SET revoked_at = datetime('now')
          WHERE family_id = ? AND revoked_at IS NULL
        `).run(session.family_id);
        return { status: 'reuse_detected', userId: session.user_id };
      }
      return { status: 'revoked' };
    }

    // Ротация
    const { refreshToken: newRefreshToken, session: newSession } = createSession({
      userId: session.user_id,
      familyId: session.family_id,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });

    db.prepare(`
      UPDATE sessions
      SET revoked_at = datetime('now'),
          replaced_by_id = ?,
          last_used_at = datetime('now')
      WHERE id = ?
    `).run(newSession.id, session.id);

    const oldSession = db.prepare('SELECT * FROM sessions WHERE id = ?').get(session.id);

    return {
      status: 'ok',
      refreshToken: newRefreshToken,
      oldSession,
      newSession,
    };
  })();
}

/**
 * Отзывает сессию по raw-токену (используется при logout).
 * Отзывает ТОЛЬКО эту сессию, не всё семейство.
 *
 * @param {string} rawRefreshToken
 * @returns {boolean} true если сессия была найдена и отозвана, false если нет
 */
export function revokeSessionByToken(rawRefreshToken) {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const result = db.prepare(`
    UPDATE sessions
    SET revoked_at = datetime('now')
    WHERE token_hash = ? AND revoked_at IS NULL
  `).run(tokenHash);
  return result.changes > 0;
}
