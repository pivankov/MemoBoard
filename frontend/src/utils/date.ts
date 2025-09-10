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
  if (!dateString) return null;
  const d = new Date(dateString);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Проверяет, просрочена ли дата относительно текущего момента.
 * Просроченность определяется как разница времени now - date >= overdueDays в миллисекундах.
 * @param date Дата события
 * @param overdueDays Количество дней, по истечении которых событие считается просроченным
 */
export const isOverdue = (date: Date, overdueDays: number): boolean => {
  const MS_IN_DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const eventTime = date.getTime();
  const overdueMs = overdueDays * MS_IN_DAY;
  
  return now - eventTime >= overdueMs;
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


