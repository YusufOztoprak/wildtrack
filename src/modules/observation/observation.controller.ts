import { Request, Response, NextFunction } from 'express';
import * as observationService from './observation.service';
import { createObservationSchema } from './observation.schema';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const createObservation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createObservationSchema.parse(req.body);
    const userId = req.user.id;
    const observation = await observationService.createObservation(userId, data);
    res.status(201).json(observation);
  } catch (error) {
    next(error);
  }
};

export const getObservations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const observations = await observationService.getObservations();
    res.json(observations);
  } catch (error) {
    next(error);
  }
};

export const getObservationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const observation = await observationService.getObservationById(id);
    if (!observation) {
      return res.status(404).json({ message: 'Observation not found' });
    }
    res.json(observation);
  } catch (error) {
    next(error);
  }
};

export const deleteObservation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user.id;
    await observationService.deleteObservation(userId, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getNearbyObservations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 10; // Default 10km

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: 'Latitude and longitude are required and must be numbers' });
    }

    const observations = await observationService.getObservationsInRadius(lat, lng, radius);
    res.json(observations);
  } catch (error) {
    next(error);
  }
};
