import { Router } from 'express';
const router = Router();

import events from './events/index.js'

router.use('/events', events);

export default router;