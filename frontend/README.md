# MemoBoard Frontend

React 19 + TypeScript SPA. Три домена: Auth (вход/регистрация/guard'ы), Events (события календаря), Bookmarks (закладки, категории, теги, корзина).

## Стек

React 19, TypeScript 4.9, Ant Design 5, React Router 7, Jest + Testing Library, ESLint.

## Установка и запуск

```bash
npm install
npm start              # dev server на http://localhost:3000
npm run build          # production-сборка → backend/public/
npm test               # тесты в watch-режиме
npm run test:all       # все тесты разово
npm run lint           # lint:fix для автофикса
```

В dev требуется запущенный backend на `http://localhost:4000` — CRA-прокси (`"proxy"` в `package.json`) перенаправляет `/api/*` к backend. Это нужно для same-origin поведения httpOnly-cookies.

## Структура

```text
frontend/
├── src/
│   ├── App.tsx                     # Router и верхнеуровневые провайдеры
│   ├── index.tsx                   # Точка входа, ConfigProvider (antd)
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── EventsPage.tsx
│   │   ├── BookmarksPage.tsx
│   │   ├── AdminUsersPage/
│   │   └── NotFoundPage.tsx
│   ├── components/
│   │   ├── ProtectedRoute/         # guard: нет auth → /login
│   │   ├── AdminRoute/             # guard: role !== 'admin' → /
│   │   ├── Events/
│   │   ├── Bookmarks/
│   │   ├── Header/
│   │   └── UI/
│   ├── hooks/
│   │   ├── useAuth.ts              # доступ к AuthContext
│   │   ├── useEvents.ts            # read: список событий
│   │   ├── useEventsActions.ts     # CRUD-запросы для событий
│   │   ├── useGroupedEvents.ts     # → docs/useGroupedEvents.md
│   │   ├── useBookmarks.ts
│   │   └── useBookmarksActions.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── EventsActionsContext.tsx
│   │   └── BookmarksActionsContext.tsx
│   ├── services/
│   │   ├── ApiClient.ts            # общий HTTP-клиент (Bearer, 401-refresh, нормализация ошибок)
│   │   ├── apiClients.ts           # eventsApiClient, bookmarksApiClient, adminApiClient
│   │   ├── authService.ts          # login/register/refreshTokens/logoutServer/fetchCurrentUser
│   │   ├── adminService.ts         # fetchUsers, deleteUser
│   │   └── csrf.ts                 # readCsrfToken()
│   ├── providers/
│   │   └── AuthProvider.tsx        # state user/isLoading; accessTokenRef в памяти
│   ├── constants/
│   ├── types/
│   ├── enums/
│   ├── utils/
│   └── layouts/
└── docs/                           # → docs/useGroupedEvents.md, docs/admin-section.md
```

## Роутинг

Описан в `src/App.tsx`.

- Публичные: `/login`, `/register`.
- Защищённые (`ProtectedRoute`): `/`, `/events`, `/bookmarks`, `/bookmarks/favorites|unsorted|trash`, `/bookmarks/category/:categoryId`, `/bookmarks/tag/:tagId`, edit-маршруты bookmark-элементов.
- Административные (`ProtectedRoute` + `AdminRoute`, требуют `role === 'admin'`): `/admin/users`.
- Все неизвестные пути — `NotFoundPage`.

## Интеграция с backend

API-константы — `src/constants/api.ts`. Все URL относительные (`/api/...`) — одинаковое поведение в dev (через CRA-прокси) и production (backend раздаёт SPA из `backend/public/`).

HTTP-слой:
- `ApiClient` автоматически добавляет `Authorization: Bearer <accessToken>`. При `401` вызывает `onAuthRefreshNeeded()` и повторяет запрос (флаг `isRetry` против бесконечного цикла).
- `eventsApiClient`, `bookmarksApiClient`, `adminApiClient` подключены к одному refresh-флоу через `setOnAuthRefreshNeeded(refresh)` в `AuthProvider`.
- `authService` к `/api/auth/*` ходит с `credentials: 'include'`.

Формат успешного ответа: `{ data: ... }`. Исключения:
- Auth: `/login`, `/register` → `{ accessToken, user }`; `/refresh` → `{ accessToken }`; `/logout` → `204`.
- `DELETE` → `204 No Content` (обрабатывается `ApiClient` явно).

Хранение токенов: access — только в памяти (`accessTokenRef` в `AuthProvider`, не отдаётся через `AuthContext`); refresh — в httpOnly-cookie; CSRF — в читаемой cookie `csrf_token`, передаётся в `X-CSRF-Token` при `/refresh` и `/logout`. Полная схема — [backend/docs/architecture.md](../backend/docs/architecture.md#система-аутентификации).

## Архитектура потоков данных

Read: `page → components → useEvents/useBookmarks → ApiClient → backend`.

Write: `components → ActionsContext → useEventsActions/useBookmarksActions → ApiClient → backend`.

Роли слоёв:
- `useEvents`/`useBookmarks` — загрузка и локальный state, без UI-эффектов.
- `useEventsActions`/`useBookmarksActions` — только API-вызовы.
- `EventsActionsContext`/`BookmarksActionsContext` — оборачивают CRUD в notify + централизованную обработку ошибок + вызов `refresh...` после мутации.

## Проверка изменений

1. `npm run lint`
2. `npm run test:all` или релевантные тесты.
3. Smoke-check: открываются `/events` и `/bookmarks`; CRUD-сценарий; уведомления показываются; список обновляется после мутации.

## Связанные документы

- [`docs/useGroupedEvents.md`](./docs/useGroupedEvents.md) — алгоритм группировки и классификации событий.
- [`docs/admin-section.md`](./docs/admin-section.md) — административный раздел.
- [`../backend/docs/api-auth.md`](../backend/docs/api-auth.md), [`api-events.md`](../backend/docs/api-events.md), [`api-bookmarks.md`](../backend/docs/api-bookmarks.md), [`api-admin.md`](../backend/docs/api-admin.md) — API-контракты.
- [`src/hooks/__tests__/README.md`](./src/hooks/__tests__/README.md) — тесты `useGroupedEvents`.

## AI Task Context

### Контракты и инварианты

- Backend отвечает `{ data: ... }`, кроме auth-эндпоинтов (см. выше) и `DELETE` (`204`). Ошибки нормализованы через `ApiError` / `getApiErrorMessage`.
- `User` содержит `role: 'user' | 'admin'` и `status: 'active' | 'blocked'`. Роль читается из БД на каждый запрос (не из JWT-payload).
- Access-токен — только в `accessTokenRef`, наружу через `AuthContext` не отдаётся. На `401` `ApiClient` инициирует refresh; при провале refresh → logout (`setUser(null)`).
- После мутации: success notification + `refresh...` для актуализации списка.
- Слои не смешивать: fetch/state — отдельно от UI-уведомлений (последние — в context).

### Где менять и что читать по задаче

| Задача | Точка изменения | Читать в первую очередь |
|---|---|---|
| Auth | `providers/AuthProvider.tsx`, `contexts/AuthContext.tsx`, `services/authService.ts`, `services/csrf.ts`, `components/ProtectedRoute/`, `components/AdminRoute/` | `AuthProvider.tsx` → `AuthContext.tsx` → `authService.ts` → `ProtectedRoute.tsx` → `LoginPage.tsx`/`RegisterPage.tsx` |
| Events (read) | `hooks/useEvents.ts` | `EventsPage.tsx` → `Events.tsx` → `useEvents.ts` |
| Events (CRUD) | `hooks/useEventsActions.ts`, `contexts/EventsActionsContext.tsx` | `useEventsActions.ts` → `EventsActionsContext.tsx` |
| Группировка событий | `hooks/useGroupedEvents.ts` | `docs/useGroupedEvents.md` |
| Bookmarks (read) | `hooks/useBookmarks.ts` | `BookmarksPage.tsx` → `Bookmarks.tsx` → `useBookmarks.ts` |
| Bookmarks (CRUD) | `hooks/useBookmarksActions.ts`, `contexts/BookmarksActionsContext.tsx` | `useBookmarksActions.ts` → `BookmarksActionsContext.tsx` |
| Admin | `pages/AdminUsersPage/`, `services/adminService.ts`, `components/AdminRoute/` | `docs/admin-section.md` → `../backend/docs/api-admin.md` |
| HTTP-слой / новый эндпоинт | `services/ApiClient.ts`, `services/apiClients.ts`, `constants/api.ts` | `ApiClient.ts` → `apiClients.ts` → `constants/api.ts` |
| UI страницы | `pages/*`, `components/<Domain>/*` | — |
| Типы | `types/auth.ts`, `types/events.ts`, `types/bookmarks.ts`, `types/errors.ts` | — |

### Добавление нового API-метода

1. Сигнатуру и URL — в соответствующий `*Service.ts` / actions-hook.
2. При необходимости обернуть в context для notify + refresh.
3. Обновить типы в `src/types/*`.
4. Сохранять стиль обработки ошибок: user-friendly сообщение + `console.error`.
