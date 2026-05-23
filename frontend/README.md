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

Важно: для полной работы должен быть запущен backend на `http://localhost:4000`. CRA-прокси автоматически перенаправляет все `/api/*` запросы к backend, что необходимо для корректной работы httpOnly-cookies.

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
│   │   ├── AdminUsersPage/         # Страница администратора: список и удаление пользователей
│   │   │   └── AdminUsersPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── components/                 # UI и доменные компоненты
│   │   ├── ProtectedRoute/         # Guard для защищённых маршрутов
│   │   ├── AdminRoute/             # Guard для административных маршрутов (role === 'admin')
│   │   │   └── AdminRoute.tsx
│   │   ├── Events/
│   │   ├── Bookmarks/
│   │   ├── Header/
│   │   └── UI/
│   ├── hooks/                      # Данные и бизнес-логика уровня UI
│   │   └── useAuth.ts              # Доступ к AuthContext
│   ├── contexts/                   # Actions-контексты (CRUD + notify + refresh)
│   │   └── AuthContext.tsx         # Контекст аутентификации
│   ├── services/                   # API-клиент и инстансы сервисов
│   │   ├── authService.ts          # Вызовы auth API (login, register, refreshTokens, logoutServer, me)
│   │   ├── adminService.ts         # fetchUsers(), deleteUser(uid) — административные API
│   │   └── csrf.ts                 # readCsrfToken() — чтение csrf_token из cookie
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

**Защищённые маршруты** (требуют авторизацию; при её отсутствии — редирект на `/login`):
- `/` → `HomePage`
- `/events` → `EventsPage`
- `/bookmarks` → `BookmarksPage`
- `/bookmarks/favorites`, `/bookmarks/unsorted`, `/bookmarks/trash`
- `/bookmarks/category/:categoryId`
- `/bookmarks/tag/:tagId`
- edit-маршруты для bookmark-элементов (например, `:bookmarkId/edit`)

Все защищённые маршруты обёрнуты в `ProtectedRoute` — компонент-guard, который проверяет наличие авторизации.

**Административные маршруты** (требуют авторизацию + роль `admin`; иначе — редирект на `/`):
- `/admin/users` → `AdminUsersPage` (список пользователей, удаление)

Административные маршруты дополнительно обёрнуты в `AdminRoute` — guard внутри `ProtectedRoute`, который проверяет `user.role === 'admin'`.

Все неизвестные пути уходят в `NotFoundPage`.

## 🔌 Интеграция с backend

Текущие API-константы заданы в `src/constants/api.ts`:
- `API_BASE_URL = '/api'` — относительный URL (same-origin)
- `API_STATIC_BASE_URL = ''` — пустая строка (тот же origin)
- `API_BOOKMARKS_BASE_URL = '/api/bookmarks'`
- `API_EVENTS_BASE_URL = '/api/events'`
- `API_ADMIN_BASE_URL = '/api/admin'`

Все URL относительные — это обеспечивает одинаковое поведение в dev (через CRA-прокси) и production (backend на том же origin).

**CRA-прокси в dev:**  
В `package.json` задано `"proxy": "http://localhost:4000"`. CRA автоматически проксирует все запросы на `/api/*` к backend. Это необходимо для корректной работы `SameSite=Lax` httpOnly-cookies — браузер не отправляет cross-origin cookies в dev без прокси.

HTTP-слой:
- `src/services/ApiClient.ts` — общий клиент (`get/post/put/patch/delete`, timeout, нормализация ошибок). Автоматически добавляет заголовок `Authorization: Bearer <accessToken>`. При получении `401` вызывает `onAuthRefreshNeeded()` callback и повторяет запрос с новым токеном (защита от бесконечного цикла через флаг `isRetry`).
- `src/services/apiClients.ts` — готовые клиенты `eventsApiClient`, `bookmarksApiClient` и `adminApiClient`.
- `src/services/authService.ts` — методы `login`, `register`, `refreshTokens`, `logoutServer`, `fetchCurrentUser` для Auth API. Все запросы к `/api/auth/*` используют `credentials: 'include'` для передачи cookies.
- `src/services/adminService.ts` — методы `fetchUsers()` и `deleteUser(uid)` для Admin API. Использует `adminApiClient`.
- `src/services/csrf.ts` — утилита `readCsrfToken()`: читает значение cookie `csrf_token` (защита от SSR через проверку `typeof document`).

Ожидаемый формат успешного ответа backend (основной контракт):  
`{ data: ... }`

**Схема хранения токенов:**
- Access-токен хранится **только в памяти** (`useRef` в `AuthProvider`) — недоступен из localStorage и не отдаётся наружу через контекст
- Refresh-токен хранится в httpOnly-cookie — JS-код к нему не имеет доступа, передаётся браузером автоматически
- CSRF-токен хранится в читаемой (не httpOnly) cookie `csrf_token`; при вызове `/refresh` и `/logout` передаётся в заголовке `X-CSRF-Token`

## 🧠 Архитектура в 1 минуту

**Аутентификация и авторизация:**
```
AuthProvider (state: user, isLoading; accessTokenRef — только в памяти)
  └── AuthContext / useAuth()        # доступ к состоянию из любого компонента
       └── authService               # login/register/refreshTokens/logoutServer → API
ProtectedRoute                       # guard: нет авторизации → redirect /login
  └── AdminRoute                     # guard: role !== 'admin' → redirect /
ApiClient                            # Bearer access-токен в каждом запросе
                                     # 401 → refresh() → повтор запроса → logout при неудаче
```

