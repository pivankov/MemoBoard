/**
 * Корневой роутер API

 * Объединяет все API маршруты приложения под префиксом /api/
 */

import { Router } from 'express';
const router = Router();

import auth from './auth/index.js';
import events from './events/index.js'
import bookmarks from './bookmarks/index.js'
import { requireAuth } from '../middleware/auth.js';

// Аутентификация: /api/auth (публичные маршруты — без middleware)
router.use('/auth', auth);

// Все остальные маршруты требуют авторизации
router.use('/events', requireAuth, events);
router.use('/bookmarks', requireAuth, bookmarks);

export default router;