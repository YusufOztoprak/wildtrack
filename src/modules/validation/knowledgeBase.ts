// In a real-world scenario, this would be a database table.
// For this project, an in-memory object demonstrates the validation logic effectively.

export type SpeciesTrait = 'AQUATIC' | 'TERRESTRIAL' | 'AVIAN' | 'AMPHIBIOUS';
export type Diet = 'CARNIVORE' | 'HERBIVORE' | 'OMNIVORE';

/**
 * Climate zones ordered from coldest to warmest.
 * OCEAN is a special tag for purely aquatic species — they bypass the
 * latitude-based geographic check since they can be found in any ocean.
 */
export type ClimateZone =
    | 'POLAR'
    | 'SUBPOLAR'
    | 'TEMPERATE'
    | 'SUBTROPICAL'
    | 'TROPICAL'
    | 'OCEAN';

export interface SpeciesData {
    traits: SpeciesTrait[];
    diet: Diet;
    possibleBehaviors: string[];
    /** Climate zones where this species is natively found. */
    climateZones: ClimateZone[];
}

export const knowledgeBase: Record<string, SpeciesData> = {

    // ── Terrestrial Carnivores ────────────────────────────────────────────────

    wolf: {
        traits: ['TERRESTRIAL'],
        diet: 'CARNIVORE',
        possibleBehaviors: ['hunting', 'socializing', 'howling', 'resting'],
        climateZones: ['POLAR', 'SUBPOLAR', 'TEMPERATE'],
    },
    lion: {
        traits: ['TERRESTRIAL'],
        diet: 'CARNIVORE',
        possibleBehaviors: ['hunting', 'socializing', 'roaring', 'resting'],
        climateZones: ['SUBTROPICAL', 'TROPICAL'],
    },
    tiger: {
        traits: ['TERRESTRIAL'],
        diet: 'CARNIVORE',
        possibleBehaviors: ['hunting', 'stalking', 'roaring', 'resting'],
        climateZones: ['SUBTROPICAL', 'TROPICAL'],
    },
    fox: {
        traits: ['TERRESTRIAL'],
        diet: 'OMNIVORE',
        // Red fox is cosmopolitan — found from Arctic tundra to North Africa.
        possibleBehaviors: ['hunting', 'scavenging', 'resting'],
        climateZones: ['POLAR', 'SUBPOLAR', 'TEMPERATE', 'SUBTROPICAL'],
    },

    // ── Terrestrial Herbivores ────────────────────────────────────────────────

    deer: {
        traits: ['TERRESTRIAL'],
        diet: 'HERBIVORE',
        possibleBehaviors: ['grazing', 'running', 'resting', 'socializing'],
        climateZones: ['SUBPOLAR', 'TEMPERATE', 'SUBTROPICAL'],
    },
    elephant: {
        traits: ['TERRESTRIAL'],
        diet: 'HERBIVORE',
        possibleBehaviors: ['grazing', 'socializing', 'bathing', 'migrating'],
        climateZones: ['SUBTROPICAL', 'TROPICAL'],
    },
    giraffe: {
        traits: ['TERRESTRIAL'],
        diet: 'HERBIVORE',
        possibleBehaviors: ['browsing', 'running', 'resting'],
        climateZones: ['SUBTROPICAL', 'TROPICAL'],
    },
    camel: {
        traits: ['TERRESTRIAL'],
        diet: 'HERBIVORE',
        possibleBehaviors: ['grazing', 'walking', 'resting', 'foraging'],
        climateZones: ['SUBTROPICAL', 'TROPICAL'],
    },

    // ── Cold-Climate Mammals ──────────────────────────────────────────────────

    polar_bear: {
        traits: ['TERRESTRIAL', 'AMPHIBIOUS'],
        diet: 'CARNIVORE',
        possibleBehaviors: ['hunting', 'swimming', 'resting', 'walking', 'foraging'],
        climateZones: ['POLAR', 'SUBPOLAR'],
    },
    arctic_fox: {
        traits: ['TERRESTRIAL'],
        diet: 'CARNIVORE',
        possibleBehaviors: ['hunting', 'scavenging', 'resting', 'foraging'],
        climateZones: ['POLAR', 'SUBPOLAR'],
    },
    walrus: {
        traits: ['AMPHIBIOUS', 'AQUATIC'],
        diet: 'CARNIVORE',
        possibleBehaviors: ['swimming', 'basking', 'hauling out', 'socializing', 'foraging'],
        climateZones: ['POLAR', 'SUBPOLAR'],
    },
    reindeer: {
        traits: ['TERRESTRIAL'],
        diet: 'HERBIVORE',
        possibleBehaviors: ['grazing', 'migrating', 'walking', 'resting', 'socializing'],
        climateZones: ['POLAR', 'SUBPOLAR', 'TEMPERATE'],
    },
    bear: {
        traits: ['TERRESTRIAL'],
        diet: 'OMNIVORE',
        // Brown/black bears hibernate in winter.
        possibleBehaviors: ['foraging', 'hunting', 'fishing', 'resting', 'hibernating', 'socializing'],
        climateZones: ['SUBPOLAR', 'TEMPERATE'],
    },

    // ── Avian (Birds) ─────────────────────────────────────────────────────────

    eagle: {
        traits: ['AVIAN', 'TERRESTRIAL'],
        diet: 'CARNIVORE',
        // Eagles span every continent; range is broad.
        possibleBehaviors: ['flying', 'hunting', 'nesting', 'perching', 'soaring'],
        climateZones: ['POLAR', 'SUBPOLAR', 'TEMPERATE', 'SUBTROPICAL', 'TROPICAL'],
    },
    penguin: {
        // Penguins walk on land and swim; they cannot fly.
        traits: ['AQUATIC', 'TERRESTRIAL'],
        diet: 'CARNIVORE',
        possibleBehaviors: ['swimming', 'diving', 'waddling', 'socializing'],
        climateZones: ['POLAR', 'SUBPOLAR'],
    },
    owl: {
        traits: ['AVIAN', 'TERRESTRIAL'],
        diet: 'CARNIVORE',
        possibleBehaviors: ['flying', 'hunting', 'hooting', 'perching'],
        climateZones: ['SUBPOLAR', 'TEMPERATE', 'SUBTROPICAL'],
    },
    parrot: {
        traits: ['AVIAN', 'TERRESTRIAL'],
        diet: 'HERBIVORE',
        possibleBehaviors: ['flying', 'foraging', 'perching', 'socializing', 'vocalizing'],
        climateZones: ['SUBTROPICAL', 'TROPICAL'],
    },

    // ── Aquatic ───────────────────────────────────────────────────────────────

    shark: {
        traits: ['AQUATIC'],
        diet: 'CARNIVORE',
        possibleBehaviors: ['swimming', 'hunting', 'breaching'],
        // OCEAN bypasses latitude-based geographic check.
        climateZones: ['OCEAN'],
    },
    whale: {
        traits: ['AQUATIC'],
        diet: 'CARNIVORE',
        possibleBehaviors: ['swimming', 'breaching', 'singing', 'migrating'],
        climateZones: ['OCEAN'],
    },
    dolphin: {
        traits: ['AQUATIC'],
        diet: 'CARNIVORE',
        possibleBehaviors: ['swimming', 'hunting', 'playing', 'socializing'],
        climateZones: ['OCEAN'],
    },

    // ── Amphibious ────────────────────────────────────────────────────────────

    crocodile: {
        traits: ['AMPHIBIOUS', 'AQUATIC', 'TERRESTRIAL'],
        diet: 'CARNIVORE',
        possibleBehaviors: ['swimming', 'basking', 'hunting', 'walking'],
        climateZones: ['SUBTROPICAL', 'TROPICAL'],
    },

    // ── Special case ──────────────────────────────────────────────────────────

    dinosaur: {
        traits: [],
        diet: 'OMNIVORE',
        possibleBehaviors: ['time-traveling'],
        climateZones: [],
    },
};

