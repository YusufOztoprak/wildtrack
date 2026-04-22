import { PrismaClient, Prisma } from '@prisma/client';
import { updateCommunityConsensus } from './community.service';

const prisma = new PrismaClient();

export class ObservationService {

  async getAllObservations(lat?: number, lng?: number, radius?: number) {
    let whereClause: Prisma.ObservationWhereInput = {};

    if (lat && lng && radius) {
      const radiusInDeg = radius / 111.32;
      whereClause = {
        latitude: { gte: lat - radiusInDeg, lte: lat + radiusInDeg },
        longitude: { gte: lng - radiusInDeg, lte: lng + radiusInDeg },
      };
    }

    return prisma.observation.findMany({
      where: whereClause,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        taxon: true,
        media: true,
        identifications: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
            taxon: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async createObservation(data: {
    authorId: number;
    taxonId?: number;
    latitude: number;
    longitude: number;
    description?: string;
    behavior?: string;
    aiConfidence?: number;
    mediaUrls: string[];
    observedAt: Date;
  }) {
    const observation = await prisma.observation.create({
      data: {
        authorId: data.authorId,
        taxonId: data.taxonId,
        latitude: data.latitude,
        longitude: data.longitude,
        description: data.description,
        behavior: data.behavior,
        aiConfidence: data.aiConfidence,
        observedAt: data.observedAt,
        status: 'NEEDS_ID',
        media: {
          create: data.mediaUrls.map((url) => ({ url })),
        },
      },
      include: {
        taxon: true,
        media: true,
      },
    });

    if (data.taxonId) {
      await prisma.identification.create({
        data: {
          observationId: observation.id,
          userId: data.authorId,
          taxonId: data.taxonId,
          body: 'Initial observation.',
        },
      });
      await updateCommunityConsensus(observation.id);
    }

    return observation;
  }

  async getObservationById(id: number) {
    return prisma.observation.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        taxon: true,
        media: true,
        identifications: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
            taxon: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}

export const observationService = new ObservationService();
