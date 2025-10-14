import { useMemo } from 'react';

import type { Event } from "types/events";
import {
  diffInCalendarDays,
  formatDateToString,
  getDay,
  getDaysInMonth,
  getMonth,
  getYear,
  isInPastWindow,
  parseDateSafe,
  ruMonthFormatter,
} from "utils/date";
import { isMonthly, isNone, isYearly } from "utils/events";
import { capitalizeFirst } from "utils/string";

/**
 * Событие с вычисленными компонентами календарной даты
 * Расширяет базовое событие полями для группировки по месяцам
 */
export type CalendarizedEvent = Event & {
  year: number;   // Год следующего вхождения
  month: number;  // Месяц (1-12)
  day: number;    // День месяца (1-31)
};

/**
 * Результат построения актуальных событий
 * Разделяет события на предстоящие и просроченные
 */
type BuildActualEventsResult = {
  actualEvents: CalendarizedEvent[];  // Предстоящие события
  overdueEvents: Event[];             // Просроченные события (только recurrence: "none")
};

/**
 * Результат группировки событий по категориям
 * Главный тип возврата хука useGroupedEvents
 */
export type EventsGrouped = {
  actual: EventMonthGroup[];  // Актуальные события, сгруппированные по месяцам
  past: Event[];              // Недавно прошедшие события (окно 1-7 дней)
  overdue: Event[];           // Просроченные события
}

/**
 * Группа событий за один календарный месяц
 * Используется для отображения событий в календаре
 */
export type EventMonthGroup = {
  year: number;                  // 2025
  month: number;                 // 10 (октябрь)
  key: string;                   // "2025-10"
  label: string;                 // "Октябрь" или "Октябрь 2025"
  items: CalendarizedEvent[];    // События в этом месяце, отсортированные по дням
};

/**
 * Сортирует прошедшие события для отображения
 * Сначала по месяцу (DESC), затем по дню (DESC) - свежие события выше
 * @param events - Массив прошедших событий
 * @returns Отсортированный массив событий
 */
const sortPastEvents = (events: Event[]): Event[] => {
  return [...events].sort((first, second) => {
    const firstDate = parseDateSafe(first.originalDate);
    const secondDate = parseDateSafe(second.originalDate);

    if (!firstDate && !secondDate) {
      return 0;
    }

    if (!firstDate) {
      return 1;
    }

    if (!secondDate) {
      return -1;
    }

    const monthDifference = getMonth(secondDate) - getMonth(firstDate);

    if (monthDifference !== 0) {
      return monthDifference;
    }

    return getDay(secondDate) - getDay(firstDate);
  });
};

/**
 * Вычисляет опорную дату для проверки попадания события в окно прошедших
 * Для monthly/yearly использует только день/месяц из originalDate, год берет из today
 * @param event - Событие для обработки
 * @param parsedDate - Распарсенная originalDate события
 * @param today - Текущая дата
 * @returns Опорная дата для проверки или null, если событие не подходит
 * 
 * Применяет нормализацию дня (например, 31 января → 28/29 февраля)
 */
const getPastReferenceDate = (
  event: Event,
  parsedDate: Date,
  today: Date
): Date | null => {
  if (isNone(event)) {
    return parsedDate;
  }

  const currentYear = getYear(today);

  if (isYearly(event)) {
    const monthIndex = getMonth(parsedDate) - 1;
    const daysInMonth = getDaysInMonth(currentYear, monthIndex);
    const normalizedDay = Math.min(getDay(parsedDate), daysInMonth);

    return new Date(currentYear, monthIndex, normalizedDay);
  }

  if (isMonthly(event)) {
    const currentMonthIndex = getMonth(today) - 1;
    const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonthIndex);
    const normalizedDay = Math.min(getDay(parsedDate), daysInCurrentMonth);

    return new Date(currentYear, currentMonthIndex, normalizedDay);
  }

  return null;
};

/**
 * Находит события, которые уже произошли в заданном окне (по умолчанию 1-7 дней назад)
 * КРИТИЧНО: Проверяет originalDate(diffInCalendarDays) перед нормализацией, чтобы будущие события не попали в past 
 * @param events - Массив всех событий
 * @param today - Текущая дата
 * @param pastWindowFromDays - Нижняя граница окна (≥N дней назад)
 * @param pastWindowToDays - Верхняя граница окна (≤N дней назад)
 * @returns Отсортированный массив прошедших событий
 * 
 * Защита: события с originalDate в будущем пропускаются до нормализации,
 * чтобы monthly/yearly события не попали в past раньше своей первой даты
 */
