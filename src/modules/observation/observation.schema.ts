import { z } from 'zod';

export const createObservationSchema = z.object({
  body: z.object({
    taxonName: z.string().optional(),
    taxonId: z.string().transform((val) => parseInt(val, 10)).or(z.number()).optional(),
    count: z.string().transform((val) => parseInt(val, 10)).or(z.number()).default(1),
    latitude: z.string().transform((val) => parseFloat(val)).or(z.number()),
    longitude: z.string().transform((val) => parseFloat(val)).or(z.number()),
    description: z.string().optional(),
    behavior: z.string().optional(),
  }),
  files: z.array(z.any()).optional() // To handle Multer files properly in validation
});

export type CreateObservationInput = z.infer<typeof createObservationSchema>['body'];
