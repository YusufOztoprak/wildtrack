import { z } from 'zod';

export const createObservationSchema = z.object({
  species: z.string(),
  count: z.number().int().positive().default(1),
  behavior: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  imageUrl: z.string().optional(),
  observedAt: z.string().datetime().optional(),
});