import { useMemo } from 'react';

import type { Event } from "../types/events";
import { getDay, getMonth, getYear, isOverdue, parseDateSafe, ruMonthFormatter } from "../utils/date";

type EventWithCalendar = Event & {
  year: number;
  month: number;
  day: number;
};

/**
 * Группа событий за конкретный месяц.
 * Используется для отображения заголовка месяца и списка событий внутри него.
 * key формата YYYY-MM, где месяц всегда в 2 знака (01-12).
 */
export type EventsMonthGroup = {
  year: number;
  month: number;
  key: string;
  label: string;
  items: EventWithCalendar[];
};

export type GroupOptions = {
  overdueDays?: number;
};

const DEFAULT_OVERDUE_DAYS = 4;

const sortingEventsByYearMonth = (events: EventsMonthGroup[]): EventsMonthGroup[] => {
  const sorted = [...events].sort((e1, e2) => {
    const y1 = e1.year;
    const y2 = e2.year;

    if (y1 !== y2) {
      return y1 - y2;
    }

    const m1 = e1.month;
    const m2 = e2.month;
    if (m1 !== m2) {
      return m1 - m2;
    }

    return 0;
  })

  return sorted;
};

/**
 * Строит массив групп событий по месяцам с учётом логики просрочки и ежегодных событий.
 * - Ежегодные события, просроченные на N дней, «переносятся» на текущий или следующий год.
 * - Обычные события, не просроченные, попадают в свою фактическую дату (год/месяц/день).
 * - Невалидные даты пропускаются.
 * @param events Список событий
 * @param options Опции группировки (напр., количество дней просрочки)
 * @returns Отсортированный список групп по (year, month), внутри группы события отсортированы по дню
 */
export const groupEventsByMonth = (
  events: Event[],
  options?: GroupOptions
): EventsMonthGroup[] => {
  const overdueDays = options?.overdueDays ?? DEFAULT_OVERDUE_DAYS;
  const currentYear = new Date().getFullYear();

  const eventsWithCalendar: EventWithCalendar[] = [];

  for (const event of events) {
    const parsed = parseDateSafe(event.date);
    
    if (!parsed) {
      continue;
    }

    const originallyOverdue = isOverdue(parsed, overdueDays);

    let targetYear: number | null = null;

    if (originallyOverdue && event.isYearly) {
      const eventDate = new Date(parsed);
      eventDate.setFullYear(currentYear);
      
      targetYear = isOverdue(eventDate, overdueDays) ? currentYear + 1 : currentYear;
    } else if (!originallyOverdue) {
      targetYear = getYear(parsed);
    }

    if (targetYear !== null) {
      eventsWithCalendar.push({
        ...event,
        year: targetYear,
        month: getMonth(parsed),
        day: getDay(parsed),
      });
    }
  }

  const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`;
  const groupsMap = new Map<string, EventsMonthGroup>();

  for (const event of eventsWithCalendar) {
    const { year, month } = event;

    const key = monthKey(year, month);
    const group = groupsMap.get(key);
    
    if (!group) {
      groupsMap.set(key, {
        year,
        month,
        key,
        label: ruMonthFormatter.format(new Date(year, month - 1)),
        items: [event],
      });
    } else {
      group.items.push(event);
    }
  }

  const resultArr = Array.from(groupsMap.values());

  for (const g of resultArr) {
    g.items.sort((a, b) => a.day - b.day);
  }

  const sortedEvents = sortingEventsByYearMonth(resultArr);  

  return sortedEvents;
};

/**
 * React-хук, возвращающий мемоизированные группы событий по месяцам.
 * Пересчитывает результат при изменении списка событий или значений опций.
 * @param events Список событий
 * @param options Опции группировки (напр., overdueDays)
 * @returns Мемоизированный массив групп событий
 */
export const useGroupedEvents = (events: Event[], options?: GroupOptions) => {
  const { overdueDays = DEFAULT_OVERDUE_DAYS } = options ?? {};

  return useMemo(() => {
    if (!events || events.length === 0) {
      return [] as EventsMonthGroup[];
    };

    return groupEventsByMonth(events, { overdueDays });
  }, [events, overdueDays]);
};