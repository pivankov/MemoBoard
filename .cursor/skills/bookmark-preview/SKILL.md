---
name: bookmark-preview
description: Описывает правила работы с превью изображений закладок в MemoBoard backend. Используй когда нужно скачать, сохранить или удалить превью закладки, обработать изображение, или реализовать логику создания/удаления закладки.
---

# Работа с превью закладок

## Импорт

```js
import { extractPreviewUrl, downloadPreview, deletePreview, getFaviconUrl } from '../../utils/preview.js'
```

## Цепочка получения превью

Всегда применяй в таком порядке:

```js
// 1. Пробуем og:image или twitter:image из метаданных
let previewUrl = extractPreviewUrl(metadata)

// 2. Если нет — берём favicon
if (!previewUrl) {
  previewUrl = getFaviconUrl(url)
}

// 3. Скачиваем и сохраняем
const preview = await downloadPreview(previewUrl, bookmarkUid)
// => "/previews/xK9pLm2n.webp" или null при ошибке
```

## Критические правила

**При создании закладки:**
Провал скачивания превью — НЕ ошибка. Закладка создаётся в любом случае, поле `preview` остаётся пустой строкой.

```js
// Правильно
const preview = await downloadPreview(previewUrl, uid) ?? ''
db.prepare('INSERT INTO bookmarks ...').run({ preview, ... })

// Неправильно — нельзя прерывать создание из-за превью
if (!preview) return res.status(500).json({ error: '...' })
```

**При удалении закладки:**
Всегда удаляй файл с диска. Отсутствие файла — не ошибка, `deletePreview` обработает это сам.

```js
const bookmark = db.prepare('SELECT preview FROM bookmarks WHERE id = ?').get(id)
await deletePreview(bookmark.preview) // можно вызывать даже с пустой строкой
db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id)
```

## Форматы и ограничения

| Параметр | Значение |
|---|---|
| Хранение | `uploads/previews/` |
| Возвращаемый путь | `/previews/uid.ext` |
| Выходной формат | WebP (JPEG/PNG/GIF/WebP) или ICO без изменений |
| Размер | до 200×200px с сохранением пропорций |
| Таймаут | 10 сек |
| Лимит файла | 5 МБ |

## Что НЕ нужно делать

- Не реализуй скачивание/оптимизацию самостоятельно — только через `utils/preview.js`
- Не пробрасывай ошибки превью наружу — они логируются внутри через `console.warn`
- Не создавай папку `uploads/previews/` вручную — создаётся автоматически