const buildPastEvents = (
  events: Event[],
  today: Date,
  pastWindowFromDays: number,
  pastWindowToDays: number
): Event[] => {
  const past: Event[] = [];

  for (const event of events) {
    const parsedDate = parseDateSafe(event.originalDate);

    if (!parsedDate) {
      continue;
    }

    if (diffInCalendarDays(parsedDate, today) < 0) {
      continue;
    }

    const referenceDate = getPastReferenceDate(event, parsedDate, today);

    if (!referenceDate) {
      continue;
    }

    if (isInPastWindow(referenceDate, today, pastWindowFromDays, pastWindowToDays)) {
      past.push(event);
    }
  }

  return sortPastEvents(past);
};

/**
 * Строит актуальные (предстоящие) события и отделяет просроченные
 * Обрабатывает три типа повторений: none (одно), yearly (одно), monthly (12 вхождений)
 * @param events - Массив всех событий
 * @param today - Текущая дата
 * @param overdueDays - Порог просрочки (≥N дней назад = overdue)
 * @param monthlyForwardMonths - Количество месяцев для генерации monthly событий
 * @returns Объект с актуальными и просроченными событиями
 * 
 * Логика по типам:
 * - none: одно вхождение, может быть просрочено (≥1 день назад)
 * - yearly: одно вхождение на текущий/следующий год, не может быть просрочено
 * - monthly: 12 вхождений (годовой цикл), начиная с текущего/следующего месяца
 * 
 * Применяет нормализацию дня для учета разного количества дней в месяцах
 */
const buildActualCalendarizedEvents = (
  events: Event[],
  today: Date,
  overdueDays: number,
  monthlyForwardMonths: number
): BuildActualEventsResult => {
  const actualEvents: CalendarizedEvent[] = [];
  const overdueEvents: Event[] = [];

  for (const event of events) {
    const parsedDate = parseDateSafe(event.originalDate);

    if (!parsedDate) {
      continue;
    }

    if (isNone(event)) {
      const daysDifference = diffInCalendarDays(parsedDate, today);

      if (daysDifference >= overdueDays) {
        overdueEvents.push(event);
        continue;
      }

      actualEvents.push({
        ...event,
        nextDate: formatDateToString(parsedDate),
        year: getYear(parsedDate),
        month: getMonth(parsedDate),
        day: getDay(parsedDate),
      });

      continue;
    }

    if (isYearly(event)) {
      const currentYear = getYear(today);
      const monthIndex = getMonth(parsedDate) - 1;
      const originalDay = getDay(parsedDate);
      const daysInCurrentYearMonth = getDaysInMonth(currentYear, monthIndex);
      const normalizedDayCurrentYear = Math.min(originalDay, daysInCurrentYearMonth);
      const thisYearDate = new Date(currentYear, monthIndex, normalizedDayCurrentYear);

      let nextDateCandidate = thisYearDate;
      const differenceToToday = diffInCalendarDays(thisYearDate, today);

      if (differenceToToday >= overdueDays) {
        const nextYear = currentYear + 1;
        const daysInNextYearMonth = getDaysInMonth(nextYear, monthIndex);
        const normalizedDayNextYear = Math.min(originalDay, daysInNextYearMonth);
        nextDateCandidate = new Date(nextYear, monthIndex, normalizedDayNextYear);
      }

      actualEvents.push({
        ...event,
        nextDate: formatDateToString(nextDateCandidate),
        year: getYear(nextDateCandidate),
        month: getMonth(nextDateCandidate),
        day: getDay(nextDateCandidate),
      });

      continue;
    }

    if (isMonthly(event)) {
      const eventDay = getDay(parsedDate);
      let startYear = getYear(today);
      let startMonth = getMonth(today);
      const currentMonthIndex = startMonth - 1;
      const daysInCurrentMonth = getDaysInMonth(startYear, currentMonthIndex);
      const normalizedCurrentDay = Math.min(eventDay, daysInCurrentMonth);
      const currentMonthDate = new Date(startYear, currentMonthIndex, normalizedCurrentDay);
      const differenceToToday = diffInCalendarDays(currentMonthDate, today);

      if (differenceToToday >= overdueDays) {
        startMonth += 1;

        if (startMonth > 12) {
          startMonth = 1;
          startYear += 1;
        }
      }

      for (let offset = 0; offset < monthlyForwardMonths; offset += 1) {
        let month = startMonth + offset;
        let year = startYear;

        while (month > 12) {
          month -= 12;
          year += 1;
        }

        const monthIndex = month - 1;
        const daysInMonth = getDaysInMonth(year, monthIndex);
        const normalizedDay = Math.min(eventDay, daysInMonth);
        const occurrenceDate = new Date(year, monthIndex, normalizedDay);

        actualEvents.push({
          ...event,
          nextDate: formatDateToString(occurrenceDate),
          year: getYear(occurrenceDate),
          month: getMonth(occurrenceDate),
          day: getDay(occurrenceDate),
        });
      }
    }
  }

  return {
    actualEvents,
    overdueEvents,
  };
};

