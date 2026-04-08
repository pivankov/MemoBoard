# MemoBoard Frontend

Frontend-часть MemoBoard (React + TypeScript) для двух доменов:
- `Events` (календарные события с повторениями)
- `Bookmarks` (менеджмент закладок, категорий, тегов, корзины)

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- npm

### Установка и запуск

```bash
npm install
npm start
```

Frontend запускается на `http://localhost:3000`.

Важно: для полной работы должен быть запущен backend на `http://localhost:4000`.

### Полезные команды

```bash
# dev server
npm start

# production build → заменяет содержимое backend/public/
npm run build

# тесты
npm test
npm run test:all

# линтер
npm run lint
npm run lint:fix
```

## 🧱 Технологии

- React 19
- TypeScript 4.9
- Ant Design 5
- React Router 7
- Jest + Testing Library
- ESLint

## 📁 Структура фронтенда

```text
frontend/
├── src/
│   ├── App.tsx                     # Router и верхнеуровневые провайдеры
│   ├── index.tsx                   # Точка входа, ConfigProvider (antd)
│   ├── pages/                      # Страницы (EventsPage, BookmarksPage, ...)
│   ├── components/                 # UI и доменные компоненты
│   │   ├── Events/
│   │   ├── Bookmarks/
│   │   ├── Header/
│   │   └── UI/
│   ├── hooks/                      # Данные и бизнес-логика уровня UI
│   ├── contexts/                   # Actions-контексты (CRUD + notify + refresh)
│   ├── services/                   # API-клиент и инстансы сервисов
│   ├── providers/                  # Глобальные провайдеры (уведомления)
│   ├── constants/                  # API и доменные константы
│   ├── types/                      # Типы доменов и ошибок
│   ├── enums/                      # Перечисления (EventType, Recurrence и др.)
│   ├── utils/                      # Утилиты
│   └── layouts/                    # Layout-компоненты
└── docs/                           # Детальные документы по подсистемам
```

## 🧭 Роутинг (кратко)

Роутинг описан в `src/App.tsx`.

- `/` -> `HomePage`
- `/events` -> `EventsPage`
- `/bookmarks` -> `BookmarksPage`
- `/bookmarks/favorites`, `/bookmarks/unsorted`, `/bookmarks/trash`
- `/bookmarks/category/:categoryId`
- `/bookmarks/tag/:tagId`
- edit-маршруты для bookmark-элементов (например, `:bookmarkId/edit`)

Все неизвестные пути уходят в `NotFoundPage`.

## 🔌 Интеграция с backend

Текущие API-константы заданы в `src/constants/api.ts`:
- `API_STATIC_BASE_URL = http://localhost:4000`
- `API_BOOKMARKS_BASE_URL = http://localhost:4000/api/bookmarks`
- `API_EVENTS_BASE_URL = http://localhost:4000/api/events`

HTTP-слой:
- `src/services/ApiClient.ts` — общий клиент (`get/post/put/patch/delete`, timeout, нормализация ошибок).
- `src/services/apiClients.ts` — готовые клиенты `eventsApiClient` и `bookmarksApiClient`.

Ожидаемый формат успешного ответа backend (основной контракт):  
`{ data: ... }`

## 🧠 Архитектура в 1 минуту

Два самостоятельных потока:

**Read (чтение):**
`page -> components -> useEvents/useBookmarks -> services(ApiClient) -> backend`

**Write (мутации):**
`components -> ActionsContext -> useEventsActions/useBookmarksActions -> services(ApiClient) -> backend`

Слои и их роли:
- `useEvents`/`useBookmarks` — загрузка данных и локальный state; не содержат UI-эффектов.
- `useEventsActions`/`useBookmarksActions` — CRUD-запросы; только API, никаких уведомлений.
- `EventsActionsContext`/`BookmarksActionsContext` — оркестрация: оборачивают CRUD в:
  - уведомления через `NotificationsProvider`;
  - централизованную обработку ошибок;
  - вызов `refresh...` после успешных изменений.

