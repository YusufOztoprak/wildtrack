import axios from 'axios';

const GBIF_BASE = 'https://api.gbif.org/v1';
const RADIUS_DEG = 5;
const MIN_GLOBAL_RECORDS = 10;

interface GbifSpeciesSearchResponse {
  results: Array<{ usageKey: number; scientificName: string }>;
}

interface GbifOccurrenceSearchResponse {
  count: number;
}

export interface GeoValidationResult {
  valid: boolean;
  error?: 'Location-Species Mismatch';
  speciesName: string;
  lat: number;
  lng: number;
  nearbyCount: number;
  globalCount: number;
}

async function resolveGbifTaxonKey(speciesName: string): Promise<number | null> {
  const { data } = await axios.get<GbifSpeciesSearchResponse>(`${GBIF_BASE}/species/search`, {
    params: { q: speciesName, rank: 'SPECIES', limit: 1 },
    timeout: 8000,
  });
  return data.results[0]?.usageKey ?? null;
}

async function countOccurrences(taxonKey: number, lat?: number, lng?: number): Promise<number> {
  const params: Record<string, unknown> = { taxonKey, limit: 0 };

  if (lat !== undefined && lng !== undefined) {
    params.decimalLatitude = `${Math.max(-90, lat - RADIUS_DEG)},${Math.min(90, lat + RADIUS_DEG)}`;
    params.decimalLongitude = `${Math.max(-180, lng - RADIUS_DEG)},${Math.min(180, lng + RADIUS_DEG)}`;
  }

  const { data } = await axios.get<GbifOccurrenceSearchResponse>(`${GBIF_BASE}/occurrence/search`, {
    params,
    timeout: 10000,
  });

  return data.count;
}

export async function validateGeographicSanity(
  speciesName: string,
  lat: number,
  lng: number,
): Promise<GeoValidationResult> {
  const taxonKey = await resolveGbifTaxonKey(speciesName);

  if (!taxonKey) {
    return { valid: true, speciesName, lat, lng, nearbyCount: 0, globalCount: 0 };
  }

  const [nearbyCount, globalCount] = await Promise.all([
    countOccurrences(taxonKey, lat, lng),
    countOccurrences(taxonKey),
  ]);

  const mismatch = globalCount >= MIN_GLOBAL_RECORDS && nearbyCount === 0;

  return {
    valid: !mismatch,
    ...(mismatch && { error: 'Location-Species Mismatch' as const }),
    speciesName,
    lat,
    lng,
    nearbyCount,
    globalCount,
  };
}
