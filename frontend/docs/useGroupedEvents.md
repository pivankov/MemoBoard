# useGroupedEvents

Хук классифицирует и группирует события календаря в три коллекции: `actual` (предстоящие, разбиты по месяцам), `past` (прошедшие в окне 1–7 дней назад), `overdue` (просроченные разовые события).

## API

#### useGroupedEvents(events: Event[]) → EventsGrouped

Мемоизирован по `events` (`useMemo`). Внутри вызывает `groupEventsByMonth(events)`.

```ts
EventsGrouped {
  actual: EventMonthGroup[];   // { year, month, key: 'YYYY-MM', label, items: CalendarizedEvent[] }
  past: Event[];
  overdue: Event[];
}

CalendarizedEvent = Event & { year: number, month: number (1-12), day: number (1-31) }
```

Источник типов: `src/types/events.ts`.

## Конфигурация

Константы хука (`useGroupedEvents.ts`):

- `PAST_WINDOW_FROM_DAYS = 1`, `PAST_WINDOW_TO_DAYS = 7` — границы окна past (в днях назад).
- `MONTHLY_FORWARD_MONTHS = 12` — для `recurrence: 'monthly'` генерируется 12 вхождений вперёд (полный визуальный годовой цикл на UI).
- `DEFAULT_OVERDUE_DAYS = 1` — порог просрочки (≥1 день назад = overdue).

## Алгоритм

```
groupEventsByMonth(events)
  ├─ buildPastEvents()                → past[]
  │    └─ getPastReferenceDate(), sortPastEvents()
  ├─ buildActualCalendarizedEvents()  → { actualEvents[], overdueEvents[] }
  └─ buildActualGroups(actualEvents)  → EventMonthGroup[]
```

### buildPastEvents

Для каждого события:
1. Парсит `originalDate`. **Критично:** если `originalDate` в будущем (`diffInCalendarDays(parsed, today) < 0`) — пропускает. Без этой проверки monthly/yearly события с originalDate в будущем ошибочно попадают в past, потому что `getPastReferenceDate` сдвигает их на текущий месяц/год.
2. Получает `referenceDate` (см. ниже).
3. Проверяет попадание в окно `[PAST_WINDOW_FROM_DAYS, PAST_WINDOW_TO_DAYS]` через `isInPastWindow`.
4. Сортирует результат по месяцу DESC, затем по дню DESC.

### getPastReferenceDate

`referenceDate` строится по правилам:

| recurrence | Логика |
|---|---|
| `none` | `originalDate` как есть |
| `yearly` | день + месяц из `originalDate`, год из `today` |
| `monthly` | день из `originalDate`, месяц + год из `today` |

День нормализуется: `Math.min(originalDay, daysInMonth)`. Это предотвращает «переполнение» (`new Date(2025, 1, 31)` в JS даёт 3 марта). Событие 31 января в феврале становится 28/29, в апреле — 30.

### buildActualCalendarizedEvents

- `recurrence: 'none'`: если `diffInCalendarDays(parsedDate, today) >= DEFAULT_OVERDUE_DAYS` → в `overdueEvents`, иначе в `actualEvents`.
- `recurrence: 'yearly'`: строит дату на текущий год. Если она уже прошла (≥1 день назад) — сдвиг на следующий год. Одно вхождение в `actualEvents`.
- `recurrence: 'monthly'`: строит дату на текущий месяц. Если прошла — старт со следующего месяца. Генерирует `MONTHLY_FORWARD_MONTHS` вхождений с обработкой перехода года (`while (month > 12) { month -= 12; year += 1; }`).

### buildActualGroups

Группирует `CalendarizedEvent[]` по ключу `YYYY-MM`, внутри группы сортирует по дню ASC, группы — по году и месяцу ASC. Label месяца — `monthName` для текущего года, `monthName YYYY` для остальных.

## Инварианты

- Повторяющиеся события (yearly/monthly) никогда не бывают в `overdue` — они сдвигаются на следующее вхождение.
- `pastEvents` содержит только события, у которых `originalDate` уже наступил (см. защиту в `buildPastEvents`).
- День ≥ количества дней в месяце нормализуется через `Math.min`.

## Пример: monthly с переходом года

```js
// today = 2025-10-10
// event = { originalDate: '2025-01-05', recurrence: 'monthly' }
//
// currentMonthDate = 2025-10-05, прошло 5 дней → старт со следующего месяца.
// actualEvents: [
//   { ..., year: 2025, month: 11, day: 5 },
//   { ..., year: 2025, month: 12, day: 5 },
//   { ..., year: 2026, month:  1, day: 5 },
//   ... всего 12 вхождений ...
//   { ..., year: 2026, month: 10, day: 5 },
// ]
```

## Тестирование

Для воспроизводимых тестов в `groupEventsByMonth` `today` можно заменить на фиксированную дату:

```ts
const today = new Date('2025-10-03');
```

Покрытие — см. [`../src/hooks/__tests__/README.md`](../src/hooks/__tests__/README.md).
