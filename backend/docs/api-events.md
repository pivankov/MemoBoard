# API: События (Events)

### События (Events)

#### GET /api/events

Получает список всех событий.

**Ответ (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b",
      "title": "День рождения",
      "originalDate": "2024-06-13T00:00:00Z",
      "nextDate": "",
      "type": "birthday",
      "description": "Важное событие",
      "recurrence": "yearly"
    }
  ]
}
```

**Ошибки:**
- `500` - Не удалось получить список событий

---

#### GET /api/events/:id

Получает событие по уникальному идентификатору.

**Параметры:**
- `id` (string, required) - UID события

**Ответ (200):**
```json
{
  "data": {
    "id": "550e8400-e29b",
    "title": "День рождения",
    "originalDate": "2024-06-13T00:00:00Z",
    "nextDate": "",
    "type": "birthday",
    "description": "Важное событие",
    "recurrence": "yearly"
  }
}
```

**Ошибки:**
- `400` - Некорректный идентификатор события
- `404` - Событие не найдено
- `500` - Не удалось получить событие

---

#### POST /api/events

Создает новое событие.

**Тело запроса:**
```json
{
  "title": "День рождения",
  "originalDate": "2024-06-13",
  "type": "birthday",
  "description": "Важное событие",
  "recurrence": "yearly"
}
```

**Поля:**
- `title` (string, required) - Название события
- `originalDate` (string, required) - Дата в формате ISO или `YYYY-MM-DD`
- `type` (string, required) - Тип события (birthday, holiday, anniversary, other)
- `description` (string, optional) - Описание события
- `recurrence` (string, optional) - Повторение: `none`, `monthly`, `yearly` (по умолчанию `none`)

**Ответ (201):**
```json
{
  "data": {
    "id": "550e8400-e29b",
    "title": "День рождения",
    "originalDate": "2024-06-13T00:00:00Z",
    "type": "birthday",
    "description": "Важное событие",
    "recurrence": "yearly"
  }
}
```

**Ошибки:**
- `400` - Некорректные данные (заголовок, дата, тип или recurrence)
- `500` - Не удалось создать событие

---

#### PUT /api/events/:id

Обновляет существующее событие.

**Параметры:**
- `id` (string, required) - UID события

**Тело запроса:**
```json
{
  "title": "День рождения (обновлено)",
  "originalDate": "2024-06-13",
  "type": "birthday",
  "description": "Обновленное описание",
  "recurrence": "yearly"
}
```

**Поля:** (все обязательны)
- `title` (string) - Название события
- `originalDate` (string) - Дата в формате ISO или `YYYY-MM-DD`
- `type` (string) - Тип события
- `description` (string) - Описание события (может быть пустой строкой)
- `recurrence` (string) - Повторение: `none`, `monthly`, `yearly`

**Ответ (200):**
```json
{
  "data": {
    "id": "550e8400-e29b",
    "title": "День рождения (обновлено)",
    "originalDate": "2024-06-13T00:00:00Z",
    "type": "birthday",
    "description": "Обновленное описание",
    "recurrence": "yearly"
  }
}
```

**Ошибки:**
- `400` - Некорректные данные
- `404` - Событие не найдено
- `500` - Не удалось обновить событие

---

#### DELETE /api/events/:id

Удаляет событие по идентификатору.

**Параметры:**
- `id` (string, required) - UID события

**Ответ (204):**
Пустой ответ (успешное удаление)

**Ошибки:**
- `400` - Некорректный идентификатор
- `404` - Событие не найдено
- `500` - Не удалось удалить событие

---
