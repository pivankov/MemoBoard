import type { Event } from "types/events";
import type { Recurrence } from "types/events";
import { eventType } from "enums/events";

/**
 * Создает тестовое событие с заданными параметрами
 */
export const createEvent = (
  id: string,
  originalDate: string,
  recurrence: Recurrence,
  title?: string
): Event => {
  return {
    id,
    title: title || `Test Event ${id}`,
    originalDate,
    nextDate: originalDate,
    type: eventType.OTHER,
    recurrence,
    description: ''
  };
};

/**
 * Форматирует дату в строку YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Создает дату относительно базовой даты
 */
export const createRelativeDate = (baseDate: Date, offsetDays: number): Date => {
  const result = new Date(baseDate);
  result.setDate(result.getDate() + offsetDays);
  return result;
};

/**
 * Генерирует события для тестирования критической проверки
 * (будущие monthly/yearly события не должны попадать в past)
 */
export const generateFutureOriginalDateEvents = (today: Date): Event[] => {
  const futureYear = today.getFullYear() + 1;
  
  return [
    // Monthly событие с originalDate в будущем
    createEvent('future-monthly-1', `${futureYear}-01-02`, 'monthly', 'Будущее monthly'),
    
    // Yearly событие с originalDate в будущем
    createEvent('future-yearly-1', `${futureYear}-05-15`, 'yearly', 'Будущее yearly'),
    
    // Monthly событие с originalDate через несколько месяцев
    createEvent(
      'future-monthly-2',
      formatDate(createRelativeDate(today, 90)),
      'monthly',
      'Будущее monthly +90 дней'
    ),
  ];
};

/**
 * Генерирует события для тестирования границ past окна (1-7 дней)
 */
export const generatePastWindowBoundaryEvents = (today: Date): Event[] => {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  
  return [
    // Ровно 1 день назад (должно попасть в past)
    createEvent(
      'past-1day',
      formatDate(createRelativeDate(today, -1)),
      'yearly',
      'Событие 1 день назад'
    ),
    
    // 5 дней назад (в середине окна)
    createEvent(
      'past-5days',
      formatDate(createRelativeDate(today, -5)),
      'yearly',
      'Событие 5 дней назад'
    ),
    
    // Ровно 7 дней назад (граница окна, должно попасть)
    createEvent(
      'past-7days',
      formatDate(createRelativeDate(today, -7)),
      'yearly',
      'Событие 7 дней назад'
    ),
    
    // 8 дней назад (за границей, не должно попасть)
    createEvent(
      'past-8days',
      formatDate(createRelativeDate(today, -8)),
      'yearly',
      'Событие 8 дней назад'
    ),
    
    // Сегодня (не должно попасть в past)
    createEvent(
      'past-today',
      formatDate(today),
      'yearly',
      'Событие сегодня'
    ),
  ];
};

/**
 * Генерирует события для тестирования границ overdue (≥1 день)
 */
export const generateOverdueBoundaryEvents = (today: Date): Event[] => {
  return [
    // 2 дня назад (должно быть overdue)
    createEvent(
      'overdue-2days',
      formatDate(createRelativeDate(today, -2)),
      'none',
      'Просроченное 2 дня'
    ),
    
    // Ровно 1 день назад (граница, должно быть overdue)
    createEvent(
      'overdue-1day',
      formatDate(createRelativeDate(today, -1)),
      'none',
      'Просроченное 1 день'
    ),
    
    // Сегодня (не overdue)
    createEvent(
      'overdue-today',
      formatDate(today),
      'none',
      'Событие сегодня'
    ),
    
    // Завтра (не overdue)
    createEvent(
      'overdue-tomorrow',
      formatDate(createRelativeDate(today, 1)),
      'none',
      'Событие завтра'
    ),
  ];
};

/**
 * Генерирует события для тестирования нормализации дня месяца
 * (31 января → 28/29/30 в других месяцах)
 */
