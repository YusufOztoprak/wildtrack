import { Router } from 'express';
import * as observationController from './observation.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, observationController.createObservation);
router.get('/', observationController.getObservations);
router.get('/nearby', observationController.getNearbyObservations); // New route
router.get('/:id', observationController.getObservationById);
router.delete('/:id', authenticate, observationController.deleteObservation);

export default router;