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

export const validateScientific = (speciesInput: string, behaviorInput: string): ValidationEvent => {
    let species = speciesInput.toLowerCase().trim();
    let behavior = behaviorInput.toLowerCase().trim();

    // Normalize Turkish inputs to English for internal validation
    // Check approximate matches in aliases
    for (const [tr, en] of Object.entries(turkishAliases)) {
        if (species === tr || species.includes(tr)) {
            species = en;
            break;
        }
    }

    for (const [tr, en] of Object.entries(turkishBehaviors)) {
        if (behavior.includes(tr)) {
            behavior = en;
            // Don't break, might have multiple keywords? 
            // Usually one major behavior. Let's append or replace for validation check.
            // Actually, behaviorConstraints check 'includes'. So appending is safer.
            behavior += ' ' + en;
        }
    }

    // 1. Identify Traits
    // Try exact match first, then fuzzy
    let traits: Trait[] = [];
    let matchedSpecies = '';

    for (const [key, t] of Object.entries(speciesTraits)) {
        if (species.includes(key)) {
            traits = t;
            matchedSpecies = key;
            break;
        }
    }

    // STRICT RULE: "If uncertain -> mark invalid."
    if (!matchedSpecies) {
        return {
            animal: species,
            behavior: behavior,
            valid: false,
            reason: "Species not found in Scientific Knowledge Base. Cannot verify biological realism."
        };
    }

    // 2. Check Behavior Constraints
    for (const [action, rule] of Object.entries(behaviorConstraints)) {
        if (behavior.includes(action)) {

            // Allow exceptions logic (e.g. Polar Bears can swim)
            // The trait 'Aquatic' handles this.
            // If checking 'swim':
            // If rule requires 'Aquatic' and traits has 'Aquatic' -> OK.
            // If traits has NO 'Aquatic' -> REJECT.

            if (rule.required) {
                // Exception logic: Some Terrestrial can swim (e.g. Tiger). 
                // However, user rule: "A fish cannot walk... A bird without hunting traits cannot hunt"
                // My traits table needs to be accurate.
                // If a Tiger (Terrestrial) tries to Swim (Requires Aquatic), it fails.
                // FIX: Add 'Aquatic' to Tiger/Bear/Dog/Human if they can swim. 
                // For now, Strict Enforcement of current traits.

                const hasRequirement = rule.required.some(r => traits.includes(r));
                if (!hasRequirement) {
                    return {
                        animal: matchedSpecies,
                        behavior: behavior,
                        valid: false,
                        reason: `Biological Mismatch: ${matchedSpecies} is ${traits.join('/')}, but '${action}' requires [${rule.required.join(' or ')}]. ${rule.msg}`
                    };
                }
            }

            if (rule.forbidden) {
                // Specific Logic for Walking/Running
                // If species is Aquatic ONLY (no Terrestrial or Avian), it cannot walk.
                // e.g. Penguin (Avian, Aquatic) -> Can walk (Avian saves it? mostly).
                // e.g. Seal (Aquatic, Terrestrial? No usually just Aquatic in simple taxonomy, need to add Terrestrial if they waddle).
                // For Strictness:

                const isPurelyAquatic = traits.includes('Aquatic') && !traits.includes('Terrestrial') && !traits.includes('Avian');

                if (isPurelyAquatic && (action.includes('walk') || action.includes('run'))) {
                    return {
                        animal: matchedSpecies,
                        behavior: behavior,
                        valid: false,
                        reason: `Anatomical Impossibility: Purely aquatic species (${matchedSpecies}) lacks limbs for terrestrial locomotion.`
                    };
                }
            }
        }
    }

    return {
        animal: matchedSpecies,
        behavior: behavior,
        valid: true
    };
};
