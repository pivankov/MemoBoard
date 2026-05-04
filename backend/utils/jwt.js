/**
 * Утилиты для работы с JWT access-токенами.
 *
 * JWT (JSON Web Token) — стандарт аутентификации для SPA.
 * Access-токен создаётся при логине/ротации и передаётся с каждым запросом
 * в заголовке Authorization: Bearer <token>.
 * Живёт только в памяти на клиенте (не в localStorage) — защита от XSS.
 */

import jwt from 'jsonwebtoken';

/**
 * Минимальная допустимая длина JWT_SECRET в символах.
 *
 * 32 символа — практичный порог: этого достаточно, чтобы отсечь
 * заведомо слабые значения (короткие «test», «secret», «dev-key»),
 * при этом не создавая неудобств для разработчика. Сгенерированная
 * случайная строка (`crypto.randomBytes(32).toString('hex')` = 64 символа)
 * с запасом проходит проверку.
 */
const MIN_SECRET_LENGTH = 32;

const JWT_SECRET = process.env.JWT_SECRET;

// Новое имя переменной окружения. Старое JWT_EXPIRES_IN учитываем
// для обратной совместимости — но печатаем предупреждение.
const LEGACY_EXPIRES = process.env.JWT_EXPIRES_IN;
if (LEGACY_EXPIRES) {
  console.warn('JWT_EXPIRES_IN устарела, используйте ACCESS_TOKEN_EXPIRES_IN. Старое значение будет проигнорировано.');
}
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';

// Fail-fast: без валидного секрета сервер не должен стартовать.
// Проверка выполняется на этапе импорта модуля — падение произойдёт
// при старте приложения, а не при первом запросе пользователя.
if (!JWT_SECRET || typeof JWT_SECRET !== 'string' || JWT_SECRET.trim().length === 0) {
  throw new Error(
    'JWT_SECRET не задан. Укажите переменную окружения JWT_SECRET в backend/.env. ' +
    'Сгенерировать: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
  );
}

if (JWT_SECRET.length < MIN_SECRET_LENGTH) {
  throw new Error(
    `JWT_SECRET слишком короткий (${JWT_SECRET.length} символов). ` +
    `Минимальная длина — ${MIN_SECRET_LENGTH} символов. ` +
    'Сгенерировать новый: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
  );
}

/**
 * Создаёт короткоживущий access JWT-токен для пользователя.
 *
 * @param {Object} user - объект пользователя из БД
 * @param {number} user.id - внутренний ID пользователя
 * @param {string} user.uid - публичный UID пользователя
 * @param {string} user.email - email пользователя
 * @returns {string} подписанный JWT-токен
 */
export function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, uid: user.uid, email: user.email },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

/**
 * Проверяет и декодирует access JWT-токен.
 *
 * @param {string} token - JWT-токен для верификации
 * @returns {Object} декодированный payload токена
 * @throws {jwt.JsonWebTokenError} если токен невалидный
 * @throws {jwt.TokenExpiredError} если токен истёк
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
