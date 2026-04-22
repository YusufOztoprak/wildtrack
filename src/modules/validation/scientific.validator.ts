import { knowledgeBase, normalizationMap, ClimateZone } from './knowledgeBase';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ValidationResult {
    overall_valid: boolean;
    status: 'valid' | 'suspicious' | 'rejected';
    issues: string[];
    photo_consistent: boolean;
    normalized_species: string;
}

// Ordered coldest→warmest; index distance drives rejection vs warning thresholds.
const ZONE_ORDER: ClimateZone[] = [
    'POLAR',
    'SUBPOLAR',
    'TEMPERATE',
    'SUBTROPICAL',
    'TROPICAL',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export const normalizeSpecies = (input: string): string => {
    const key = input.toLowerCase().trim();
    const mapped = normalizationMap[key];
    return mapped ? mapped : key;
};

/**
 * Maps a latitude to a climate zone on the ZONE_ORDER scale.
 * Returns null for OCEAN species (caller skips the geographic check).
 */
const getClimateZone = (lat: number): ClimateZone => {
    const abs = Math.abs(lat);
    if (abs >= 65) return 'POLAR';
    if (abs >= 50) return 'SUBPOLAR';
    if (abs >= 23) return 'TEMPERATE';
    if (abs >= 10) return 'SUBTROPICAL';
    return 'TROPICAL';
};

/**
 * Minimum index distance between the observed zone and any zone the species
 * is known to inhabit. Returns 0 if the species can live there.
 */
const zoneDistance = (observed: ClimateZone, allowed: ClimateZone[]): number => {
    const obsIdx = ZONE_ORDER.indexOf(observed);
    if (obsIdx === -1) return 0; // unknown zone — skip
    let min = Infinity;
    for (const z of allowed) {
        const idx = ZONE_ORDER.indexOf(z);
        if (idx !== -1) min = Math.min(min, Math.abs(obsIdx - idx));
    }
    return min === Infinity ? 0 : min;
};

/**
 * Checks whether two species names refer to the same animal by testing:
 * 1. Exact match after normalization (fastest path).
 * 2. Token overlap — "grey wolf" shares "wolf" with the AI result.
 *
 * Returns true if the names are considered equivalent.
 */
const speciesNamesMatch = (a: string, b: string): boolean => {
    const normA = normalizeSpecies(a);
    const normB = normalizeSpecies(b);
    if (normA === normB) return true;

    // Token overlap on the originals (before normalization) to catch
    // "Canis lupus" ↔ "wolf" type cases via shared sub-tokens.
    const tokenize = (s: string) =>
        s.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(t => t.length > 2);

    const tokensA = new Set([...tokenize(a), ...tokenize(normA)]);
    const tokensB = [...tokenize(b), ...tokenize(normB)];
    return tokensB.some(t => tokensA.has(t));
};

// ── Main validator ────────────────────────────────────────────────────────────

export const validateScientific = (
    speciesName: string,
    behavior: string,
    count: number,
    latitude: number,
    longitude: number,
    aiPrediction: { species: string; confidence: number } | null
): ValidationResult => {

    const result: ValidationResult = {
        overall_valid: true,
        status: 'valid',
        issues: [],
        photo_consistent: true,
        normalized_species: speciesName,
    };

    const normalizedName = normalizeSpecies(speciesName);
    result.normalized_species = normalizedName;

    // ── Check 1: Known species ────────────────────────────────────────────────
    const speciesData = knowledgeBase[normalizedName];
    if (!speciesData) {
        result.status = 'suspicious';
        result.issues.push(
            `Species '${speciesName}' is not in the active knowledge base. Marked for manual review.`
        );
        // Remaining checks require species data — bail out early.
        return result;
    }

    // ── Check 2: Extinct species ──────────────────────────────────────────────
    if (normalizedName === 'dinosaur') {
        result.overall_valid = false;
        result.status = 'rejected';
        result.issues.push('Biological Error: Dinosaurs are extinct.');
        return result;
    }

    // ── Check 3: Geographic plausibility ─────────────────────────────────────
    const isOceanSpecies = speciesData.climateZones.includes('OCEAN');
    if (!isOceanSpecies && speciesData.climateZones.length > 0) {
        const observedZone = getClimateZone(latitude);
        const dist = zoneDistance(observedZone, speciesData.climateZones);

        if (dist >= 2) {
            result.overall_valid = false;
            result.status = 'rejected';
            result.issues.push(
                `Geographic Impossibility: ${speciesName} is native to ` +
                `${speciesData.climateZones.join('/')} climates and cannot survive in ` +
                `${observedZone} conditions (lat ${latitude.toFixed(1)}°).`
            );
        } else if (dist === 1) {
            result.status = 'suspicious';
            result.issues.push(
                `Geographic Anomaly: ${speciesName} is not typically found in ` +
                `${observedZone} climates. Native range: ` +
                `${speciesData.climateZones.join('/')}.`
            );
        }
    }

    // ── Check 4: Behavior vs known behaviors ──────────────────────────────────
    const lowerBehavior = behavior.toLowerCase();

    if (lowerBehavior && speciesData.possibleBehaviors.length > 0) {
        const isKnownBehavior = speciesData.possibleBehaviors.some(pb =>
            lowerBehavior.includes(pb)
        );
        if (!isKnownBehavior && result.status !== 'rejected') {
            result.status = 'suspicious';
            result.issues.push(
                `Unusual Behavior: '${behavior}' is not a documented behavior for ${normalizedName}.`
            );
        }
    }

    // ── Check 5: Climate-specific behavior rules ──────────────────────────────
    if (lowerBehavior) {
        const hasTempOrColder = speciesData.climateZones.some(z =>
            ['POLAR', 'SUBPOLAR', 'TEMPERATE'].includes(z)
        );
        const isStrictlyWarm = speciesData.climateZones.length > 0 &&
            speciesData.climateZones.every(z => ['SUBTROPICAL', 'TROPICAL'].includes(z));
        const isStrictlyCold = speciesData.climateZones.length > 0 &&
            speciesData.climateZones.every(z => ['POLAR', 'SUBPOLAR'].includes(z));

        // Hibernation requires cold-season winters — not a tropical phenomenon.
        if (lowerBehavior.includes('hibernat') && isStrictlyWarm) {
            if (result.status !== 'rejected') result.status = 'suspicious';
            result.issues.push(
                `Climate-Behavior Mismatch: Hibernation is triggered by cold winters and is ` +
                `not climatically expected for ${normalizedName}, which is native to ` +
                `${speciesData.climateZones.join('/')} environments.`
            );
        }

        // Thermoregulatory basking implies ectothermy or cold tolerance — unusual for polar-only endotherms.
        if ((lowerBehavior.includes('bask') || lowerBehavior.includes('thermoreg')) && isStrictlyCold) {
            if (result.status !== 'rejected') result.status = 'suspicious';
            result.issues.push(
                `Climate-Behavior Mismatch: Thermoregulatory basking is atypical for ` +
                `${normalizedName}, a cold-climate species that maintains body heat internally.`
            );
        }
    }

    // ── Check 6: Trait-based behavior impossibilities ─────────────────────────
    const isAquaticOnly =
        speciesData.traits.includes('AQUATIC') && speciesData.traits.length === 1;
    const isTerrestrial = speciesData.traits.includes('TERRESTRIAL');
    const isAvian = speciesData.traits.includes('AVIAN');

    if (isAquaticOnly) {
        if (
            lowerBehavior.includes('walking') ||
            lowerBehavior.includes('running') ||
            lowerBehavior.includes('flying') ||
            lowerBehavior.includes('perching')
        ) {
            result.overall_valid = false;
            result.status = 'rejected';
            result.issues.push(
                `Biological Impossibility: Purely aquatic species (${normalizedName}) cannot ` +
                `perform terrestrial/avian behaviors like '${behavior}'.`
            );
        }
    }

    if (isTerrestrial && !isAvian) {
        if (lowerBehavior.includes('flying') || lowerBehavior.includes('soaring')) {
            result.overall_valid = false;
            result.status = 'rejected';
            result.issues.push(
                `Biological Impossibility: Non-avian terrestrial species (${normalizedName}) ` +
                `cannot perform avian behaviors like '${behavior}'.`
            );
        }
    }

    if (isAvian && !isAquaticOnly && !speciesData.traits.includes('AMPHIBIOUS') && normalizedName !== 'penguin') {
        if (lowerBehavior.includes('swimming') || lowerBehavior.includes('diving')) {
            if (result.status !== 'rejected') result.status = 'suspicious';
            result.issues.push(
                `Unusual Behavior: '${behavior}' is atypical for ${normalizedName} ` +
                `unless it is a water-associated species.`
            );
        }
    }

    // ── Check 7: AI photo consistency (fuzzy) ─────────────────────────────────
    if (aiPrediction) {
        const namesMatch = speciesNamesMatch(speciesName, aiPrediction.species);

        if (!namesMatch && aiPrediction.confidence > 0.7) {
            result.photo_consistent = false;
            if (result.status !== 'rejected') result.status = 'suspicious';
            result.issues.push(
                `Photo Mismatch: User reported '${speciesName}', but the AI identifies ` +
                `'${aiPrediction.species}' with ${Math.round(aiPrediction.confidence * 100)}% confidence. ` +
                `Verify the species identification.`
            );
        }
    }

    return result;
};
