# API: События

Базовый URL: `/api/events`. Все запросы требуют `Authorization: Bearer <accessToken>`.

## Контракты

`Event`:
- `id: string`
- `title: string`
- `originalDate: string` — ISO datetime
- `nextDate: string` — ISO datetime или `""` если не вычислен
- `type: 'birthday' | 'holiday' | 'anniversary' | 'other'`
- `description: string | null`
- `recurrence: 'none' | 'monthly' | 'yearly'`

## Эндпоинты

#### GET /api/events → 200

**Response:** `{ data: Event[] }`
**Errors:** `500`

---

#### GET /api/events/:id → 200

**Response:** `{ data: Event }`
**Errors:** `400` некорректный id · `404` · `500`

---

#### POST /api/events → 201

**Body:** `{ title: string, originalDate: string (ISO или YYYY-MM-DD), type: 'birthday' | 'holiday' | 'anniversary' | 'other', description?: string, recurrence?: 'none' | 'monthly' | 'yearly' (default: 'none') }`
**Response:** `{ data: Event }`
**Errors:** `400` некорректные данные · `500`

---

#### PUT /api/events/:id → 200

Полная замена события — все поля обязательны.

**Body:** `{ title: string, originalDate: string, type: string, description: string, recurrence: string }`
**Response:** `{ data: Event }`
**Errors:** `400` · `404` · `500`

---

#### DELETE /api/events/:id → 204

**Response:** 204 No Content
**Errors:** `400` некорректный id · `404` · `500`
