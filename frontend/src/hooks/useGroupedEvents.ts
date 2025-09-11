import { useMemo } from 'react';

import type { Event } from "types/events";
import { getDay, getMonth, getYear, isOverdue, parseDateSafe, ruMonthFormatter } from "utils/date";

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
  actual: EventMonthGroup[],
  overdue: Event[],
}

/**
 * Группа событий за конкретный месяц.
 */
type EventMonthGroup = {
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

const DEFAULT_OVERDUE_DAYS = 4;

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

/**
 * Строит структуру сгруппированных событий и отдельный список просроченных.
 * Логика:
 * - Просроченные НЕ ежегодные события не попадают в месячные группы и возвращаются в `overdue`.
 * - Ежегодные события, просроченные на N дней, «переносятся» на текущий год;
 *   если и в текущем году они остаются просроченными — переносятся на следующий год.
 * - Непросроченные события попадают в свои фактические год/месяц/день.
 * - Невалидные даты пропускаются.
 * @param events Список событий
 * @param options Опции группировки (например, количество дней просрочки)
 * @returns Объект `{ actual, overdue }`, где `actual` — массив групп по (year, month)
 *          с сортировкой по месяцам и дням внутри; `overdue` — плоский список просроченных не ежегодных событий
 */
const groupEventsByMonth = (
  events: Event[],
  options?: GroupingOptions
): EventsGrouped => {
  const overdueDays = options?.overdueDays ?? DEFAULT_OVERDUE_DAYS;
  const currentYear = new Date().getFullYear();

  const actualEvents: CalendarizedEvent[] = [];
  const overdueEvents: Event[] = [];

  for (const event of events) {
    const parsed = parseDateSafe(event.date);
    
    if (!parsed) {
      continue;
    }

    const isYearly = event.isYearly === true;
    const isOriginallyOverdue = isOverdue(parsed, overdueDays);

    if (isOriginallyOverdue && !isYearly) {
      overdueEvents.push(event);

      continue;
    }

    let targetYear: number;

    if (isOriginallyOverdue && isYearly) {
      const eventDate = new Date(parsed);
      eventDate.setFullYear(currentYear);
      targetYear = isOverdue(eventDate, overdueDays) ? currentYear + 1 : currentYear;
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

  const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`;
  const groupsMap = new Map<string, EventMonthGroup>();

  for (const event of actualEvents) {
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

  const sortedActualEvents = sortingEventsByYearMonth(resultArr);  

  return {
    actual: sortedActualEvents,
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
 *          - `overdue`: плоский список просроченных не ежегодных событий
 */
export const useGroupedEvents = (events: Event[], options?: GroupingOptions): EventsGrouped => {
  const { overdueDays = DEFAULT_OVERDUE_DAYS } = options ?? {};

  return useMemo(() => {
    if (!events || events.length === 0) {
      return { actual: [], overdue: [] };
    };

    return groupEventsByMonth(events, { overdueDays });
  }, [events, overdueDays]);
};