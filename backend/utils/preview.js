import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PREVIEWS_DIR = path.join(__dirname, '../uploads/previews');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const DOWNLOAD_TIMEOUT = 10_000; // 10 секунд

/** Поддерживаемые MIME-типы изображений */
const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

/** MIME-типы иконок — не обрабатываются через Sharp */
const ICON_TYPES = new Set([
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

const PREVIEW_SIZE = 200;  // px — покрывает retina 2x при блоке <100px
const WEBP_QUALITY = 30;

/**
 * Обрабатывает буфер изображения перед сохранением
 *
 * Иконки (.ico) сохраняются как есть — они уже имеют минимальный размер.
 * Все остальные форматы ресайзятся до PREVIEW_SIZE и конвертируются в WebP.
 *
 * @param {ArrayBuffer} buffer - Исходный буфер скачанного изображения
 * @param {string} contentType - MIME-тип изображения
 * @returns {Promise<{ data: Buffer, ext: string }>} Обработанный буфер и расширение файла
 */
const processImage = async (buffer, contentType) => {
  if (ICON_TYPES.has(contentType)) {
    return { data: Buffer.from(buffer), ext: 'ico' };
  }

  const data = await sharp(Buffer.from(buffer))
    .resize(PREVIEW_SIZE, PREVIEW_SIZE, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  return { data, ext: 'webp' };
};

/**
 * Извлекает URL превью из метаданных страницы
 *
 * Приоритет: og:image → twitter:image
 *
 * @param {Object|null} metadata - Объект метаданных от url-metadata
 * @returns {string|null} URL превью или null, если не найдено
 */
export const extractPreviewUrl = (metadata) => {
  if (!metadata || typeof metadata !== 'object') return null;
  return metadata['og:image'] || metadata['twitter:image'] || null;
};

/**
 * Скачивает изображение по URL и сохраняет локально в PREVIEWS_DIR
 *
 * Папка previews создаётся автоматически при необходимости.
 * При любой ошибке возвращает null — не бросает исключений.
 *
 * @param {string} imageUrl - URL изображения для скачивания
 * @param {string} bookmarkUid - UID закладки, используется как имя файла
 * @returns {Promise<string|null>} Относительный путь (/previews/uid.ext) или null при ошибке
 */
export const downloadPreview = async (imageUrl, bookmarkUid) => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;

  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    console.warn('Превью: невалидный протокол URL:', imageUrl);
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT);

  try {
    const response = await fetch(imageUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Превью: HTTP ${response.status} при загрузке:`, imageUrl);
      return null;
    }

    const rawContentType = response.headers.get('content-type') ?? '';
    const contentType = rawContentType.split(';')[0].trim();

    if (!SUPPORTED_IMAGE_TYPES.has(contentType)) {
      console.warn('Превью: неподдерживаемый тип контента:', contentType, imageUrl);
      return null;
    }

    // Ранняя проверка по заголовку (не всегда присутствует)
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
      console.warn('Превью: файл превышает лимит по заголовку content-length:', imageUrl);
      return null;
    }

    const buffer = await response.arrayBuffer();

    if (buffer.byteLength > MAX_FILE_SIZE) {
      console.warn('Превью: файл превышает лимит 5 MB:', buffer.byteLength, imageUrl);
      return null;
    }

    const { data, ext } = await processImage(buffer, contentType);

    await fs.mkdir(PREVIEWS_DIR, { recursive: true });

    const filename = `${bookmarkUid}.${ext}`;
    const fullPath = path.join(PREVIEWS_DIR, filename);
    await fs.writeFile(fullPath, data);

    return `/previews/${filename}`;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('Превью: ошибка загрузки:', imageUrl, error.message);
    return null;
  }
};

/**
 * Удаляет файл превью с диска
 *
 * Проверяет, что путь принадлежит PREVIEWS_DIR, защищая от path traversal.
 * Отсутствие файла не считается ошибкой.
 *
 * @param {string} previewPath - Относительный путь к превью (/previews/...)
 * @returns {Promise<boolean>} true при успешном удалении, false при ошибке или невалидном пути
 */
export const deletePreview = async (previewPath) => {
  if (!previewPath || typeof previewPath !== 'string') return false;
  if (!previewPath.startsWith('/previews/')) return false;

  const filename = path.basename(previewPath);
  const fullPath = path.join(PREVIEWS_DIR, filename);

  // Защита от path traversal — путь должен оставаться внутри PREVIEWS_DIR
  if (!fullPath.startsWith(PREVIEWS_DIR + path.sep) && fullPath !== PREVIEWS_DIR) return false;

  try {
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Превью: ошибка удаления файла:', fullPath, error.message);
    }
    return false;
  }
};

/**
 * Возвращает URL favicon для сайта по его URL
 *
 * @param {string} url - URL страницы сайта
 * @returns {string|null} URL вида {protocol}://{host}/favicon.ico или null при невалидном URL
 */
export const getFaviconUrl = (url) => {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}/favicon.ico`;
  } catch {
    return null;
  }
};
