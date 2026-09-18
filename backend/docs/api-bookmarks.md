# API: Закладки

Базовый URL: `/api/bookmarks`. Все запросы требуют `Authorization: Bearer <accessToken>`.

## Контракты

`Bookmark`:
- `id: string`
- `categoryId: string | null`
- `url: string`
- `title: string`
- `preview: string` — относительный путь к файлу в `uploads/previews/` или `""`
- `description: string | null`
- `tags: string[]` — массив UID тегов
- `createdAt: string` — ISO datetime
- `updatedAt: string | null` — ISO datetime
- `transitionCounter: int (≥0)`
- `favorite: boolean`

`BookmarkCategory`:
- `id: string`
- `parentId: string | null` — `null` для коллекции (верхний уровень)
- `title: string`
- `icon: string | null`
- `position: int (≥0)`
- `amount: int` — закладок в категории, без учёта корзины
- `createdAt: string` — ISO datetime
- `updatedAt: string | null`

`BookmarkTag`:
- `id: string`
- `title: string`
- `amount: int` — закладок с этим тегом, без учёта корзины

## Закладки

#### GET /api/bookmarks → 200

**Response:** `{ data: Bookmark[] }` — без закладок в корзине
**Errors:** `500`

---

#### GET /api/bookmarks/unsorted → 200

**Response:** `{ data: Bookmark[] }` — `categoryId = null`, без корзины
**Errors:** `500`

---

#### GET /api/bookmarks/favorites → 200

**Response:** `{ data: Bookmark[] }` — `favorite = true`, без корзины
**Errors:** `500`

---

#### GET /api/bookmarks/trash → 200

**Response:** `{ data: (Bookmark & { inTrash: true })[] }`
**Notes:** `categoryId` при перемещении в корзину не изменяется.
**Errors:** `500`

---

#### GET /api/bookmarks/counts → 200

**Response:** `{ data: { all: int, favorites: int, unsorted: int, trash: int } }` — `all`, `favorites`, `unsorted` не учитывают корзину
**Errors:** `500`

---

#### GET /api/bookmarks/:id → 200

**Response:** `{ data: Bookmark }`
**Errors:** `400` некорректный id · `404` · `500`

---

#### POST /api/bookmarks → 201

**Body:** `{ url: string, categoryId?: string | null }`
**Response:** `{ success: true }`
**Errors:** `400` нет url / некорректный categoryId / категория не найдена · `500`
**Notes:** сервер парсит метаданные страницы (title, description, og:image) с browser User-Agent, скачивает превью (ресайз до 200×200, WebP, путь сохраняется в `preview`). Fallback — favicon. При ошибке загрузки превью закладка создаётся с `preview: ""`.

---

#### PUT /api/bookmarks/:id → 200

**Body:** `{ url: string, title: string, description?: string, categoryId: string, existingTagIds?: string[], newTagTitles?: string[], preview?: string, favorite?: boolean, inTrash?: boolean }`
**Response:** `{ success: true }`
**Errors:** `400` · `404` · `500`
**Notes:** теги пересоздаются атомарно в транзакции. `existingTagIds` — UID существующих тегов; `newTagTitles` — создаются и привязываются автоматически. Неизвестные UID пропускаются с предупреждением в лог.

---

#### PATCH /api/bookmarks/:id/trash → 200

**Body:** `{ inTrash: boolean }`
**Response:** `{ success: true }`
**Errors:** `400` некорректный id / inTrash не boolean · `404` · `500`
**Notes:** `categoryId` при перемещении в корзину не изменяется. Окончательное удаление — через `DELETE /api/bookmarks/:id`.

---

#### DELETE /api/bookmarks/:id → 200

**Response:** `{ success: true }`
**Errors:** `400` · `404` · `500`
**Notes:** удаляет файл превью с диска (если есть) и все связи с тегами (CASCADE).

---

## Категории

#### GET /api/bookmarks/categories → 200

**Response:** `{ data: BookmarkCategory[] }`
**Errors:** `500`

---

#### GET /api/bookmarks/categories/:id → 200

Возвращает закладки внутри категории, без корзины.

**Response:** `{ data: Bookmark[] }`
**Errors:** `400` некорректный id · `404` · `500`

---

#### POST /api/bookmarks/categories → 201

**Body:** `{ title: string, icon?: string, parentId?: string | null }`
**Response:** `{ success: true }`
**Errors:** `400` · `500`
**Notes:** `parentId = null` (или не передан) создаёт коллекцию; с `parentId` — вложенную категорию. `position` вычисляется автоматически как `MAX + 1` на том же уровне иерархии.

---

#### PATCH /api/bookmarks/categories/:id → 200

Частичное обновление — минимум одно поле.

**Body:** `{ title?: string, icon?: string | null }`
**Response:** `{ success: true }`
**Errors:** `400` некорректный id / пустой title / нет полей для обновления · `404` · `500`
**Notes:** `icon: null` удаляет иконку.

---

#### PATCH /api/bookmarks/categories/reorder → 200

Batch-обновление позиций и/или принадлежности коллекции. Атомарная транзакция: если хотя бы один id не найден — откат.

**Body:** `{ items: { id: string, position: int (≥0), parentId?: string }[] }`
**Response:** `{ success: true }`
**Errors:** `400` items не массив / некорректные поля · `404` id или parentId не найден · `500`

---

#### DELETE /api/bookmarks/categories/:id → 200

**Response:** `{ success: true }`
**Errors:** `400` коллекция с дочерними категориями / категория с закладками · `404` · `500`
**Notes:** тип определяется по `parentId`. Коллекцию нельзя удалить при наличии дочерних категорий; категорию — при наличии закладок.

---

## Теги

#### GET /api/bookmarks/tags → 200

**Response:** `{ data: BookmarkTag[] }`
**Errors:** `500`

---

#### GET /api/bookmarks/tags/:id → 200

Возвращает закладки с указанным тегом, без корзины.

**Response:** `{ data: Bookmark[] }`
**Errors:** `400` некорректный id · `404` · `500`

---

#### POST /api/bookmarks/tags → 201

**Body:** `{ title: string }`
**Response:** `{ success: true }`
**Errors:** `400` пустой title · `500`

---

#### PATCH /api/bookmarks/tags/:id → 200

**Body:** `{ title: string }`
**Response:** `{ success: true }`
**Errors:** `400` некорректный id / пустой title · `404` · `500`

---

#### DELETE /api/bookmarks/tags/:id → 200

**Response:** `{ success: true }`
**Errors:** `400` · `404` · `500`
**Notes:** удаляет все связи тега с закладками (CASCADE). Закладки не затрагиваются.
