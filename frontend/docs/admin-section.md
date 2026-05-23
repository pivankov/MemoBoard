# Административный раздел фронтенда

Описание архитектуры и контрактов административного раздела MemoBoard.

---

## Обзор

Административный раздел позволяет пользователю с ролью `admin` просматривать список всех
зарегистрированных пользователей и удалять их (вместе со всеми связанными данными).

Пользователи с ролью `user` не видят раздел в навигации и при прямом переходе на `/admin/users`
получают редирект на `/`.

---

## Роутинг

```
ProtectedRoute                 # нет auth → /login
  └── /admin  (AdminRoute)     # role !== 'admin' → /
        └── /admin/users       # AdminUsersPage
```

`AdminRoute` — компонент-guard, расположенный в `src/components/AdminRoute/AdminRoute.tsx`.
Использует `useAuth()` из `AuthContext`. Пока идёт начальная загрузка (`isLoading === true`) —
отображает спиннер `<Spin size="large" />` по центру экрана.

---

## Тип `User` и связанные типы

Файл: `src/types/auth.ts`

```ts
export type UserRole   = 'user' | 'admin';
export type UserStatus = 'active' | 'blocked';

export interface User {
  uid:    string;
  email:  string;
  name:   string | null;
  role:   UserRole;
  status: UserStatus;
}

/** Расширение User для административного списка */
export interface AdminUserListItem extends User {
  created_at: string;
}
```

Поля `role` и `status` присутствуют в `User` всегда — они возвращаются бэкендом при `/login`,
`/register` и `/auth/me`. Роль **никогда не хранится в JWT-payload**: бэкенд читает её из БД на
каждый запрос (в `requireAuth`).

---

## HTTP-клиент

Файл: `src/services/apiClients.ts`

```ts
export const adminApiClient = new ApiClient({ baseURL: API_ADMIN_BASE_URL });
// API_ADMIN_BASE_URL = '/api/admin'  (src/constants/api.ts)
```

`adminApiClient` зарегистрирован в `AuthProvider` наравне с `eventsApiClient` и `bookmarksApiClient`:

- `setAccessTokenOnClients(token)` — устанавливает `Authorization: Bearer <token>` на все три клиента.
- `clearAccessTokenOnClients()` — убирает заголовок при logout.
- `useEffect` с `setOnAuthRefreshNeeded(refresh)` — при `401` запускает единый refresh-флоу и
  повторяет исходный запрос с новым токеном.

---

## Сервис

Файл: `src/services/adminService.ts`

| Функция | Метод | URL | Возвращает |
|---|---|---|---|
| `fetchUsers()` | GET | `/api/admin/users` | `AdminUserListItem[]` |
| `deleteUser(uid)` | DELETE | `/api/admin/users/:uid` | `void` (204) |

Бэкенд отдаёт список в обёртке `{ data: { users: [...] } }`. `ApiClient` разворачивает `data`
автоматически, поэтому `adminApiClient.get<{ users: ... }>('/users')` возвращает `{ users: [...] }`.

---

## Страница `AdminUsersPage`

Файл: `src/pages/AdminUsersPage/AdminUsersPage.tsx`

- Загружает список при монтировании через `adminService.fetchUsers()`.
- Отображает таблицу Ant Design со столбцами: Email, Имя, Роль, Статус, Создан, Действия.
- Столбец «Действия» содержит кнопку «Удалить» внутри `Popconfirm` с предупреждением о
  необратимости операции.
- После подтверждения вызывает `adminService.deleteUser(uid)`, затем перезагружает список.
- Ошибки загрузки и удаления показываются через `message.error`.

---

## Навигация в шапке

Файл: `src/components/Header/HeaderNavigation.tsx`

Массив пунктов навигации формируется через `useMemo`. Пункт «Администратор» (иконка
`SettingOutlined`, путь `admin/users`) добавляется только если `user?.role === 'admin'`.

---

## API-контракты (краткая сводка)

Подробнее: `backend/docs/api-admin.md`.

**`GET /api/admin/users`**

Требования: `Authorization: Bearer <adminToken>`.

```json
{
  "data": {
    "users": [
      {
        "uid": "abc123",
        "email": "user@example.com",
        "name": "Иван",
        "role": "user",
        "status": "active",
        "created_at": "2025-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

**`DELETE /api/admin/users/:uid`**

Требования: `Authorization: Bearer <adminToken>`.

- `204 No Content` — пользователь удалён (каскад БД + файлы превью на диске).
- `404` — пользователь не найден.
- `403` — вызывающий не является администратором.

---

## Безопасность и ограничения

- Смена роли/статуса доступна только через CLI-скрипт `backend/scripts/set-role.js`.
- Нет ограничений «нельзя удалить себя» или «нельзя удалить последнего админа» — это сделано
  намеренно (`allow_all` в требованиях).
- `status === 'blocked'` отображается в таблице, но не блокирует вход в приложение (отдельная задача).
