const MS_IN_DAY = 24 * 60 * 60 * 1000;

/**
 * Допустимые типы повторения событий
 */
const VALID_RECURRENCES = new Set<string>(['none', 'monthly', 'yearly']);

/**
 * Регулярное выражение для валидации формата ISO даты (YYYY-MM-DD)
 * Группы захвата: [1] - год (4 цифры), [2] - месяц (2 цифры), [3] - день (2 цифры)
 */
const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Компоненты даты
 */
export interface DateParts {
  year: number;
  month: number;
  day: number;
}

/**
 * Проверяет, совпадают ли две даты по календарному дню (год, месяц, день).
 * @param a Первая дата
 * @param b Вторая дата
 * @returns true, если год/месяц/день совпадают; иначе false
 */
export const isSameCalendarDay = (a: Date, b: Date): boolean => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

/**
 * Форматтер даты по-русски в компактном виде: «день месяц год» (например, «5 янв. 2026 г.»).
 */
export const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/**
 * Форматирует объект Date в строку в формате YYYY-MM-DD.
 * @param date Объект даты
 * @returns Строка даты в формате YYYY-MM-DD
 */
export const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Форматирует строку даты в человеко-читаемый вид, используя dateFormatter.
 * Если дата невалидна — возвращает пустую строку.
 * @param dateInput Строковое представление даты
 * @returns Отформатированная дата или пустая строка
 */
export const formatDateString = (dateInput: string): string => {
  const parsed = new Date(dateInput);

  if (isNaN(parsed.getTime())) {
    return ""
  };
  
  return dateFormatter.format(parsed);
};

/**
 * Форматтер для названий месяцев по-русски (например, "январь").
 */
export const ruMonthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long' });


/**
 * Безопасно парсит строку даты в объект Date.
 * Возвращает null, если строка пустая/невалидная, чтобы избежать исключений и дополнительных проверок.
 * @param dateString Строковое представление даты
 * @returns Объект Date или null, если дата невалидна
 */
export const parseDateSafe = (dateString: string): Date | null => {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);

  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Возвращает разницу в полных календарных днях между двумя датами, игнорируя время суток (считаются только год/месяц/день).
 * @param from Начальная дата
 * @param to Конечная дата
 * @returns Количество полных календарных дней между датами
 */
export const diffInCalendarDays = (from: Date, to: Date): number => {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();

  return Math.floor((end - start) / MS_IN_DAY);
}

/**
 * Проверяет, попадает ли дата в окно прошедших дней относительно указанной «сегодняшней» даты.
 * @param dateToCheck Дата, которую проверяем
 * @param today Опорная дата (обычно текущий день)
 * @param fromDays Нижняя граница окна (в днях)
 * @param toDays Верхняя граница окна (в днях)
 * @returns true, если дата находится в интервале [fromDays, toDays] дней назад
 */
export const isInPastWindow = (
  dateToCheck: Date,
  today: Date,
  fromDays: number = 1,
  toDays: number = 7
): boolean => {
  const daysAgo = diffInCalendarDays(dateToCheck, today);

  return daysAgo > 0 && daysAgo >= fromDays && daysAgo <= toDays;
};

/**
 * Возвращает календарный год из объекта Date.
 * @param date Объект даты
 * @returns Числовой год, например 2025
 */
export const getYear = (date: Date): number => {
  return date.getFullYear();
};

/**
 * Возвращает номер месяца в человеко-читаемом формате (1-12).
 * В отличие от Date.getMonth(), который отдаёт 0-11.
 * @param date Объект даты
 * @returns Номер месяца от 1 до 12
 */
export const getMonth = (date: Date): number => {
  return date.getMonth() + 1;
};

/**
 * Возвращает день месяца (1-31) из объекта Date.
 * @param date Объект даты
 * @returns Номер дня месяца от 1 до 31
 */
export const getDay = (date: Date): number => {
  return date.getDate();
};

/**
 * Возвращает количество дней в указанном месяце с учетом високосных годов
 * @param year Год (например, 2025)
 * @param monthIndex Индекс месяца (0-11): 0 = январь, 11 = декабрь
 * @returns Количество дней в месяце (28-31)
 */
export const getDaysInMonth = (year: number, monthIndex: number): number => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

/**
 * Парсит ISO дату (YYYY-MM-DD) в объект с компонентами даты
 * @param dateInput - Дата в формате ISO (например, "2024-06-13")
 * @returns Объект с компонентами даты или null при ошибке
 */
export const parseIsoDate = (dateInput: string): DateParts | null => {
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
};

/**
 * Сравнивает две ISO даты лексикографически
 * @param left - Первая дата в формате ISO
 * @param right - Вторая дата в формате ISO
 * @returns Отрицательное число если left < right, 0 если равны, положительное если left > right
 */
export const compareIsoDates = (left: string, right: string): number => {
  return left.localeCompare(right);
};

/**
 * Вычисляет дату для ежемесячного повторения события
 * Учитывает разное количество дней в месяцах (28-31)
 * @param baseParts - Компоненты базовой даты
 * @param monthsToAdd - Количество месяцев для добавления
 * @returns Дата следующего повторения в формате ISO
 */
export const buildMonthlyDate = (baseParts: DateParts, monthsToAdd: number): string => {
  const totalMonths = (baseParts.month - 1) + monthsToAdd;
  const targetYear = baseParts.year + Math.floor(totalMonths / 12);
  const targetMonth = totalMonths % 12;
  const lastDay = getDaysInMonth(targetYear, targetMonth);
  const targetDay = Math.min(baseParts.day, lastDay);
  const date = new Date(targetYear, targetMonth, targetDay);

  return formatDateToString(date);
};

/**
 * Вычисляет дату для ежегодного повторения события
 * Учитывает високосные годы (например, 29 февраля -> 28 февраля)
 * @param baseParts - Компоненты базовой даты
 * @param yearsToAdd - Количество лет для добавления
 * @returns Дата следующего повторения в формате ISO
 */
export const buildYearlyDate = (baseParts: DateParts, yearsToAdd: number): string => {
  const targetYear = baseParts.year + yearsToAdd;
  const lastDay = getDaysInMonth(targetYear, baseParts.month - 1);
  const targetDay = Math.min(baseParts.day, lastDay);
  const date = new Date(targetYear, baseParts.month - 1, targetDay);

  return formatDateToString(date);
};

/**
 * Вычисляет дату следующего повторяющегося события
 * @param originalDate - Дата создания события в формате ISO (YYYY-MM-DD)
 * @param recurrence - Тип повторения: 'none' | 'monthly' | 'yearly'
 * @returns Дата следующего повторения в формате ISO или пустая строка
 * 
 * Возвращает пустую строку ("") если:
 * - originalDate еще не наступил (событие в будущем)
 * - recurrence === 'none' (событие не повторяется)
 * - входные данные некорректны
 */
export const calculateNextDate = (originalDate: string, recurrence: string): string => {
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
};