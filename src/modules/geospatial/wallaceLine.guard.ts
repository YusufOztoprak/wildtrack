import * as turf from '@turf/turf';
import { Feature, LineString } from 'geojson';

export type WallaceRealm = 'Oriental' | 'Australian' | 'Indeterminate';

export interface WallaceGuardInput {
  speciesName: string;
  lat: number;
  lng: number;
  captive?: boolean;
}

export interface WallaceGuardResult {
  realm: WallaceRealm;
  evolutionaryOrigin: WallaceRealm | null;
  distanceFromLineKm: number;
  flaggedForReview: boolean;
  reason: string | null;
}

const WALLACE_LINE: Feature<LineString> = turf.lineString([
  [125.0,  20.0],
  [125.0,   5.0],
  [118.0,   0.0],
  [117.0,  -5.0],
  [115.5,  -8.5],
  [115.0, -15.0],
]);

const AUSTRALIAN_MARSUPIALS: ReadonlySet<string> = new Set([
  'kangaroo',
  'red kangaroo',
  'grey kangaroo',
  'eastern grey kangaroo',
  'western grey kangaroo',
  'wallaby',
  'wallaroo',
  'koala',
  'wombat',
  'common wombat',
  'hairy-nosed wombat',
  'tasmanian devil',
  'quoll',
  'eastern quoll',
  'spotted quoll',
  'bandicoot',
  'eastern barred bandicoot',
  'numbat',
  'bilby',
  'greater bilby',
  'possum',
  'ringtail possum',
  'brushtail possum',
  'sugar glider',
  'feathertail glider',
  'dunnart',
  'potoroo',
  'quokka',
  'bettong',
  'pademelon',
  'cuscus',
]);

function classifyRealm(lat: number, lng: number): WallaceRealm {
  const coords = WALLACE_LINE.geometry.coordinates;

  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];

    if (lat < Math.min(lat1, lat2) || lat > Math.max(lat1, lat2)) continue;

    const cross = (lng2 - lng1) * (lat - lat1) - (lat2 - lat1) * (lng - lng1);
    return cross > 0 ? 'Australian' : 'Oriental';
  }

  const [[topLng, topLat]] = coords;
  const [botLng, botLat] = coords[coords.length - 1];

  if (lat > topLat) return lng < topLng ? 'Oriental' : 'Australian';
  if (lat < botLat) return lng < botLng ? 'Oriental' : 'Australian';

  return 'Indeterminate';
}

function evolutionaryOriginOf(speciesName: string): WallaceRealm | null {
  return AUSTRALIAN_MARSUPIALS.has(speciesName.toLowerCase().trim())
    ? 'Australian'
    : null;
}

function metersFromWallaceLine(lat: number, lng: number): number {
  const obs = turf.point([lng, lat]);
  const snapped = turf.nearestPointOnLine(WALLACE_LINE, obs, { units: 'kilometers' });
  return Math.round((snapped.properties?.dist ?? 0));
}

export function wallaceLineGuard(input: WallaceGuardInput): WallaceGuardResult {
  const { speciesName, lat, lng, captive = false } = input;

  const realm = classifyRealm(lat, lng);
  const evolutionaryOrigin = evolutionaryOriginOf(speciesName);
  const distanceFromLineKm = metersFromWallaceLine(lat, lng);

  const flaggedForReview =
    evolutionaryOrigin === 'Australian' && realm === 'Oriental' && !captive;

  return {
    realm,
    evolutionaryOrigin,
    distanceFromLineKm,
    flaggedForReview,
    reason: flaggedForReview
      ? `"${speciesName}" is an Australian-origin marsupial recorded on the Oriental side of the Wallace Line with no Captive/Zoo designation.`
      : null,
  };
}
