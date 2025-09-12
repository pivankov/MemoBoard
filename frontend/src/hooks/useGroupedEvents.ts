import { useMemo } from 'react';

import type { Event } from "types/events";
import { diffInCalendarDays,getDay, getMonth, getYear, isInPastWindow, parseDateSafe, ruMonthFormatter } from "utils/date";
import { capitalizeFirst } from "utils/string";

/**
 * Расширение события вычисленными календарными полями, для последующих фильтраций и сортировок
 */
type CalendarizedEvent = Event & {
  year: number;
  month: number;
  day: number;
};

/**
 * Результат группировки событий.
 * - `actual`: массив групп по месяцам, предназначен для отображения актуальных и ежегодных событий.
 * - `overdue`: плоский список просроченных НЕ ежегодных событий, которые исключены из месячных групп.
 */
export type EventsGrouped = {
  actual: EventMonthGroup[];
  past: Event[];
  overdue: Event[];
}

/**
 * Группа событий за конкретный месяц.
 */
export type EventMonthGroup = {
  year: number;
  month: number;
  key: string;
  label: string;
  items: CalendarizedEvent[];
};

/**
 * Опции группировки событий.
 * - `overdueDays` — количество дней, после которых событие считается просроченным.
 *   Используется для определения попадания в `overdue` (для не ежегодных)
 *   и для нормализации дат ежегодных событий на текущий/следующий год.
 *   По умолчанию используется внутреннее значение, если не передано.
 */
type GroupingOptions = {
  overdueDays?: number;
};

const DEFAULT_OVERDUE_DAYS = 1;
const PAST_WINDOW_FROM_DAYS = 1;
const PAST_WINDOW_TO_DAYS = 7;

function normalizeDateForPast(sourceDate: Date, isYearly: boolean, currentYear: number): Date {
  if (!isYearly) {
    return sourceDate;
  }

  const normalized = new Date(sourceDate);
  normalized.setFullYear(currentYear);

  return normalized;
}

const sortingEventsByYearMonth = (events: EventMonthGroup[]): EventMonthGroup[] => {
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

const buildMonthKey = (year: number, month: number) => {
  return `${year}-${String(month).padStart(2, '0')}`;
};

const buildGroupingEvents = (events: CalendarizedEvent[]) => {
  const groupsMap = new Map<string, EventMonthGroup>();

  for (const event of events) {
    const { year, month } = event;

    const key = buildMonthKey(year, month);
    const group = groupsMap.get(key);
    
    if (!group) {
      groupsMap.set(key, {
        year,
        month,
        key,
        label: capitalizeFirst(ruMonthFormatter.format(new Date(year, month - 1))),
        items: [event],
      });
    } else {
      group.items.push(event);
    }
  }

  const groupedEvents = Array.from(groupsMap.values());


  for (const g of groupedEvents) {
    g.items.sort((a, b) => a.day - b.day);
  }

  return sortingEventsByYearMonth(groupedEvents);
}

/**
 * Строит сгруппированную структуру событий по месяцам и два плоских списка:
 * `past` (за последние N дней) и `overdue` (просроченные не ежегодные).
 * Логика:
 * - Невалидные даты пропускаются.
 * - «Недавно прошедшие» (`past`) — события с датой в интервале [PAST_WINDOW_FROM_DAYS, PAST_WINDOW_TO_DAYS]
 *   относительно сегодняшнего дня. Для ежегодных дат дата нормализуется к текущему году.
 * - Просроченные НЕ ежегодные (`overdue`) — не включаются в месячные группы.
 * - Ежегодные просроченные события переносятся на текущий год; если остаются просроченными — на следующий.
 * - Остальные попадают в месячные группы `actual` с сортировкой по году/месяцу/дню.
 * @param events Список событий
 * @param options Опции (например, overdueDays для определения просрочки)
 * @returns Объект `{ actual, past, overdue }`
 */
const groupEventsByMonth = (
  events: Event[],
  options?: GroupingOptions
): EventsGrouped => {
  const overdueDays = options?.overdueDays ?? DEFAULT_OVERDUE_DAYS;
  const today = new Date();
  const currentYear = today.getFullYear();

  const actualEvents: CalendarizedEvent[] = [];
  const pastEvents: Event[] = [];
  const overdueEvents: Event[] = [];

  for (const event of events) {
    const parsed = parseDateSafe(event.date);
    
    if (!parsed) {
      continue;
    }

    const isYearly = event.isYearly === true;
  
    const pastCheckDate = normalizeDateForPast(parsed, isYearly, currentYear);
    const isPastEvent = isInPastWindow(pastCheckDate, today, PAST_WINDOW_FROM_DAYS, PAST_WINDOW_TO_DAYS);

    if (isPastEvent) {
      pastEvents.push(event);
    }

    const isOriginallyOverdue = diffInCalendarDays(parsed, today) >= overdueDays;

    if (isOriginallyOverdue && !isYearly) {
      overdueEvents.push(event);

      continue;
    }

    let targetYear: number;

    if (isOriginallyOverdue && isYearly) {
      const eventDate = new Date(parsed);
      eventDate.setFullYear(currentYear);
      const isYearlyOverdue = diffInCalendarDays(eventDate, today) >= overdueDays;
      targetYear = isYearlyOverdue ? currentYear + 1 : currentYear;
    } else {
      targetYear = getYear(parsed);
    }

    actualEvents.push({
      ...event,
      year: targetYear,
      month: getMonth(parsed),
      day: getDay(parsed),
    });
  }

  const groupedActualEvents = buildGroupingEvents(actualEvents);

  return {
    actual: groupedActualEvents,
    past: pastEvents,
    overdue: overdueEvents,
  };
};

/**
 * Возвращает мемоизированные группы событий по месяцам.
 * Пересчитывает результат при изменении списка событий или значений опций.
 * @param events Список событий
 * @param options Опции группировки (напр., overdueDays)
 * @returns Объект `{ actual, overdue }`:
 *          - `actual`: массив месячных групп (сортировка по году/месяцу и по дням внутри)
 *          - `past`: плоский список событий за последние PAST_WINDOW_TO_DAYS дней
 *          - `overdue`: плоский список просроченных не ежегодных событий
 */
export const useGroupedEvents = (events: Event[], options?: GroupingOptions): EventsGrouped => {
  const { overdueDays = DEFAULT_OVERDUE_DAYS } = options ?? {};

  return useMemo(() => {
    if (!events || events.length === 0) {
      return {
        actual: [],
        past: [],
        overdue: [],
      };
    };

    return groupEventsByMonth(events, { overdueDays });
  }, [events, overdueDays]);
};