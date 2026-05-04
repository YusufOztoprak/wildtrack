export enum QualityGrade {
  CASUAL = 'CASUAL',
  NEEDS_ID = 'NEEDS_ID',
  RESEARCH_GRADE = 'RESEARCH_GRADE',
}

export interface IdentificationVote {
  userId: number;
  taxonId: number;
  createdAt: Date;
}

export interface ObservationSnapshot {
  hasMedia: boolean;
  hasObservedAt: boolean;
  hasGps: boolean;
  identifications: IdentificationVote[];
  hasLocationMismatch: boolean;
}

export interface QualityGradeResult {
  grade: QualityGrade;
  failedGates: string[];
  consensusTaxonId: number | null;
}

function latestVotePerUser(votes: IdentificationVote[]): IdentificationVote[] {
  const byUser = new Map<number, IdentificationVote>();
  for (const vote of votes) {
    const existing = byUser.get(vote.userId);
    if (!existing || vote.createdAt > existing.createdAt) {
      byUser.set(vote.userId, vote);
    }
  }
  return Array.from(byUser.values());
}

function resolveConsensus(
  votes: IdentificationVote[],
): { taxonId: number; agreeCount: number; totalVoters: number } | null {
  const deduplicated = latestVotePerUser(votes);
  if (deduplicated.length < 2) return null;

  const taxonCounts = new Map<number, number>();
  for (const vote of deduplicated) {
    taxonCounts.set(vote.taxonId, (taxonCounts.get(vote.taxonId) ?? 0) + 1);
  }

  let leadingTaxonId = 0;
  let maxCount = 0;
  for (const [taxonId, count] of taxonCounts) {
    if (count > maxCount) {
      maxCount = count;
      leadingTaxonId = taxonId;
    }
  }

  if (maxCount < 2) return null;

  return { taxonId: leadingTaxonId, agreeCount: maxCount, totalVoters: deduplicated.length };
}

function hasRequiredMetadata(snapshot: ObservationSnapshot): boolean {
  return snapshot.hasMedia && snapshot.hasObservedAt && snapshot.hasGps;
}

function meetsConsensusThreshold(
  consensus: { agreeCount: number; totalVoters: number } | null,
): boolean {
  if (!consensus) return false;
  return consensus.agreeCount / consensus.totalVoters > 2 / 3;
}

export function computeQualityGrade(snapshot: ObservationSnapshot): QualityGradeResult {
  const failedGates: string[] = [];

  if (!hasRequiredMetadata(snapshot)) {
    failedGates.push('missing_metadata');
    return { grade: QualityGrade.CASUAL, failedGates, consensusTaxonId: null };
  }

  const consensus = resolveConsensus(snapshot.identifications);

  if (!meetsConsensusThreshold(consensus)) {
    failedGates.push('insufficient_consensus');
    return { grade: QualityGrade.NEEDS_ID, failedGates, consensusTaxonId: null };
  }

  if (snapshot.hasLocationMismatch) {
    failedGates.push('location_species_mismatch');
    return { grade: QualityGrade.NEEDS_ID, failedGates, consensusTaxonId: null };
  }

  return {
    grade: QualityGrade.RESEARCH_GRADE,
    failedGates,
    consensusTaxonId: consensus!.taxonId,
  };
}
