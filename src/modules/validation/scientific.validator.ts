// Scientific Validator Engine
// STRICT RULES: Biological realism is mandatory.
// "You are not a creative AI. You are a scientific validator."

export interface ValidationEvent {
    animal: string;
    behavior: string;
    valid: boolean;
    reason?: string;
}

type Trait = 'Aquatic' | 'Terrestrial' | 'Avian' | 'Carnivore' | 'Herbivore' | 'Flight' | 'Insects';

// Turkish Aliases Map (Exported for Controller use)
export const turkishAliases: Record<string, string> = {
    'kurt': 'wolf',
    'ayı': 'bear',
    'ayi': 'bear',
    'kartal': 'eagle',
    'aslan': 'lion',
    'kaplan': 'tiger',
    'leopar': 'leopard',
    'çita': 'cheetah',
    'cita': 'cheetah',
    'fil': 'elephant',
    'zürafa': 'giraffe',
    'zurafa': 'giraffe',
    'zebra': 'zebra',
    'gergedan': 'rhino',
    'su aygırı': 'hippopotamus',
    'timsah': 'crocodile',
    'yılan': 'snake',
    'yilan': 'snake',
    'tilki': 'fox',
    'geyik': 'deer',
    'sığın': 'moose',
    'sigin': 'moose',
    'bizon': 'bison',
    'yaban domuzu': 'wild boar',
    'vaşak': 'lynx',
    'vasak': 'lynx',
    'puma': 'cougar',
    'jaguar': 'jaguar',
    'maymun': 'monkey',
    'goril': 'gorilla',
    'şempanze': 'chimpanzee',
    'sempanze': 'chimpanzee',
    'kanguru': 'kangaroo',
    'koala': 'koala',
    'panda': 'panda',
    'kutup ayısı': 'polar bear',
    'kutup ayisi': 'polar bear',
    'baykuş': 'owl',
    'baykus': 'owl',
    'şahin': 'hawk',
    'sahin': 'hawk',
    'doğan': 'falcon',
    'dogan': 'falcon',
    'akbaba': 'vulture',
    'köpek balığı': 'shark',
    'kopek baligi': 'shark',
    'balina': 'whale',
    'yunus': 'dolphin',
    'tavşan': 'rabbit',
    'tavsan': 'rabbit',
    'panter': 'panther',
    'sırtlan': 'hyena',
    'sirtlan': 'hyena',
    'balık': 'fish',
    'balik': 'fish',
    'penguen': 'penguin',
    'kedi': 'cat',
    'köpek': 'dog',
    'kopek': 'dog',
    'insan': 'human'
};

export const normalizeSpecies = (input: string): string => {
    let lower = input.toLowerCase().trim();
    for (const [tr, en] of Object.entries(turkishAliases)) {
        if (lower === tr || lower.includes(tr)) return en;
    }
    return lower;
};

// Knowledge Base of Species Traits (Expanded)
const speciesTraits: Record<string, Trait[]> = {
    'wolf': ['Terrestrial', 'Carnivore'],
    'bear': ['Terrestrial', 'Carnivore', 'Herbivore'], // Omnivore
    'eagle': ['Avian', 'Flight', 'Carnivore'],
    'lion': ['Terrestrial', 'Carnivore'],
    'tiger': ['Terrestrial', 'Carnivore'],
    'leopard': ['Terrestrial', 'Carnivore'],
    'cheetah': ['Terrestrial', 'Carnivore'],
    'elephant': ['Terrestrial', 'Herbivore'],
    'giraffe': ['Terrestrial', 'Herbivore'],
    'zebra': ['Terrestrial', 'Herbivore'],
    'rhino': ['Terrestrial', 'Herbivore'],
    'hippopotamus': ['Terrestrial', 'Aquatic', 'Herbivore'],
    'crocodile': ['Terrestrial', 'Aquatic', 'Carnivore'],
    'snake': ['Terrestrial', 'Carnivore'], // Some aquatic, but general rule
    'fox': ['Terrestrial', 'Carnivore'],
    'deer': ['Terrestrial', 'Herbivore'],
    'moose': ['Terrestrial', 'Herbivore'],
    'bison': ['Terrestrial', 'Herbivore'],
    'wild boar': ['Terrestrial', 'Herbivore', 'Carnivore'], // Omnivore
    'lynx': ['Terrestrial', 'Carnivore'],
    'cougar': ['Terrestrial', 'Carnivore'],
    'jaguar': ['Terrestrial', 'Carnivore'],
    'monkey': ['Terrestrial', 'Herbivore'], // Arboreal often imply terrestrial capable
    'gorilla': ['Terrestrial', 'Herbivore'],
    'chimpanzee': ['Terrestrial', 'Herbivore', 'Carnivore'],
    'kangaroo': ['Terrestrial', 'Herbivore'],
    'koala': ['Terrestrial', 'Herbivore'],
    'panda': ['Terrestrial', 'Herbivore'],
    'polar bear': ['Terrestrial', 'Aquatic', 'Carnivore'],
    'owl': ['Avian', 'Flight', 'Carnivore'],
    'hawk': ['Avian', 'Flight', 'Carnivore'],
    'falcon': ['Avian', 'Flight', 'Carnivore'],
    'vulture': ['Avian', 'Flight', 'Carnivore'], // Scavenger
    'shark': ['Aquatic', 'Carnivore'],
    'whale': ['Aquatic', 'Carnivore'], // Plankton/Krill are meat/animals
    'dolphin': ['Aquatic', 'Carnivore'],
    'rabbit': ['Terrestrial', 'Herbivore'],
    'panther': ['Terrestrial', 'Carnivore'],
    'hyena': ['Terrestrial', 'Carnivore'],
    'fish': ['Aquatic'],
    'penguin': ['Avian', 'Aquatic', 'Carnivore'],
    'cat': ['Terrestrial', 'Carnivore'],
    'dog': ['Terrestrial', 'Carnivore'],
    'human': ['Terrestrial', 'Carnivore', 'Herbivore'] // Just in case
};

