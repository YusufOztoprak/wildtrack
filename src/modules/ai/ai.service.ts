// Mock AI Service
// In a real scenario, this would call TensorFlow.js or an external API (OpenAI, HuggingFace)

export const predictSpecies = async (imagePath: string): Promise<{ species: string; confidence: number } | null> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock Logic for "All Wild Animals"
    // If the filename contains the species name, we confirm it with high confidence.
    // This allows the user to demo ANY animal by just naming the file correctly.
    // e.g. "lion-attack.jpg" -> "Lion"

    // Extract filename from path
    const path = await import('path');
    const filename = path.basename(imagePath).toLowerCase();

    // Check if filename contains a known animal name from a simple heuristic
    // (In a real app, this would be a real AI model)
    const knownAnimals = [
        'wolf', 'bear', 'eagle', 'lion', 'tiger', 'leopard', 'cheetah',
        'elephant', 'giraffe', 'zebra', 'rhino', 'hippo', 'crocodile',
        'snake', 'fox', 'deer', 'moose', 'bison', 'boar', 'lynx',
        'cougar', 'jaguar', 'monkey', 'gorilla', 'chimpanzee', 'kangaroo',
        'koala', 'panda', 'polar bear', 'owl', 'hawk', 'falcon',
        'vulture', 'shark', 'whale', 'dolphin', 'rabbit', 'panther', 'hyena',
        'wild boar', 'rhinoceros', 'mongoose', 'porcupine', 'wombat', 'meerkat',
        'otter', 'hedgehog', 'possum', 'chipmunk', 'raccoon', 'jackal', 'hare',
        'mole', 'alligator', 'monitor lizard', 'oryx', 'elk', 'badger', 'dinosaur',
        'pangolin', 'okapi', 'camel', 'wild cat', 'coyote', 'aardvark', 'antelope',
        'alpine goat', 'komodo dragon', 'bearded dragon', 'royal bengal tiger',
        'flying squirrel', 'emu', 'eel', 'asiatic lion', 'armadillo', 'beaver',
        'emperor penguin', 'baboon', 'bat', 'chameleon', 'bull', 'giant panda',
        'chihuahua', 'orangutan', 'chinchillas', 'iguana', 'ibis', 'ibex',
        'king cobra', 'jellyfish', 'goose', 'walrus', 'seal', 'skink', 'markhor',
        'bull shark', 'arctic wolf', 'bulbul', 'bobcat', 'guinea pig', 'yak',
        'reindeer', 'puma', 'marten', 'squirrel monkey', 'caracal'
    ];

    for (const animal of knownAnimals) {
        if (filename.includes(animal)) {
            // Capitalize first letter
            const speciesName = animal.charAt(0).toUpperCase() + animal.slice(1);
            return { species: speciesName, confidence: 0.96 };
        }
    }

    // Mock Logic for "Trap" words (Non-Animals)
    // If the file is named "car.jpg", "building.jpg", etc., we simulate a high-confidence MATCH
    // for a non-animal object. This allows testing the "Security Block" feature.
    const trapObjects = ['car', 'building', 'person', 'bike', 'plane', 'house', 'city'];
    for (const obj of trapObjects) {
        if (filename.includes(obj)) {
            // Capitalize
            const objectName = obj.charAt(0).toUpperCase() + obj.slice(1);
            return { species: objectName, confidence: 0.98 }; // High confidence "It is a Car"
        }
    }

    // Default strict fallback
    return {
        species: 'Unidentified Object',
        confidence: 0.2
    };
};