export const generateDayNormalizationEvents = (year: number): Event[] => {
  return [
    // 31 января (тест для февраля)
    createEvent(
      'normalize-31jan',
      `${year}-01-31`,
      'monthly',
      'Событие 31 января'
    ),
    
    // 30 марта (тест для апреля)
    createEvent(
      'normalize-30mar',
      `${year}-03-30`,
      'monthly',
      'Событие 30 марта'
    ),
    
    // 31 мая (тест для июня)
    createEvent(
      'normalize-31may',
      `${year}-05-31`,
      'monthly',
      'Событие 31 мая'
    ),
  ];
};

/**
 * Генерирует события для тестирования перехода года
 */
export const generateYearTransitionEvents = (year: number): Event[] => {
  return [
    // Monthly событие в октябре (пройдет через декабрь → январь)
    createEvent(
      'transition-monthly-oct',
      `${year}-10-15`,
      'monthly',
      'Monthly октябрь'
    ),
    
    // Yearly событие 31 декабря
    createEvent(
      'transition-yearly-dec',
      `${year - 1}-12-31`,
      'yearly',
      'Yearly 31 декабря'
    ),
    
    // Yearly событие 1 января
    createEvent(
      'transition-yearly-jan',
      `${year - 1}-01-01`,
      'yearly',
      'Yearly 1 января'
    ),
  ];
};

/**
 * Генерирует события для тестирования високосного года
 */
export const generateLeapYearEvents = (): Event[] => {
  return [
    // 29 февраля високосного года (yearly)
    createEvent(
      'leap-29feb-yearly',
      '2024-02-29',
      'yearly',
      'День рождения 29 февраля'
    ),
    
    // 29 февраля високосного года (monthly)
    createEvent(
      'leap-29feb-monthly',
      '2024-02-29',
      'monthly',
      'Monthly 29 февраля'
    ),
    
    // 28 февраля (контрольное)
    createEvent(
      'leap-28feb-yearly',
      '2024-02-28',
      'yearly',
      'День рождения 28 февраля'
    ),
  ];
};

/**
 * Генерирует базовый набор событий для общего тестирования
 */
export const generateBasicEvents = (today: Date): Event[] => {
  const currentYear = today.getFullYear();
  
  return [
    // None: будущее событие
    createEvent(
      'basic-none-future',
      formatDate(createRelativeDate(today, 30)),
      'none',
      'Конференция через месяц'
    ),
    
    // Yearly: уже прошло в этом году
    createEvent(
      'basic-yearly-past',
      `${currentYear - 5}-05-20`,
      'yearly',
      'День рождения в мае'
    ),
    
    // Yearly: еще не наступило в этом году
    createEvent(
      'basic-yearly-future',
      `${currentYear - 5}-12-25`,
      'yearly',
      'Новый год'
    ),
    
    // Monthly: уже прошло в текущем месяце
    createEvent(
      'basic-monthly-past',
      `${currentYear}-01-05`,
      'monthly',
      'Оплата 5 числа'
    ),
    
    // Monthly: еще не наступило в текущем месяце
    createEvent(
      'basic-monthly-future',
      `${currentYear}-01-25`,
      'monthly',
      'Зарплата 25 числа'
    ),
  ];
};

/**
 * Генерирует все события для комплексного тестирования
 */
export const generateAllTestEvents = (today: Date): {
  futureOriginalDate: Event[];
  pastWindowBoundary: Event[];
  overdueBoundary: Event[];
  dayNormalization: Event[];
  yearTransition: Event[];
  leapYear: Event[];
  basic: Event[];
} => {
  return {
    futureOriginalDate: generateFutureOriginalDateEvents(today),
    pastWindowBoundary: generatePastWindowBoundaryEvents(today),
    overdueBoundary: generateOverdueBoundaryEvents(today),
    dayNormalization: generateDayNormalizationEvents(today.getFullYear()),
    yearTransition: generateYearTransitionEvents(today.getFullYear()),
    leapYear: generateLeapYearEvents(),
    basic: generateBasicEvents(today),
  };
};