// Logical Constraints Definitions
const behaviorConstraints: Record<string, { required?: Trait[], forbidden?: Trait[], msg: string }> = {
    'fly': { required: ['Flight'], msg: 'Species lacks aerodynamic physiology (wings/flight).' },
    'flying': { required: ['Flight'], msg: 'Species lacks aerodynamic physiology (wings/flight).' },
    'swim': { required: ['Aquatic'], forbidden: [], msg: 'Species is not biologically adapted for aquatic locomotion.' },
    'swimming': { required: ['Aquatic'], forbidden: [], msg: 'Species is not biologically adapted for aquatic locomotion.' },
    'dive': { required: ['Aquatic'], msg: 'Species cannot sustain life underwater.' },
    'underwater': { required: ['Aquatic'], msg: 'Species physiology incompatible with submersion.' },
    'graze': { required: ['Herbivore'], msg: 'Carnivorous digestive system cannot process grass/vegetation.' },
    'grazing': { required: ['Herbivore'], msg: 'Carnivorous digestive system cannot process grass/vegetation.' },
    'hunt': { required: ['Carnivore'], msg: 'Herbivore lacks predatory instincts and biology.' },
    'hunting': { required: ['Carnivore'], msg: 'Herbivore lacks predatory instincts and biology.' },
    'walk': { forbidden: ['Aquatic'], msg: 'Aquatic physiology (fins) cannot support terrestrial walking.' },
    'walking': { forbidden: ['Aquatic'], msg: 'Aquatic physiology (fins) cannot support terrestrial walking.' },
    'run': { forbidden: ['Aquatic'], msg: 'Aquatic physiology cannot support terrestrial running.' },
    'running': { forbidden: ['Aquatic'], msg: 'Aquatic physiology cannot support terrestrial running.' },
};


const turkishBehaviors: Record<string, string> = {
    'uç': 'fly', 'uc': 'fly', 'uçmak': 'fly', 'ucmak': 'fly',
    'yüz': 'swim', 'yuz': 'swim', 'yüzmek': 'swim', 'yuzmek': 'swim',
    'dal': 'dive', 'dalmak': 'dive',
    'otla': 'graze', 'otlamak': 'graze',
    'avla': 'hunt', 'avlan': 'hunt', 'avlanmak': 'hunt',
    'yürü': 'walk', 'yuru': 'walk', 'yürümek': 'walk', 'yurumek': 'walk',
    'koş': 'run', 'kos': 'run', 'koşmak': 'run', 'kosmak': 'run'
};

export interface ScientificValidationResult {
    species_valid: boolean;
    behavior_valid: boolean;
    count_valid: boolean;
    photo_consistent: boolean | null;
    overall_valid: boolean;
    confidence_score: number;
    status: 'valid' | 'invalid' | 'suspicious';
    issues: string[];
}