/**
 * Группирует актуальные события по месяцам для отображения в календаре
 * Создает структуру EventMonthGroup с метаданными для каждого месяца
 * @param calendarizedEvents - Массив событий с календарными компонентами
 * @param today - Текущая дата (для формирования label)
 * @returns Массив групп событий, отсортированный по году и месяцу (ASC)
 * 
 * Формирует label:
 * - Для текущего года: "Октябрь"
 * - Для других лет: "Октябрь 2026"
 * 
 * События внутри каждой группы сортируются по дню (ASC)
 */
const buildActualGroups = (
  calendarizedEvents: CalendarizedEvent[],
  today: Date
): EventMonthGroup[] => {
  if (calendarizedEvents.length === 0) {
    return [];
  }

  const groupsMap = new Map<string, CalendarizedEvent[]>();

  for (const calendarizedEvent of calendarizedEvents) {
    const key = `${calendarizedEvent.year}-${String(calendarizedEvent.month).padStart(2, '0')}`;

    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }

    groupsMap.get(key)!.push(calendarizedEvent);
  }

  const actualGroups: EventMonthGroup[] = [];
  const currentYear = getYear(today);

  for (const [key, items] of Array.from(groupsMap.entries())) {
    const [yearStr, monthStr] = key.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);

    items.sort((first, second) => first.day - second.day);

    const monthDate = new Date(year, month - 1, 1);
    const monthName = capitalizeFirst(ruMonthFormatter.format(monthDate));
    const label = year === currentYear ? monthName : `${monthName} ${year}`;

    actualGroups.push({
      year,
      month,
      key,
      label,
      items,
    });
  }

  actualGroups.sort((first, second) => {
    if (first.year !== second.year) {
      return first.year - second.year;
    }

    return first.month - second.month;
  });

  return actualGroups;
};

/**
 * Основная функция группировки событий по категориям
 * Классифицирует события на актуальные (по месяцам), прошедшие и просроченные
 * @param events - Массив всех событий из базы данных
 * @param today - Текущая дата (по умолчанию new Date(), параметр для тестирования)
 * @returns Объект EventsGrouped с тремя категориями событий
 * 
 * Константы конфигурации:
 * - PAST_WINDOW_FROM_DAYS = 1 (≥1 день назад)
 * - PAST_WINDOW_TO_DAYS = 7 (≤7 дней назад)
 * - MONTHLY_FORWARD_MONTHS = 12 (годовой цикл для monthly событий)
 * - DEFAULT_OVERDUE_DAYS = 1 (≥1 день назад = просрочено)
 */
export const groupEventsByMonth = (
  events: Event[],
  today: Date = new Date()
): EventsGrouped => {
  const PAST_WINDOW_FROM_DAYS = 1;
  const PAST_WINDOW_TO_DAYS = 7;
  const MONTHLY_FORWARD_MONTHS = 12;
  const DEFAULT_OVERDUE_DAYS = 1;

  const pastEvents = buildPastEvents(events, today, PAST_WINDOW_FROM_DAYS, PAST_WINDOW_TO_DAYS);
  const { actualEvents, overdueEvents } = buildActualCalendarizedEvents(
    events,
    today,
    DEFAULT_OVERDUE_DAYS,
    MONTHLY_FORWARD_MONTHS,
  );
  const actualGroups = buildActualGroups(actualEvents, today);

  return {
    actual: actualGroups,
    past: pastEvents,
    overdue: overdueEvents,
  };
};

/**
 * React хук для группировки и классификации событий календаря
 * Использует мемоизацию для оптимизации производительности
 * @param events - Массив всех событий из базы данных
 * @returns Сгруппированные события по категориям: actual (по месяцам), past, overdue
 * 
 * Пересчет происходит только при изменении массива events (useMemo)
 * Возвращает пустой результат, если events пустой или undefined
 */
export const useGroupedEvents = (events: Event[]): EventsGrouped => {

  return useMemo(() => {
    if (!events || events.length === 0) {
      return {
        actual: [],
        past: [],
        overdue: [],
      };
    };

    return groupEventsByMonth(events);
  }, [events]);
};