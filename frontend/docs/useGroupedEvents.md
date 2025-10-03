# Документация: useGroupedEvents

## Оглавление
- [Общее описание](#общее-описание)
- [Типы данных](#типы-данных)
- [Константы конфигурации](#константы-конфигурации)
- [Архитектура](#архитектура)
- [Детальное описание функций](#детальное-описание-функций)
- [Критические моменты](#критические-моменты)
- [Примеры сценариев](#примеры-сценариев)

---

## Общее описание

Хук `useGroupedEvents` отвечает за классификацию и группировку событий календаря в три категории:

1. **`actual`** - Актуальные (предстоящие) события, сгруппированные по месяцам
2. **`past`** - Недавно прошедшие события (в окне 1-7 дней назад)
3. **`overdue`** - Просроченные события (только для разовых событий)

### Входные данные
```typescript
events: Event[]  // Массив всех событий из базы данных
```

### Выходные данные
```typescript
EventsGrouped {
  actual: EventMonthGroup[];   // Группы событий по месяцам
  past: Event[];                // Прошедшие события (1-7 дней назад)
  overdue: Event[];             // Просроченные события
}
```

---

## Типы данных

### Event (базовый тип)
```typescript
{
  id: string;
  title: string;
  originalDate: string;        // Исходная дата в формате YYYY-MM-DD
  nextDate: string;             // Следующая дата наступления
  type: EventType;              // holiday | birthday | church | other
  recurrence: Recurrence;       // none | monthly | yearly
  description: string;
}
```

### CalendarizedEvent (расширенный для календаря)
```typescript
Event & {
  year: number;    // Год следующего вхождения
  month: number;   // Месяц (1-12)
  day: number;     // День месяца (1-31)
}
```

### EventMonthGroup (группа событий)
```typescript
{
  year: number;          // 2025
  month: number;         // 10 (октябрь)
  key: string;           // "2025-10"
  label: string;         // "Октябрь" или "Октябрь 2025"
  items: CalendarizedEvent[];  // События в этом месяце
}
```

### Recurrence (типы повторения)
- **`none`** - Разовое событие (без повторения)
- **`monthly`** - Ежемесячное повторение (каждый месяц в тот же день)
- **`yearly`** - Ежегодное повторение (каждый год в ту же дату)

---

## Константы конфигурации

```typescript
PAST_WINDOW_FROM_DAYS = 1      // Нижняя граница окна прошедших (≥1 день назад)
PAST_WINDOW_TO_DAYS = 7        // Верхняя граница окна прошедших (≤7 дней назад)
MONTHLY_FORWARD_MONTHS = 12    // Генерация monthly событий на 12 месяцев вперед
DEFAULT_OVERDUE_DAYS = 1       // Порог просрочки (≥1 день назад = overdue)
```

### Зачем 12 месяцев для monthly?
Monthly события создают визуальный годовой цикл. На сайте это выглядит как последовательность месяцев:
```
Октябрь → Ноябрь → Декабрь → Январь(2026) → ... → Сентябрь(2026)
```

Если событие имеет `originalDate: "2025-10-01"` и `recurrence: "monthly"`, оно будет показано **в каждом из 12 месяцев**.

---

## Архитектура

```
groupEventsByMonth(events)
    │
    ├─→ buildPastEvents()          → pastEvents[]
    │     └─→ getPastReferenceDate()
    │     └─→ sortPastEvents()
    │
    ├─→ buildActualCalendarizedEvents()  → { actualEvents[], overdueEvents[] }
    │
    └─→ buildActualGroups()        → EventMonthGroup[]
```

---

## Детальное описание функций

### 1. `buildPastEvents(events, today, pastWindowFromDays, pastWindowToDays)`

**Цель**: Найти события, которые уже произошли в окне от 1 до 7 дней назад.

**Алгоритм**:

1. Для каждого события парсим `originalDate`
2. **КРИТИЧЕСКАЯ ПРОВЕРКА** (перед нормализацией):
   ```typescript
   if (diffInCalendarDays(parsedDate, today) < 0) {
     continue; // Пропустить, если событие с originalDate в будущем
   }
   ```
3. Получаем `referenceDate` через `getPastReferenceDate()`
4. Проверяем попадание в окно `isInPastWindow()`
5. Сортируем результат через `sortPastEvents()`

**Логика по типам повторений**:

| Recurrence | Логика построения referenceDate |
|-----------|----------------------------------|
| `none` | Берется `originalDate` как есть |
| `yearly` | День и месяц из `originalDate` + текущий год |
| `monthly` | День из `originalDate` + текущий месяц/год |

**Пример (yearly)**:
```javascript
// today = 2025-10-10
// event = { originalDate: "2020-10-05", recurrence: "yearly" }

// Шаг 1: parsedDate = 2020-10-05
// Шаг 2: diffInCalendarDays(2020-10-05, 2025-10-10) = 1831 > 0 ✓
// Шаг 3: referenceDate = new Date(2025, 9, 5) = 2025-10-05
// Шаг 4: daysAgo = 5, попадает в [1, 7] → в past ✓
```

---

### 2. `getPastReferenceDate(event, parsedDate, today)`

**Цель**: Вычислить "опорную дату" для проверки попадания в окно прошедших.

**Важно**: Для monthly/yearly использует **только день/месяц** из `originalDate`, год берет из `today`.

**Нормализация дня**:
```typescript
const normalizedDay = Math.min(originalDay, daysInMonth);
```

Если событие на 31 число, а в месяце только 30 дней → берется день 30.

**Примеры нормализации**:
- Событие 31 января → в феврале станет 28/29
- Событие 30 марта → в апреле останется 30
- Событие 31 мая → в июне станет 30

---

### 3. `sortPastEvents(events)`

**Цель**: Отсортировать прошедшие события для удобного отображения.

**Логика сортировки**:
1. Сначала по месяцу (DESC) - свежие месяцы выше
2. Затем по дню (DESC) - свежие дни выше

**Пример**:
```javascript
// Ввод:
[
  { originalDate: "2024-09-15" },
  { originalDate: "2024-10-05" },
  { originalDate: "2024-10-10" }
]

// Вывод:
[
  { originalDate: "2024-10-10" },  // октябрь, день 10
  { originalDate: "2024-10-05" },  // октябрь, день 5
  { originalDate: "2024-09-15" }   // сентябрь
]
```

---

### 4. `buildActualCalendarizedEvents(events, today, overdueDays, monthlyForwardMonths)`

**Цель**: Разделить события на актуальные (предстоящие) и просроченные.

**Возвращает**:
```typescript
{
  actualEvents: CalendarizedEvent[];
  overdueEvents: Event[];
}
```

#### Логика для `recurrence: "none"` (разовое событие)

```typescript
const daysDifference = diffInCalendarDays(parsedDate, today);

if (daysDifference >= overdueDays) {  // >= 1 день назад
  overdueEvents.push(event);
} else {
  actualEvents.push(event);
}
```

**Пример**:
```javascript
// today = 2025-10-10
// event = { originalDate: "2025-10-08", recurrence: "none" }

// daysDifference = 2 дня назад
// 2 >= 1 → в overdueEvents
```

#### Логика для `recurrence: "yearly"` (ежегодное)

1. Строим дату на текущий год
2. Если она уже прошла (≥1 день назад) → сдвигаем на следующий год
3. Добавляем **одно** вхождение в `actualEvents`

**Пример**:
```javascript
// today = 2025-10-10
// event = { originalDate: "2020-10-05", recurrence: "yearly" }

// Шаг 1: thisYearDate = 2025-10-05
// Шаг 2: differenceToToday = 5 дней назад
// Шаг 3: 5 >= 1 → сдвиг на следующий год
// Результат: nextDate = 2026-10-05
```

#### Логика для `recurrence: "monthly"` (ежемесячное)

1. Строим дату на текущий месяц
2. Если она уже прошла (≥1 день назад) → начинаем со следующего месяца
3. Генерируем **12 вхождений** (по одному на каждый месяц)

**Пример**:
```javascript
// today = 2025-10-10
// event = { originalDate: "2025-01-15", recurrence: "monthly" }

// Шаг 1: currentMonthDate = 2025-10-15
// Шаг 2: differenceToToday = -5 (еще не наступило)
// Шаг 3: Начинаем с октября 2025
// Результат: 12 дат
// [2025-10-15, 2025-11-15, 2025-12-15, 2026-01-15, ..., 2026-09-15]
```

**Учет перехода года**:
```typescript
while (month > 12) {
  month -= 12;
  year += 1;
}
```

---

### 5. `buildActualGroups(calendarizedEvents, today)`

**Цель**: Сгруппировать актуальные события по месяцам для отображения.

**Алгоритм**:

1. Группировка по ключу `"YYYY-MM"`:
   ```typescript
   const key = `${year}-${String(month).padStart(2, '0')}`;
   // Пример: "2025-10"
   ```

2. Сортировка событий внутри группы по дню (ASC)

3. Формирование label:
   ```typescript
   const label = year === currentYear 
     ? monthName              // "Октябрь"
     : `${monthName} ${year}` // "Октябрь 2026"
   ```

4. Сортировка групп по году, затем по месяцу (ASC)

**Пример результата**:
```javascript
[
  {
    year: 2025,
    month: 10,
    key: "2025-10",
    label: "Октябрь",
    items: [
      { id: "1", day: 5, ... },
      { id: "2", day: 15, ... }
    ]
  },
  {
    year: 2025,
    month: 11,
    key: "2025-11",
    label: "Ноябрь",
    items: [...]
  }
]
```

---

## Критические моменты

### 1. Защита от попадания будущих событий в past

**Проблема без проверки**:

```javascript
// today = 2025-10-03
// event = { originalDate: "2026-01-02", recurrence: "monthly" }

// БЕЗ проверки:
// 1. parsedDate = 2026-01-02 (будущее!)
// 2. getPastReferenceDate для monthly строит: 2025-10-02
// 3. daysAgo = 1 день → попадает в [1,7] → ОШИБОЧНО в past!
```

**Решение**:
```typescript
if (diffInCalendarDays(parsedDate, today) < 0) {
  continue; // originalDate в будущем → пропустить
}
```

**Логика**: Monthly/yearly события должны начать повторяться ТОЛЬКО ПОСЛЕ наступления их первой (оригинальной) даты.

### 2. Нормализация дня месяца

JavaScript автоматически "переполняет" даты:
```javascript
new Date(2025, 1, 31) // → 2025-03-03 (!)
```

Мы предотвращаем это через `Math.min()`:
```typescript
const normalizedDay = Math.min(eventDay, daysInMonth);
new Date(2025, 1, 28) // → 2025-02-28 ✓
```

### 3. Просроченные события только для recurrence: "none"

Повторяющиеся события (yearly/monthly) **никогда не бывают просроченными**, т.к. автоматически сдвигаются на следующее вхождение.

### 4. Мемоизация через useMemo

Хук использует `useMemo` с зависимостью от `events`:
```typescript
useMemo(() => groupEventsByMonth(events), [events])
```

Пересчет происходит только при изменении массива событий.

---

## Примеры сценариев

### Сценарий 1: Разовое событие (none)

```javascript
// Входные данные:
const event = {
  id: "1",
  title: "Конференция",
  originalDate: "2025-11-15",
  recurrence: "none"
};

const today = new Date("2025-10-10");

// Результат:
// actualEvents: [{ ...event, nextDate: "2025-11-15", year: 2025, month: 11, day: 15 }]
// overdueEvents: []

// ───────────────────────────────────

// Если today = 2025-11-16:
// actualEvents: []
// overdueEvents: [event] ✓ (прошло ≥1 день)
```

### Сценарий 2: Ежегодное событие (yearly)

```javascript
// Входные данные:
const event = {
  id: "2",
  title: "День рождения",
  originalDate: "1990-05-20",
  recurrence: "yearly"
};

const today = new Date("2025-10-10");

// Результат:
// Строится: 2025-05-20 (уже прошло)
// Сдвиг на: 2026-05-20
// actualEvents: [{ ...event, nextDate: "2026-05-20", year: 2026, month: 5, day: 20 }]

// ───────────────────────────────────

// Если today = 2025-04-10:
// Строится: 2025-05-20 (еще не наступило)
// actualEvents: [{ ...event, nextDate: "2025-05-20", year: 2025, month: 5, day: 20 }]
```

### Сценарий 3: Ежемесячное событие (monthly)

```javascript
// Входные данные:
const event = {
  id: "3",
  title: "Оплата",
  originalDate: "2025-01-05",
  recurrence: "monthly"
};

const today = new Date("2025-10-10");

// Результат:
// Строится: 2025-10-05 (уже прошло)
// Начало: 2025-11-05
// actualEvents: [
//   { nextDate: "2025-11-05", year: 2025, month: 11, day: 5 },
//   { nextDate: "2025-12-05", year: 2025, month: 12, day: 5 },
//   { nextDate: "2026-01-05", year: 2026, month: 1, day: 5 },
//   ... (всего 12 вхождений)
//   { nextDate: "2026-10-05", year: 2026, month: 10, day: 5 }
// ]
```

### Сценарий 4: Прошедшее событие (past window)

```javascript
// Входные данные:
const event = {
  id: "4",
  title: "Встреча",
  originalDate: "2025-10-05",
  recurrence: "yearly"
};

const today = new Date("2025-10-10");

// Проверка для past:
// referenceDate = 2025-10-05
// daysAgo = 5
// 5 >= 1 && 5 <= 7 → TRUE
// pastEvents: [event] ✓

// ───────────────────────────────────

// Если today = 2025-10-15:
// daysAgo = 10
// 10 <= 7 → FALSE
// pastEvents: [] (выпало из окна)
```

### Сценарий 5: Нормализация дня (31 → 28/29/30)

```javascript
// Входные данные:
const event = {
  id: "5",
  title: "Платеж 31 числа",
  originalDate: "2025-01-31",
  recurrence: "monthly"
};

const today = new Date("2025-10-10");

// Результат для февраля 2026:
// daysInMonth(2026, февраль) = 28
// normalizedDay = Math.min(31, 28) = 28
// nextDate: "2026-02-28" ✓

// Результат для апреля 2026:
// daysInMonth(2026, апрель) = 30
// normalizedDay = Math.min(31, 30) = 30
// nextDate: "2026-04-30" ✓
```

---

## История изменений

### Критические фиксы

**Защита от будущих событий в past (функция `buildPastEvents`)**: Добавлена проверка для предотвращения попадания будущих monthly/yearly событий в `pastEvents`.

**Проблема**: События с `originalDate` в будущем попадали в `past` из-за нормализации даты на текущий месяц/год.

**Решение**: Проверять `originalDate` ДО нормализации и пропускать, если событие еще не началось.

---

## Дополнительная информация

### Связанные файлы
- `types/events.ts` - типы данных
- `utils/date.ts` - утилиты работы с датами
- `utils/events.ts` - утилиты работы с событиями (isMonthly, isYearly, isNone)

### Используемые утилиты

| Функция | Описание |
|---------|----------|
| `parseDateSafe()` | Безопасный парсинг даты, возвращает null при ошибке |
| `formatDateToString()` | Форматирование Date в "YYYY-MM-DD" |
| `diffInCalendarDays()` | Разница в календарных днях (игнорируя время) |
| `isInPastWindow()` | Проверка попадания в окно прошедших дней |
| `getYear()`, `getMonth()`, `getDay()` | Извлечение компонентов даты |
| `getDaysInMonth()` | Количество дней в месяце |
| `ruMonthFormatter` | Форматирование месяца по-русски |

### Тестирование

Для тестирования можно установить фиксированную дату в функции `groupEventsByMonth`:
```typescript
// Заменить:
const today = new Date();

// На:
const today = new Date("2025-10-03");
```

---

**Последнее обновление**: 1 октября 2025

