import { PrismaClient } from '@prisma/client';
import { CreateObservationInput } from './observation.schema';

const prisma = new PrismaClient();

export const createObservation = async (
  data: CreateObservationInput,
  userId: number,
  imagePath?: string
) => {
  // @ts-ignore - ignoring potential type mismatch for now, will be validated by Zod
  return prisma.observation.create({
    data: {
      species: data.species,
      count: data.count,
      latitude: data.latitude,
      longitude: data.longitude,
      behavior: data.behavior,
      imageUrl: imagePath,
      authorId: userId,
      // observedAt defaults to now()
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
};

export const getStats = async () => {
  // 1. En çok görülen 5 tür
  const topSpecies = await prisma.observation.groupBy({
    by: ['species'],
    _sum: {
      count: true
    },
    orderBy: {
      _sum: {
        count: 'desc'
      }
    },
    take: 5
  });

  // 2. Son 7 günün günlük gözlem sayıları
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Prisma ile date group by biraz karışık olabilir, raw query daha güvenli
  const dailyCounts = await prisma.$queryRaw`
    SELECT count(*)::int as count, date_trunc('day', "observedAt") as date
    FROM "Observation"
    WHERE "observedAt" >= ${sevenDaysAgo}
    GROUP BY date_trunc('day', "observedAt")
    ORDER BY date_trunc('day', "observedAt") ASC
  `;

  return {
    topSpecies: topSpecies.map(s => ({ species: s.species, count: s._sum.count })),
    dailyCounts: (dailyCounts as any[]).map(d => ({ date: d.date, count: d.count }))
  };
};

export const getObservations = async (
  centerLat?: number,
  centerLng?: number,
  radiusKm?: number
) => {
  if (centerLat && centerLng && radiusKm) {
    // Haversine formula ile mesafe hesabı (PostGIS extension olmasa bile çalışır)
    // 6371 = Dünya yarıçapı (km)
    const observations = await prisma.$queryRaw`
      SELECT 
        o.id, o.species, o.count, o.behavior, o.latitude, o.longitude, o."imageUrl", o."observedAt", o."createdAt",
        u.name as "authorName", u.email as "authorEmail"
      FROM "Observation" o
      JOIN "User" u ON o."authorId" = u.id
      WHERE (
        6371 * acos(
          cos(radians(${centerLat})) * cos(radians(o.latitude)) *
          cos(radians(o.longitude) - radians(${centerLng})) +
          sin(radians(${centerLat})) * sin(radians(o.latitude))
        )
      ) <= ${radiusKm}
      ORDER BY o."createdAt" DESC
    `;

    // Raw query sonucu düz objeler döner, bunları uygun formata maple
    return (observations as any[]).map(obs => ({
      ...obs,
      author: {
        name: obs.authorName,
        email: obs.authorEmail
      }
    }));
  }

  // Normal listeleme
  return prisma.observation.findMany({
    include: {
      author: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};