// ── Normalization Map ─────────────────────────────────────────────────────────
// Maps common names / alternative spellings / other languages → internal key.

export const normalizationMap: Record<string, keyof typeof knowledgeBase> = {
    // English
    'wolf': 'wolf',
    'grey wolf': 'wolf',
    'gray wolf': 'wolf',
    'lion': 'lion',
    'tiger': 'tiger',
    'fox': 'fox',
    'red fox': 'fox',
    'deer': 'deer',
    'elephant': 'elephant',
    'giraffe': 'giraffe',
    'camel': 'camel',
    'dromedary': 'camel',
    'camelus dromedarius': 'camel',
    'bactrian camel': 'camel',
    'polar bear': 'polar_bear',
    'polar_bear': 'polar_bear',
    'arctic fox': 'arctic_fox',
    'arctic_fox': 'arctic_fox',
    'walrus': 'walrus',
    'morse': 'walrus',
    'reindeer': 'reindeer',
    'caribou': 'reindeer',
    'bear': 'bear',
    'brown bear': 'bear',
    'grizzly bear': 'bear',
    'grizzly': 'bear',
    'black bear': 'bear',
    'eagle': 'eagle',
    'bald eagle': 'eagle',
    'penguin': 'penguin',
    'owl': 'owl',
    'parrot': 'parrot',
    'shark': 'shark',
    'great white shark': 'shark',
    'whale': 'whale',
    'dolphin': 'dolphin',
    'crocodile': 'crocodile',
    'dinosaur': 'dinosaur',

    // Turkish
    'kurt': 'wolf',
    'aslan': 'lion',
    'kaplan': 'tiger',
    'tilki': 'fox',
    'geyik': 'deer',
    'fil': 'elephant',
    'zürafa': 'giraffe',
    'deve': 'camel',
    'kutup ayısı': 'polar_bear',
    'kutup tilkisi': 'arctic_fox',
    'mors': 'walrus',
    'ren geyiği': 'reindeer',
    'ayı': 'bear',
    'kartal': 'eagle',
    'penguen': 'penguin',
    'baykuş': 'owl',
    'papağan': 'parrot',
    'köpekbalığı': 'shark',
    'balina': 'whale',
    'yunus': 'dolphin',
    'timsah': 'crocodile',
    'dinozor': 'dinosaur',
};
