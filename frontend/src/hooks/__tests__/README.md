# Тесты для useGroupedEvents

## Описание

Комплексный набор unit-тестов для хука `useGroupedEvents`, покрывающий все критические сценарии группировки событий.

## Структура

```
hooks/
├── __tests__/
│   ├── useGroupedEvents.test.ts    # Основные тесты (46 тестов)
│   └── README.md                    # Эта документация
├── __tests-helpers__/
│   ├── testDataGenerator.helper.ts # Генераторы тестовых данных
│   └── testUtils.helper.ts          # Вспомогательные функции для тестов
├── useGroupedEvents.ts              # Тестируемый хук
└── useEvents.ts
```

## Запуск тестов

```bash
# Запуск всех тестов
npm test

# Запуск с покрытием
npm test -- --coverage

# Запуск в watch режиме
npm test -- --watch

# Запуск конкретного файла
npm test useGroupedEvents
```

## Покрытие тестами

### actualGroups (21 тест)
- ✅ Разовые события (recurrence: none)
- ✅ Ежегодные события (recurrence: yearly)
- ✅ Ежемесячные события (recurrence: monthly)
- ✅ Нормализация дня месяца (31 → 28/29/30)
- ✅ Переход года
- ✅ Структура и сортировка групп
- ✅ Форматирование labels и keys

### pastEvents (12 тестов)
- ✅ Границы окна (1-7 дней назад)
- ✅ **КРИТИЧЕСКАЯ ПРОВЕРКА**: будущие originalDate не попадают в past
- ✅ Сортировка (DESC по месяцу и дню)
- ✅ Поведение для yearly, monthly, none

### overdueEvents (7 тестов)
- ✅ Границы overdue (≥1 день назад)
- ✅ Только none события попадают в overdue
- ✅ Yearly и monthly никогда не просрочены

### Edge cases (6 тестов)
- ✅ Невалидные даты
- ✅ Високосный год (29 февраля)
- ✅ Переход года (31 декабря → 1 января)
- ✅ Множественные события одновременно

## Критические сценарии

### 1. Защита от будущих событий в past
```typescript
// today = 2025-10-03
// event = { originalDate: "2026-01-02", recurrence: "monthly" }
// Результат: НЕ должно попасть в past ✓
```

### 2. Нормализация дня месяца
```typescript
// 31 января → 28 февраля (не високосный)
// 31 января → 29 февраля (високосный)
// 31 мая → 30 июня
```

### 3. Границы окон
```typescript
// Past window: 1-7 дней назад
// Overdue: ≥1 день назад (только none)
```

### 4. Переход года для monthly
```typescript
// Генерируется 12 месяцев:
// окт, ноя, дек 2025 → янв, фев ... сен 2026
```

## Генераторы тестовых данных

### testDataGenerator.helper.ts

- `createEvent()` - создание тестового события
- `generateFutureOriginalDateEvents()` - критическая проверка
- `generatePastWindowBoundaryEvents()` - границы past
- `generateOverdueBoundaryEvents()` - границы overdue
- `generateDayNormalizationEvents()` - нормализация дней
- `generateYearTransitionEvents()` - переход года
- `generateLeapYearEvents()` - високосный год

### testUtils.helper.ts

- `hasEventWithId()` - проверка наличия события
- `findEventInGroups()` - поиск в группах
- `countEventOccurrences()` - подсчет вхождений
- `validateResultStructure()` - проверка структуры
- `createGroupsStructureSnapshot()` - snapshot групп

## Важные замечания

1. **Фиксированные даты в тестах**: Все тесты используют фиксированный параметр `today`, что делает их детерминированными и воспроизводимыми.

2. **Snapshot тестирование**: Используется выборочно, только для структуры групп, не для полных данных.

3. **None события**: Особенность - могут попадать одновременно и в `past` (если в окне 1-7 дней), и в `overdue` (если ≥1 день назад).

4. **Monthly события**: Всегда генерируют ровно 12 вхождений, начиная с ближайшего подходящего месяца.

## Обновление snapshot

Если изменилась логика группировки:

```bash
npm test -- -u
```

## Отладка

Используйте `debugResult()` из testUtils для вывода структуры результата:

```typescript
import { debugResult } from '../__tests-helpers__/testUtils.helper';

const result = groupEventsByMonth(events, today);
console.log(debugResult(result));
```

---

**Дата создания**: 1 октября 2025  
**Версия**: 1.0  
**Статус**: ✅ Все 46 тестов проходят успешно