Тип `User` содержит поля `role` (`'user' | 'admin'`) и `status` (`'active' | 'blocked'`). Эти поля
приходят с бэкенда при логине, регистрации и `/auth/me`. Роль никогда не хранится в JWT-payload —
`AuthProvider` получает её из ответа API и кладёт в `user` контекста. `adminApiClient` подключён к
тому же refresh-флоу, что и `eventsApiClient` / `bookmarksApiClient`.

**Token refresh flow:**
```
Запрос к API → 401 → ApiClient вызывает onAuthRefreshNeeded()
  → AuthProvider.refresh() → POST /auth/refresh + X-CSRF-Token
  → новый accessToken в памяти, новые cookies от сервера
  → повторный запрос с новым токеном
  (N параллельных 401 → 1 реальный запрос refresh через refreshPromiseRef)
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
- `../backend/docs/api-admin.md` — описание административных API-эндпоинтов (`GET /api/admin/users`, `DELETE /api/admin/users/:uid`).
- `docs/useGroupedEvents.md` — детальная документация по алгоритму группировки событий.
- `src/hooks/__tests__/README.md` — детали тестового покрытия `useGroupedEvents`.
- `docs/admin-section.md` — детальное описание административного раздела фронтенда.

---

## AI Task Context

Секция для AI-агента: что нужно знать, чтобы быстро и безопасно вносить изменения.

### 1) Где менять код по типу задачи

- Изменение UI страницы:
  - `src/pages/*`
  - `src/components/<Domain>/*`
- Аутентификация и авторизация:
  - `src/providers/AuthProvider.tsx` — state: user, isLoading; accessTokenRef (только в памяти); refresh/login/logout/register
  - `src/contexts/AuthContext.tsx` — React-контекст для AuthProvider
  - `src/hooks/useAuth.ts` — хук для доступа к AuthContext
  - `src/services/authService.ts` — API-вызовы (login, register, refreshTokens, logoutServer, fetchCurrentUser)
  - `src/services/csrf.ts` — readCsrfToken() для чтения csrf_token из cookie
  - `src/components/ProtectedRoute/ProtectedRoute.tsx` — guard для защищённых маршрутов
  - `src/components/AdminRoute/AdminRoute.tsx` — guard для административных маршрутов (role === 'admin')
- Административный раздел:
  - `src/pages/AdminUsersPage/AdminUsersPage.tsx` — таблица пользователей + удаление через Popconfirm
  - `src/services/adminService.ts` — fetchUsers(), deleteUser(uid)
  - `src/services/apiClients.ts` — adminApiClient (базовый URL: /api/admin)
- Загрузка данных (read-only):
  - `src/hooks/useEvents.ts`
  - `src/hooks/useBookmarks.ts`
- CRUD и API-мутации:
  - `src/hooks/useEventsActions.ts`
  - `src/hooks/useBookmarksActions.ts`
  - `src/contexts/EventsActionsContext.tsx`
  - `src/contexts/BookmarksActionsContext.tsx`
- HTTP-клиент и базовые API-настройки:
  - `src/services/ApiClient.ts` — `setOnAuthRefreshNeeded(cb)` для интеграции с AuthProvider
  - `src/services/apiClients.ts` — `eventsApiClient`, `bookmarksApiClient`, `adminApiClient`
  - `src/constants/api.ts` — относительные URL (`/api/...`), включая `API_ADMIN_BASE_URL`
- Типы:
  - `src/types/auth.ts` — `User` (с `role`/`status`), `UserRole`, `UserStatus`, `AdminUserListItem`, `AuthState`, `AuthResponse`
  - `src/types/events.ts`
  - `src/types/bookmarks.ts`
  - `src/types/errors.ts`

### 2) Контракты и инварианты

- Backend отвечает в форме `{ data: ... }`. Исключение: `DELETE` возвращает `204 No Content` с пустым телом — `ApiClient` обрабатывает это явно.
- Auth endpoints отвечают: `/login`, `/register` → `{ accessToken, user }`; `/refresh` → `{ accessToken }`; `/logout` → `204`. Не в форме `{ data }`.
- Admin endpoints: `GET /api/admin/users` → `{ data: { users: AdminUserListItem[] } }`; `DELETE /api/admin/users/:uid` → `204 No Content`. Требуют роль `admin` — при нехватке прав `403`.
- Тип `User` содержит `role` (`'user' | 'admin'`) и `status` (`'active' | 'blocked'`). Роль не хранится в JWT — всегда читается из БД на бэкенде.
- Ошибки API нормализуются через `ApiError` и `getApiErrorMessage`.
- После успешной мутации ожидается:
  - success notification;
  - `refresh...` для актуализации списков.
- Actions hooks не должны зависеть от UI; UI-эффекты лучше держать в contexts.
- Access-токен хранится **только в памяти** (`accessTokenRef` в `AuthProvider`). `ApiClient` получает токен через установленный заголовок, а не читает из localStorage. `token` и `refreshToken` **не отдаются наружу через `AuthContext`**.
- Получение `401` → `ApiClient` вызывает `onAuthRefreshNeeded()` → `AuthProvider.refresh()` → повтор запроса. При неудаче refresh → logout (чистка accessToken + `setUser(null)`).

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

Для задач по `Admin`:
1. `src/components/AdminRoute/AdminRoute.tsx`
2. `src/pages/AdminUsersPage/AdminUsersPage.tsx`
3. `src/services/adminService.ts`
4. `src/providers/AuthProvider.tsx` (раздел `adminApiClient`)
5. `../backend/docs/api-admin.md`

Для задач по API-контрактам:
1. `../backend/README.md`
2. `src/services/ApiClient.ts`
3. `src/constants/api.ts`

---

Последнее обновление: Май 2026 (этап 6: документация административного раздела)
