import type { Event } from "types/events";

import type { CalendarizedEvent,EventMonthGroup, EventsGrouped } from "../useGroupedEvents";

/**
 * Проверяет наличие события с указанным id в массиве
 */
export const hasEventWithId = (events: Event[], eventId: string): boolean => {
  return events.some(event => event.id === eventId);
};

/**
 * Находит событие по id
 */
export const findEventById = (events: Event[], eventId: string): Event | undefined => {
  return events.find(event => event.id === eventId);
};

/**
 * Проверяет наличие события в группах по месяцам
 */
export const hasEventInGroups = (groups: EventMonthGroup[], eventId: string): boolean => {
  return groups.some(group => 
    group.items.some((event: CalendarizedEvent) => event.id === eventId)
  );
};

/**
 * Находит событие в группах по месяцам
 */
export const findEventInGroups = (groups: EventMonthGroup[], eventId: string) => {
  for (const group of groups) {
    const event = group.items.find((e: CalendarizedEvent) => e.id === eventId);
    if (event) {
      return { event, group };
    }
  }
  return null;
};

/**
 * Получает все события из групп (плоский массив)
 */
export const flattenGroups = (groups: EventMonthGroup[]): Event[] => {
  return groups.flatMap(group => group.items);
};

/**
 * Подсчитывает общее количество событий во всех группах
 */
export const countEventsInGroups = (groups: EventMonthGroup[]): number => {
  return groups.reduce((sum, group) => sum + group.items.length, 0);
};

/**
 * Находит группу по году и месяцу
 */
export const findGroup = (
  groups: EventMonthGroup[],
  year: number,
  month: number
): EventMonthGroup | undefined => {
  return groups.find(group => group.year === year && group.month === month);
};

/**
 * Проверяет, что группы отсортированы по году и месяцу (ASC)
 */
export const areGroupsSorted = (groups: EventMonthGroup[]): boolean => {
  for (let i = 0; i < groups.length - 1; i++) {
    const current = groups[i];
    const next = groups[i + 1];
    
    if (current.year > next.year) {
      return false;
    }
    
    if (current.year === next.year && current.month > next.month) {
      return false;
    }
  }
  return true;
};

/**
 * Проверяет, что события внутри группы отсортированы по дню (ASC)
 */
export const areEventsInGroupSorted = (group: EventMonthGroup): boolean => {
  const items = group.items;
  for (let i = 0; i < items.length - 1; i++) {
    if (items[i].day > items[i + 1].day) {
      return false;
    }
  }
  return true;
};

/**
 * Создает snapshot-структуру для групп (без полных данных событий)
 */
export const createGroupsStructureSnapshot = (groups: EventMonthGroup[]) => {
  return groups.map(group => ({
    year: group.year,
    month: group.month,
    key: group.key,
    label: group.label,
    itemsCount: group.items.length,
    itemIds: group.items.map((item: CalendarizedEvent) => item.id),
  }));
};

/**
 * Вспомогательная функция для отладки - выводит структуру результата
 */
export const debugResult = (result: EventsGrouped): string => {
  const actualCount = countEventsInGroups(result.actual);
  const actualGroupsInfo = result.actual.map((g: EventMonthGroup) => 
    `${g.label} (${g.items.length})`
  ).join(', ');
  
  return `
Actual groups: ${result.actual.length} (${actualCount} событий)
  ${actualGroupsInfo}
Past events: ${result.past.length}
  ${result.past.map((e: Event) => e.id).join(', ')}
Overdue events: ${result.overdue.length}
  ${result.overdue.map((e: Event) => e.id).join(', ')}
  `.trim();
};

/**
 * Проверяет базовую структуру результата
 */
export const validateResultStructure = (result: EventsGrouped): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!Array.isArray(result.actual)) {
    errors.push('actual не является массивом');
  }
  
  if (!Array.isArray(result.past)) {
    errors.push('past не является массивом');
  }
  
  if (!Array.isArray(result.overdue)) {
    errors.push('overdue не является массивом');
  }
  
  if (!areGroupsSorted(result.actual)) {
    errors.push('actual группы не отсортированы');
  }
  
  for (const group of result.actual) {
    if (!areEventsInGroupSorted(group)) {
      errors.push(`События в группе ${group.label} не отсортированы по дню`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Извлекает год и месяц из строки key ("YYYY-MM")
 */
export const parseGroupKey = (key: string): { year: number; month: number } => {
  const [yearStr, monthStr] = key.split('-');
  return {
    year: parseInt(yearStr, 10),
    month: parseInt(monthStr, 10),
  };
};

/**
 * Проверяет, что событие повторяется нужное количество раз в actual
 */
export const countEventOccurrences = (
  groups: EventMonthGroup[],
  eventId: string
): number => {
  let count = 0;
  for (const group of groups) {
    for (const item of group.items) {
      if (item.id === eventId) {
        count++;
      }
    }
  }
  return count;
};

