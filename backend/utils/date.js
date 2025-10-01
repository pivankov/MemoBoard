/**
 * Допустимые типы повторения событий
 * @const {Set<string>}
 */
const VALID_RECURRENCES = new Set(['none', 'monthly', 'yearly']);

/**
 * Регулярное выражение для валидации формата ISO даты (YYYY-MM-DD)
 * Группы захвата: [1] - год (4 цифры), [2] - месяц (2 цифры), [3] - день (2 цифры)
 * @const {RegExp}
 */
const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Нормализует входящую дату к ISO-строке с таймзоной (UTC)
 * @param {string} dateInput - Входная дата в различных форматах (ISO строка, дата с временем и т.д.)
 * @returns {string | null} ISO строка с таймзоной UTC (например, "2024-06-13T00:00:00Z") или null при ошибке
 * 
 * Возвращает null если:
 * - dateInput не является строкой
 * - dateInput пустая строка после trim()
 * - dateInput не может быть распарсена как валидная дата
 */
export function normalizeInputDate(dateInput) {
  if (typeof dateInput !== 'string') {
    return null
  };

  const trimmed = dateInput.trim();

  if (trimmed.length === 0) {
    return null
  };

  const onlyDateRegexp = /^\d{4}-\d{2}-\d{2}$/;

  if (onlyDateRegexp.test(trimmed)) {
    return `${trimmed}T00:00:00Z`;
  }

  const parsed = new Date(trimmed);
  
  if (isNaN(parsed.getTime())) {
    return null
  };

  return parsed.toISOString();
}

/**
 * Парсит ISO дату (YYYY-MM-DD) в объект с компонентами даты
 * @param {string} dateInput - Дата в формате ISO (например, "2024-06-13")
 * @returns {{year: number, month: number, day: number} | null} Объект с компонентами даты или null при ошибке
 */
function parseIsoDate(dateInput) {
  if (typeof dateInput !== 'string') {
    return null;
  }

  const match = ISO_DATE_REGEX.exec(dateInput);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

/**
 * Возвращает количество дней в указанном месяце
 * Учитывает високосные годы для февраля
 * @param {number} year - Год
 * @param {number} month - Месяц (1-12)
 * @returns {number} Последний день месяца (28-31)
 */
function getLastDayOfMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Форматирует компоненты даты в ISO строку (YYYY-MM-DD)
 * @param {number} year - Год
 * @param {number} month - Месяц (1-12)
 * @param {number} day - День (1-31)
 * @returns {string} Дата в формате ISO (например, "2024-06-13")
 */
function formatDateParts(year, month, day) {
  const paddedMonth = String(month).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');
  return `${year}-${paddedMonth}-${paddedDay}`;
}

/**
 * Сравнивает две ISO даты лексикографически
 * @param {string} left - Первая дата в формате ISO
 * @param {string} right - Вторая дата в формате ISO
 * @returns {number} Отрицательное число если left < right, 0 если равны, положительное если left > right
 */
function compareIsoDates(left, right) {
  return left.localeCompare(right);
}

/**
 * Вычисляет дату для ежемесячного повторения события
 * Учитывает разное количество дней в месяцах (28-31)
 * @param {{year: number, month: number, day: number}} baseParts - Компоненты базовой даты
 * @param {number} monthsToAdd - Количество месяцев для добавления
 * @returns {string} Дата следующего повторения в формате ISO
 */
function buildMonthlyDate(baseParts, monthsToAdd) {
  const totalMonths = (baseParts.month - 1) + monthsToAdd;
  const targetYear = baseParts.year + Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  const lastDay = getLastDayOfMonth(targetYear, targetMonth);
  const targetDay = Math.min(baseParts.day, lastDay);
  return formatDateParts(targetYear, targetMonth, targetDay);
}

/**
 * Вычисляет дату для ежегодного повторения события
 * Учитывает високосные годы (например, 29 февраля -> 28 февраля)
 * @param {{year: number, month: number, day: number}} baseParts - Компоненты базовой даты
 * @param {number} yearsToAdd - Количество лет для добавления
 * @returns {string} Дата следующего повторения в формате ISO
 */
function buildYearlyDate(baseParts, yearsToAdd) {
  const targetYear = baseParts.year + yearsToAdd;
  const lastDay = getLastDayOfMonth(targetYear, baseParts.month);
  const targetDay = Math.min(baseParts.day, lastDay);
  return formatDateParts(targetYear, baseParts.month, targetDay);
}

/**
 * Вычисляет дату следующего повторяющегося события
 * @param {string} originalDate - Дата создания события в формате ISO (YYYY-MM-DD)
 * @param {string} recurrence - Тип повторения: 'none' | 'monthly' | 'yearly'
 * @returns {string} Дата следующего повторения в формате ISO или пустая строка
 * 
 * Возвращает пустую строку ("") если:
 * - originalDate еще не наступил (событие в будущем)
 * - recurrence === 'none' (событие не повторяется)
 * - входные данные некорректны
 */
export function calculateNextDate(originalDate, recurrence) {
  if (!VALID_RECURRENCES.has(recurrence)) {
    return '';
  }

  const baseParts = parseIsoDate(originalDate);

  if (!baseParts) {
    return '';
  }

  if (recurrence === 'none') {
    return '';
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  if (compareIsoDates(originalDate, todayIso) > 0) {
    return '';
  }

  const todayParts = parseIsoDate(todayIso);

  if (!todayParts) {
    return '';
  }

  if (recurrence === 'monthly') {
    const monthsDiff = (todayParts.year - baseParts.year) * 12 + (todayParts.month - baseParts.month);
    let monthsToAdd = monthsDiff <= 0 ? 1 : monthsDiff;
    let candidate = buildMonthlyDate(baseParts, monthsToAdd);

    if (compareIsoDates(candidate, todayIso) <= 0) {
      monthsToAdd += 1;
      candidate = buildMonthlyDate(baseParts, monthsToAdd);
    }

    return candidate;
  }

  const yearsDiff = todayParts.year - baseParts.year;
  let yearsToAdd = yearsDiff <= 0 ? 1 : yearsDiff;
  let candidate = buildYearlyDate(baseParts, yearsToAdd);

  if (compareIsoDates(candidate, todayIso) <= 0) {
    yearsToAdd += 1;
    candidate = buildYearlyDate(baseParts, yearsToAdd);
  }

  return candidate;
}