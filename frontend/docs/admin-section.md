# Административный раздел

Пользователь с `role === 'admin'` видит пункт «Администратор» в шапке (`HeaderNavigation.tsx`) и имеет доступ к `/admin/users` — список и удаление пользователей. У роли `user` пункт скрыт; при прямом переходе срабатывает редирект на `/`.

## Роутинг

```
ProtectedRoute                # нет auth → /login
  └── AdminRoute              # role !== 'admin' → /
        └── /admin/users      # AdminUsersPage
```

`AdminRoute` (`src/components/AdminRoute/AdminRoute.tsx`) использует `useAuth()`. Пока `isLoading === true` — отображает центрированный `<Spin size="large" />`.

## Типы

`src/types/auth.ts`:

- `UserRole = 'user' | 'admin'`, `UserStatus = 'active' | 'blocked'`.
- `User: { uid, email, name: string | null, role: UserRole, status: UserStatus }` — приходит с бэкенда на `/login`, `/register`, `/auth/me`. Роль никогда не хранится в JWT-payload (бэкенд читает из БД, см. [architecture.md](../../backend/docs/architecture.md#система-аутентификации)).
- `AdminUserListItem extends User { created_at: string }`.

## HTTP-слой

`src/services/apiClients.ts`:

```ts
export const adminApiClient = new ApiClient({ baseURL: API_ADMIN_BASE_URL });
// API_ADMIN_BASE_URL = '/api/admin'
```

`AuthProvider` регистрирует клиент через `setAccessTokenOnClients` / `clearAccessTokenOnClients` и подключает к общему refresh-флоу через `setOnAuthRefreshNeeded(refresh)` — тот же, что используется для `eventsApiClient` и `bookmarksApiClient`.

## Сервис

`src/services/adminService.ts`:

| Функция | Метод | URL | Возвращает |
|---|---|---|---|
| `fetchUsers()` | GET | `/api/admin/users` | `AdminUserListItem[]` |
| `deleteUser(uid)` | DELETE | `/api/admin/users/:uid` | `void` (204) |

Бэкенд отдаёт `{ data: { users: [...] } }`; `ApiClient` разворачивает `data`, поэтому `adminApiClient.get<{ users: ... }>('/users')` возвращает `{ users: [...] }`.

API-контракты: [`../../backend/docs/api-admin.md`](../../backend/docs/api-admin.md).

## AdminUsersPage

`src/pages/AdminUsersPage/AdminUsersPage.tsx`:

- Загружает список при монтировании через `fetchUsers()`.
- Ant Design таблица: Email, Имя, Роль, Статус, Создан, Действия.
- В «Действия» — кнопка «Удалить» внутри `Popconfirm`. После подтверждения вызывает `deleteUser(uid)` и перезагружает список.
- Ошибки — `message.error`.

## Ограничения

- Смена роли/статуса — только через CLI: `node backend/scripts/set-role.js <email> <field> <value>`.
- Нет ограничений «нельзя удалить себя» или «нельзя удалить последнего админа» (намеренно, `allow_all` в требованиях).
- `status === 'blocked'` отображается, но вход в приложение не блокирует — отдельная задача.
