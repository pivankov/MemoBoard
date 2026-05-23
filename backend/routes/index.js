/**
 * Корневой роутер API

 * Объединяет все API маршруты приложения под префиксом /api/
 */

import { Router } from 'express';
const router = Router();

import auth from './auth/index.js';
import events from './events/index.js'
import bookmarks from './bookmarks/index.js'
import admin from './admin/index.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

// Аутентификация: /api/auth (публичные маршруты — без middleware)
router.use('/auth', auth);

// Все остальные маршруты требуют авторизации
router.use('/events', requireAuth, events);
router.use('/bookmarks', requireAuth, bookmarks);

// Административный раздел: только для пользователей с ролью admin
router.use('/admin', requireAuth, requireAdmin, admin);

export default router;