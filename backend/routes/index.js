/**
 * Корневой роутер API

 * Объединяет все API маршруты приложения под префиксом /api/
 */

import { Router } from 'express';
const router = Router();

import events from './events/index.js'
import bookmarks from './bookmarks/index.js'

// События: /api/events
router.use('/events', events);

// Закладки: /api/bookmarks
router.use('/bookmarks', bookmarks);

export default router;