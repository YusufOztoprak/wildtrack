import { z } from 'zod';

export const createObservationSchema = z.object({
  body: z.object({
    species: z.string().min(1, 'Tür bilgisi zorunludur'),
    count: z.string().transform((val) => parseInt(val, 10)).or(z.number()).default(1),
    latitude: z.string().transform((val) => parseFloat(val)).or(z.number()),
    longitude: z.string().transform((val) => parseFloat(val)).or(z.number()),
    behavior: z.string().optional(),
    // observedAt: z.string().transform((val) => new Date(val)).optional(), // Opsiyonel tarih (default now)
  }),
});

export type CreateObservationInput = z.infer<typeof createObservationSchema>['body'];