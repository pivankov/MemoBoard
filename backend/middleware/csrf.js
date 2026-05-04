/**
 * Middleware CSRF-защиты по схеме double-submit cookie.
 *
 * Требует, чтобы клиент:
 * 1. Имел cookie csrf_token (мы её выставляем при login/register/refresh).
 * 2. Прислал её же значение в заголовке X-CSRF-Token.
 *
 * Если cookie или заголовок отсутствуют, или значения не совпадают — 403.
 *
 * Защищает только те endpoint-ы, где принимаются cookie-аутентифицированные
 * мутации. login/register CSRF не нужен: там нет cookie-auth (юзер не залогинен),
 * а успешный вход требует знания пароля.
 *
 * 🔴 Сравнение через timingSafeEqual, чтобы исключить timing-атаки
 * на подбор значения (хотя энтропия 256 бит делает подбор нереальным,
 * следуем best practice).
 */

import { timingSafeEqual } from 'crypto';

import { CSRF_COOKIE_NAME } from '../utils/cookieOptions.js';

const CSRF_HEADER_NAME = 'x-csrf-token';

function safeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function requireCsrf(req, res, next) {
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken || !safeEqualStr(cookieToken, headerToken)) {
    return res.status(403).json({ error: 'CSRF-токен отсутствует или неверен' });
  }

  return next();
}
