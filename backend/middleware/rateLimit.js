/**
 * Rate-limiting middleware для защиты от брутфорса
 *
 * Ограничивает количество запросов с одного IP за промежуток времени.
 * Используется на чувствительных auth-маршрутах (login, register),
 * где перебор паролей или массовая регистрация могут быть вектором атаки.
 *
 * Почему только для login/register:
 * - `/auth/me` — требует валидный токен, брутфорсить нечего
 * - `/events`, `/bookmarks` — защищены requireAuth, тоже нечего перебирать
 *
 * Лимиты намеренно мягкие — чтобы не мешать легитимным пользователям
 * (например, несколько человек за одним NAT). При необходимости
 * ужесточаются через переменные окружения.
 */

import rateLimit from 'express-rate-limit';

/**
 * Лимитер для маршрутов аутентификации.
 *
 * По умолчанию: не более 10 запросов с одного IP за 15 минут.
 * Параметры настраиваются через env (AUTH_RATE_LIMIT_WINDOW_MS, AUTH_RATE_LIMIT_MAX).
 *
 * При превышении лимита возвращается 429 Too Many Requests.
 */
export const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Слишком много попыток. Попробуйте через несколько минут.',
  },
});

/**
 * Лимитер для POST /api/auth/refresh.
 *
 * По умолчанию: не более 120 запросов с одного IP в минуту.
 * Это с огромным запасом покрывает нормальные сценарии
 * (параллельные вкладки, всплески 401 после истечения access),
 * но срезает флуд от ботов и защищает от DoS на транзакции.
 *
 * Параметры настраиваются через env (REFRESH_RATE_LIMIT_WINDOW_MS, REFRESH_RATE_LIMIT_MAX).
 */
export const refreshLimiter = rateLimit({
  windowMs: Number(process.env.REFRESH_RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.REFRESH_RATE_LIMIT_MAX) || 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Слишком много запросов обновления токена. Повторите позже.',
  },
});
