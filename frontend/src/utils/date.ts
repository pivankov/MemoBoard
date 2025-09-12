const MS_IN_DAY = 24 * 60 * 60 * 1000;

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
 * Проверяет, находится ли дата в окне прошедших дней [fromDays, toDays] относительно today.
 * Использует разницу в полных календарных днях, игнорируя время суток.
 * @param dateToCheck Дата события (может быть предварительно нормализована)
 * @param today Точка отсчёта «сегодня»
 * @param fromDays Нижняя граница окна в днях (включительно). По умолчанию 1
 * @param toDays Верхняя граница окна в днях (включительно). По умолчанию 7
 * @returns true, если разница в днях попадает в включительный интервал
 */
export const isInPastWindow = (
  dateToCheck: Date,
  today: Date,
  fromDays: number = 1,
  toDays: number = 7,
): boolean => {
  const days = diffInCalendarDays(dateToCheck, today);

  return days >= fromDays && days <= toDays;
};
