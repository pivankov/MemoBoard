# MemoBoard Frontend

Frontend-часть MemoBoard (React + TypeScript) для трёх доменов:
- `Auth` (аутентификация: вход, регистрация, защита маршрутов)
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
│   ├── pages/                      # Страницы
│   │   ├── LoginPage.tsx           # Форма входа (публичная)
│   │   ├── RegisterPage.tsx        # Форма регистрации (публичная)
│   │   ├── HomePage.tsx
│   │   ├── EventsPage.tsx
│   │   ├── BookmarksPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── components/                 # UI и доменные компоненты
│   │   ├── ProtectedRoute/         # Guard для защищённых маршрутов
│   │   ├── Events/
│   │   ├── Bookmarks/
│   │   ├── Header/
│   │   └── UI/
│   ├── hooks/                      # Данные и бизнес-логика уровня UI
│   │   └── useAuth.ts              # Доступ к AuthContext
│   ├── contexts/                   # Actions-контексты (CRUD + notify + refresh)
│   │   └── AuthContext.tsx         # Контекст аутентификации
│   ├── services/                   # API-клиент и инстансы сервисов
│   │   └── authService.ts          # Вызовы auth API (login, register, me)
│   ├── providers/                  # Глобальные провайдеры
│   │   └── AuthProvider.tsx        # Провайдер состояния аутентификации
│   ├── constants/                  # API и доменные константы
│   ├── types/                      # Типы доменов и ошибок
│   ├── enums/                      # Перечисления (EventType, Recurrence и др.)
│   ├── utils/                      # Утилиты
│   └── layouts/                    # Layout-компоненты
└── docs/                           # Детальные документы по подсистемам
```

## 🧭 Роутинг (кратко)

Роутинг описан в `src/App.tsx`. Маршруты делятся на **публичные** и **защищённые**.

**Публичные маршруты** (доступны без авторизации):
- `/login` → `LoginPage`
- `/register` → `RegisterPage`

**Защищённые маршруты** (требуют JWT-токен; при его отсутствии — редирект на `/login`):
- `/` → `HomePage`
- `/events` → `EventsPage`
- `/bookmarks` → `BookmarksPage`
- `/bookmarks/favorites`, `/bookmarks/unsorted`, `/bookmarks/trash`
- `/bookmarks/category/:categoryId`
- `/bookmarks/tag/:tagId`
- edit-маршруты для bookmark-элементов (например, `:bookmarkId/edit`)

Все защищённые маршруты обёрнуты в `ProtectedRoute` — компонент-guard, который проверяет наличие авторизации.

Все неизвестные пути уходят в `NotFoundPage`.

## 🔌 Интеграция с backend

Текущие API-константы заданы в `src/constants/api.ts`:
- `API_STATIC_BASE_URL = http://localhost:4000`
- `API_BOOKMARKS_BASE_URL = http://localhost:4000/api/bookmarks`
- `API_EVENTS_BASE_URL = http://localhost:4000/api/events`

HTTP-слой:
- `src/services/ApiClient.ts` — общий клиент (`get/post/put/patch/delete`, timeout, нормализация ошибок). Автоматически добавляет заголовок `Authorization: Bearer <token>` из localStorage ко всем запросам.
- `src/services/apiClients.ts` — готовые клиенты `eventsApiClient` и `bookmarksApiClient`.
- `src/services/authService.ts` — методы `login`, `register`, `me` для Auth API.

Ожидаемый формат успешного ответа backend (основной контракт):  
`{ data: ... }`

**JWT и хранение токена:**
- Токен хранится в `localStorage` под ключом `token`
- При каждом запросе `ApiClient` читает токен из localStorage и добавляет заголовок `Authorization: Bearer <token>`
- При получении `401` от backend — `ApiClient` автоматически удаляет токен и инициирует logout (редирект на `/login`)

## 🧠 Архитектура в 1 минуту

**Аутентификация:**
```
AuthProvider (state: user, token, isLoading)
  └── AuthContext / useAuth()        # доступ к состоянию из любого компонента
       └── authService               # login/register/me → API
ProtectedRoute                       # guard: нет токена → redirect /login
ApiClient                            # Bearer-токен в каждом запросе, 401 → logout
```

Два самостоятельных потока данных:

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
- Аутентификация и авторизация:
  - `src/providers/AuthProvider.tsx` — state: user, token, login/logout/register
  - `src/contexts/AuthContext.tsx` — React-контекст для AuthProvider
  - `src/hooks/useAuth.ts` — хук для доступа к AuthContext
  - `src/services/authService.ts` — API-вызовы (login, register, me)
  - `src/components/ProtectedRoute/ProtectedRoute.tsx` — guard для защищённых маршрутов
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
- Auth endpoints (`/api/auth/*`) отвечают в форме `{ token, user }` или `{ user }` — не в форме `{ data }`.
- Ошибки API нормализуются через `ApiError` и `getApiErrorMessage`.
- После успешной мутации ожидается:
  - success notification;
  - `refresh...` для актуализации списков.
- Actions hooks не должны зависеть от UI; UI-эффекты лучше держать в contexts.
- JWT-токен хранится в `localStorage`. `ApiClient` автоматически читает его при каждом запросе. Получение `401` → logout (удаление токена + редирект на `/login`).

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

Для задач по `Auth`:
1. `src/providers/AuthProvider.tsx`
2. `src/contexts/AuthContext.tsx`
3. `src/services/authService.ts`
4. `src/components/ProtectedRoute/ProtectedRoute.tsx`
5. `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`

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
