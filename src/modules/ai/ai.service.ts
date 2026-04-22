export interface AIPrediction {
  species: string;
  commonName: string | null;
  confidence: number;
  taxonId: number | null;
}

export const predictSpecies = async (buffer: Buffer, mimetype: string): Promise<AIPrediction | null> => {
  const token = process.env.INATURALIST_API_TOKEN;
  if (!token) {
    console.warn('[iNaturalist] INATURALIST_API_TOKEN not set — skipping AI prediction.');
    return null;
  }

  console.log('[iNaturalist] Sending image buffer, size:', buffer.byteLength, 'mimetype:', mimetype);

  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimetype });
  formData.append('image', blob, 'photo.jpg');

  let res: Response;
  try {
    res = await fetch('https://api.inaturalist.org/v1/computervision/score_image', {
      method: 'POST',
      headers: { 'Authorization': token },
      body: formData,
    });
  } catch (err) {
    console.error('[iNaturalist] Network error:', err);
    return null;
  }

  console.log('[iNaturalist] HTTP status:', res.status);

  const text = await res.text();
  console.log('[iNaturalist] Raw response body:', text);

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (parseErr) {
    console.error('[iNaturalist] JSON parse error:', parseErr);
    return null;
  }

  const top = parsed.results?.[0];
  if (!top) {
    console.warn('[iNaturalist] No results in response. Full payload:', JSON.stringify(parsed, null, 2));
    return null;
  }

  return {
    species: top.taxon?.name ?? 'Unknown',
    commonName: top.taxon?.english_common_name ?? top.taxon?.name ?? null,
    confidence: top.combined_score ?? 0,
    taxonId: top.taxon?.id ?? null,
  };
};
