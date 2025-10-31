import { Router } from 'express';
const router = Router();

import events from './events/index.js'
import bookmarks from './bookmarks/index.js'

router.use('/events', events);
router.use('/bookmarks', bookmarks);

export default router;