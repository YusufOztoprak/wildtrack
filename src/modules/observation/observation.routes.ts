import { Router } from 'express';
import { getObservations, createObservation, addIdentification, addComment, getTaxa, getObservationById } from './observation.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import upload from '../../middlewares/upload.middleware';

const router = Router();

// Public routes
router.get('/taxa', getTaxa);
router.get('/', getObservations);
router.get('/:observationId', getObservationById);

// Protected routes — require a valid JWT
router.post('/', authenticate, upload.single('image'), createObservation);
router.post('/:observationId/identifications', authenticate, addIdentification);
router.post('/:observationId/comments', authenticate, addComment);

export default router;
