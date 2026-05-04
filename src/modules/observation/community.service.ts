import { PrismaClient, VerificationStatus } from '@prisma/client';
import {
  computeQualityGrade,
  IdentificationVote,
  ObservationSnapshot,
  QualityGrade,
} from './qualityGrade';

const prisma = new PrismaClient();

const GRADE_TO_STATUS: Record<QualityGrade, VerificationStatus> = {
  [QualityGrade.CASUAL]: VerificationStatus.CASUAL,
  [QualityGrade.NEEDS_ID]: VerificationStatus.NEEDS_ID,
  [QualityGrade.RESEARCH_GRADE]: VerificationStatus.RESEARCH_GRADE,
};

export const updateCommunityConsensus = async (observationId: number) => {
  const observation = await prisma.observation.findUnique({
    where: { id: observationId },
    include: {
      media: { select: { id: true } },
      identifications: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!observation) return null;

  const votes: IdentificationVote[] = observation.identifications.map((id) => ({
    userId: id.userId,
    taxonId: id.taxonId,
    createdAt: id.createdAt,
  }));

  const snapshot: ObservationSnapshot = {
    hasMedia: observation.media.length > 0,
    hasObservedAt: observation.observedAt !== null,
    hasGps: Number.isFinite(observation.latitude) && Number.isFinite(observation.longitude),
    identifications: votes,
    hasLocationMismatch: observation.locationMismatch,
  };

  const { grade, consensusTaxonId } = computeQualityGrade(snapshot);
  const newStatus = GRADE_TO_STATUS[grade];

  await prisma.observation.update({
    where: { id: observationId },
    data: {
      status: newStatus,
      taxonId: consensusTaxonId ?? observation.taxonId,
    },
  });

  return { newStatus, consensusTaxonId };
};