Такое разделение помогает:
- изолировать API-вызовы от UI-компонентов;
- держать единый UX успеха/ошибок;
- уменьшить дублирование логики после мутаций.

## ✅ Проверка изменений (минимум)

После изменения фронтенда:

1. `npm run lint`
2. `npm run test:all` (или минимум релевантные тесты)
3. Ручной smoke-check:
   - открываются `/events` и `/bookmarks`;
   - CRUD-сценарий в измененном домене;
   - уведомления об успехе/ошибке показываются корректно;
   - список обновляется после мутации.

## 📚 Дополнительная документация

- `../backend/README.md` — API reference и backend-контракты.
- `docs/useGroupedEvents.md` — детальная документация по алгоритму группировки событий.
- `src/hooks/__tests__/README.md` — детали тестового покрытия `useGroupedEvents`.

---

## AI Task Context

Секция для AI-агента: что нужно знать, чтобы быстро и безопасно вносить изменения.

### 1) Где менять код по типу задачи

- Изменение UI страницы:
  - `src/pages/*`
  - `src/components/<Domain>/*`
- Загрузка данных (read-only):
  - `src/hooks/useEvents.ts`
  - `src/hooks/useBookmarks.ts`
- CRUD и API-мутации:
  - `src/hooks/useEventsActions.ts`
  - `src/hooks/useBookmarksActions.ts`
  - `src/contexts/EventsActionsContext.tsx`
  - `src/contexts/BookmarksActionsContext.tsx`
- HTTP-клиент и базовые API-настройки:
  - `src/services/ApiClient.ts`
  - `src/services/apiClients.ts`
  - `src/constants/api.ts`
- Типы:
  - `src/types/events.ts`
  - `src/types/bookmarks.ts`
  - `src/types/errors.ts`

### 2) Контракты и инварианты

- Backend отвечает в форме `{ data: ... }`. Исключение: `DELETE` возвращает `204 No Content` с пустым телом — `ApiClient` обрабатывает это явно.
- Ошибки API нормализуются через `ApiError` и `getApiErrorMessage`.
- После успешной мутации ожидается:
  - success notification;
  - `refresh...` для актуализации списков.
- Actions hooks не должны зависеть от UI; UI-эффекты лучше держать в contexts.

### 3) Правила безопасных изменений

- Не смешивать в одном слое:
  - fetch/state-загрузку и
  - UI-уведомления/оркестрацию.
- При добавлении нового API-метода:
  1. добавить вызов в actions hook;
  2. при необходимости обернуть в context для notify + refresh;
  3. обновить типы в `src/types/*`.
- Сохранять существующий стиль обработки ошибок (user-friendly сообщение + console.error).

### 4) Быстрый Definition of Done для AI-задачи

- Изменение собрано без TS/ESLint-ошибок.
- Функционально проверен релевантный сценарий в браузере.
- Не нарушены контракты ответа backend.
- Обновлена документация, если изменены архитектурные договоренности.

### 5) Что читать в первую очередь (экономия токенов)

Для задач по `Events`:
1. `src/pages/EventsPage.tsx`
2. `src/components/Events/Events.tsx`
3. `src/hooks/useEvents.ts`
4. `src/hooks/useEventsActions.ts`
5. `src/contexts/EventsActionsContext.tsx`
6. `src/hooks/useGroupedEvents.ts` + `docs/useGroupedEvents.md` — если задача касается логики группировки/классификации событий

Для задач по `Bookmarks`:
1. `src/pages/BookmarksPage.tsx`
2. `src/components/Bookmarks/Bookmarks.tsx`
3. `src/hooks/useBookmarks.ts`
4. `src/hooks/useBookmarksActions.ts`
5. `src/contexts/BookmarksActionsContext.tsx`

Для задач по API-контрактам:
1. `../backend/README.md`
2. `src/services/ApiClient.ts`
3. `src/constants/api.ts`

---

Последнее обновление: Апрель 2026
