import { PrismaClient, VerificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Recalculates the observation status based on community identifications.
 * Algorithm:
 * 1. Get all identifications for the observation.
 * 2. Group by taxonId.
 * 3. If the leading taxon has >= 2 agreements AND represents > 2/3 of all IDs,
 *    promote to RESEARCH_GRADE and update the observation's taxon.
 * 4. Otherwise, keep as NEEDS_ID.
 */
export const updateCommunityConsensus = async (observationId: number) => {
  const identifications = await prisma.identification.findMany({
    where: { observationId },
  });

  if (identifications.length === 0) return null;

  // Count agreements per taxon
  const taxonCounts: Record<number, number> = {};
  const totalIds = identifications.length;

  for (const id of identifications) {
    taxonCounts[id.taxonId] = (taxonCounts[id.taxonId] ?? 0) + 1;
  }

  // Find the taxon with the maximum votes
  let leadingTaxonId: number | null = null;
  let maxVotes = 0;

  for (const [taxonId, count] of Object.entries(taxonCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      leadingTaxonId = parseInt(taxonId, 10);
    }
  }

  // Consensus rule: needs >= 2 votes and > 66% agreement
  const consensusThreshold = totalIds > 2 ? Math.ceil(totalIds * 0.66) : 2;

  let newStatus: VerificationStatus = VerificationStatus.NEEDS_ID;
  let consensusTaxonId: number | null = null;

  if (maxVotes >= consensusThreshold && leadingTaxonId !== null) {
    newStatus = VerificationStatus.RESEARCH_GRADE;
    consensusTaxonId = leadingTaxonId;
  }

  await prisma.observation.update({
    where: { id: observationId },
    data: { status: newStatus, taxonId: consensusTaxonId },
  });

  return { newStatus, consensusTaxonId };
};
