import prisma from '../../config/db';
import { z } from 'zod';
import { createObservationSchema } from './observation.schema';

export const createObservation = async (userId: number, data: z.infer<typeof createObservationSchema>) => {
  return prisma.observation.create({
    data: {
      ...data,
      authorId: userId,
    },
  });
};

export const getObservations = async () => {
  return prisma.observation.findMany({
    include: { author: { select: { name: true, email: true } } },
  });
};

export const getObservationById = async (id: number) => {
  return prisma.observation.findUnique({
    where: { id },
    include: { author: { select: { name: true, email: true } } },
  });
};

export const deleteObservation = async (userId: number, id: number) => {
  const observation = await prisma.observation.findUnique({ where: { id } });
  if (!observation) {
    throw new Error('Observation not found');
  }
  if (observation.authorId !== userId) {
    throw new Error('Unauthorized');
  }
  return prisma.observation.delete({ where: { id } });
};

export const getObservationsInRadius = async (lat: number, lng: number, radiusKm: number) => {
  // Using Haversine formula for distance calculation in raw SQL
  // 6371 is Earth's radius in km
  const observations = await prisma.$queryRaw`
    SELECT 
      id, 
      species, 
      count, 
      behavior, 
      latitude, 
      longitude, 
      "createdAt",
      (
        6371 * acos(
          cos(radians(${lat})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(latitude))
        )
      ) AS distance
    FROM "Observation"
    WHERE (
      6371 * acos(
        cos(radians(${lat})) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(latitude))
      )
    ) < ${radiusKm}
    ORDER BY distance ASC;
  `;
  
  return observations;
};