export const validateScientific = (
    speciesInput: string,
    behaviorInput: string,
    count: number,
    aiPrediction?: { species: string; confidence: number } | null
): ScientificValidationResult => {
    const issues: string[] = [];
    let species = speciesInput.toLowerCase().trim();
    let behavior = behaviorInput.toLowerCase().trim();

    // 1. Normalize Species (TR -> EN)
    for (const [tr, en] of Object.entries(turkishAliases)) {
        if (species === tr || species.includes(tr)) {
            species = en;
            break;
        }
    }

    // 2. Normalize Behavior (TR -> EN)
    for (const [tr, en] of Object.entries(turkishBehaviors)) {
        if (behavior.includes(tr)) {
            behavior += ' ' + en;
        }
    }

    // --- VALIDATION LOGIC ---

    // A. Species Validation
    let speciesValid = false;
    let traits: Trait[] = [];
    let matchedSpecies = '';

    for (const [key, t] of Object.entries(speciesTraits)) {
        if (species.includes(key)) {
            traits = t;
            matchedSpecies = key;
            speciesValid = true;
            break;
        }
    }

    if (!speciesValid) {
        issues.push(`Species '${speciesInput}' not found in scientific taxonomy database.`);
    }

    // B. Behavior Validation
    let behaviorValid = true;
    if (speciesValid && behavior) {
        for (const [action, rule] of Object.entries(behaviorConstraints)) {
            if (behavior.includes(action)) {
                if (rule.required) {
                    const hasRequirement = rule.required.some(r => traits.includes(r));
                    if (!hasRequirement) {
                        behaviorValid = false;
                        issues.push(`Behavior Mismatch: '${action}' requires traits [${rule.required.join('/')}], but ${matchedSpecies} is [${traits.join(', ')}].`);
                    }
                }
                if (rule.forbidden) {
                    const isForbidden = rule.forbidden.some(f => traits.includes(f));
                    // Special checks (Aquatic exclusion)
                    const isPurelyAquatic = traits.includes('Aquatic') && !traits.includes('Terrestrial') && !traits.includes('Avian');

                    if (isPurelyAquatic && (action.includes('walk') || action.includes('run'))) {
                        behaviorValid = false;
                        issues.push(`Physiological Impossibility: Aquatic species (${matchedSpecies}) cannot '${action}' on land.`);
                    }
                }
            }
        }
    }

    // C. Count Validation
    let countValid = true;
    if (count <= 0) {
        countValid = false;
        issues.push(`Impossible Count: ${count}. Population must be positive.`);
    } else if (count > 100) {
        // Soft limit warning, or strict? User said "Reject impossible numbers". 
        // 500 lions is impossible. 1000 birds might be possible. 
        // Let's keep the existing 100 limit rule from controller but enforce it here.
        countValid = false;
        issues.push(`Ecological Improbability: Count ${count} exceeds realistic herd/pack size limits for manual observation.`);
    }

    // D. Photo Consistency
    // Compare User Input vs AI
    let photoConsistent: boolean | null = null;
    if (aiPrediction) {
        const aiSpecies = aiPrediction.species.toLowerCase();
        // Fuzzy match
        const isMatch = species.includes(aiSpecies) || aiSpecies.includes(species);

        if (isMatch) {
            photoConsistent = true;
        } else {
            // If AI is very confident it's something else
            if (aiPrediction.confidence > 0.8) {
                photoConsistent = false;
                issues.push(`Visual Evidence Mismatch: AI identified '${aiPrediction.species}' (${Math.round(aiPrediction.confidence * 100)}%), which contradicts user claim '${speciesInput}'.`);
            } else {
                // Low confidence mismatch -> Suspicious but not strictly invalid photo (could be bad photo)
                photoConsistent = null; // Uncertain
            }
        }
    }

    // --- RESULT AGGREGATION ---
    let overallValid = speciesValid && behaviorValid && countValid;
    if (photoConsistent === false) overallValid = false;

    let status: 'valid' | 'invalid' | 'suspicious' = 'valid';
    if (!overallValid) status = 'invalid';
    else if (photoConsistent === null && aiPrediction) status = 'suspicious'; // AI wasn't sure
    else if (!aiPrediction && overallValid) status = 'valid'; // Trust user if no photo

    // Confidence Score Calculation (0-100)
    // Start at 100, deduct for issues or missing proofs
    let score = 100;
    if (!speciesValid) score = 0;
    if (!behaviorValid) score -= 30;
    if (!countValid) score -= 20;
    if (photoConsistent === false) score -= 50;
    if (photoConsistent === null) score -= 10; // Uncertainty penalty
    if (score < 0) score = 0;

    return {
        species_valid: speciesValid,
        behavior_valid: behaviorValid,
        count_valid: countValid,
        photo_consistent: photoConsistent,
        overall_valid: overallValid,
        confidence_score: score,
        status: status,
        issues: issues
    };
};
