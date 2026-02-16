import { Router } from 'express';
import { createObservationHandler, getObservationsHandler, getStatsHandler } from './observation.controller';
import { protect } from '../../middlewares/auth.middleware';
import { upload } from '../../middlewares/upload.middleware';

const router = Router();

// İstatistik endpoint'i (diğerlerinden önce tanımlanmalı ki /:id ile çakışmasın)
router.get('/stats', getStatsHandler);

router.post('/', protect, upload.single('image'), createObservationHandler);
router.get('/', getObservationsHandler);

export default router;