
// Test Wallace Line Validation
import { validateScientific } from '../modules/validation/scientific.validator';

const testCases = [
    {
        name: 'Tiger in Turkey (Asia)',
        species: 'Tiger',
        lat: 39.0, // Turkey
        lng: 35.0,
        expectValid: true
    },
    {
        name: 'Kangaroo in Turkey (Australia species in Asia)',
        species: 'Kangaroo',
        lat: 39.0, // Turkey
        lng: 35.0,
        expectValid: false // Should fail
    },
    {
        name: 'Kangaroo in Sydney (Australia)',
        species: 'Kangaroo',
        lat: -33.8, // Sydney
        lng: 151.2,
        expectValid: true
    },
    {
        name: 'Tiger in Sydney (Asia species in Australia)',
        species: 'Tiger',
        lat: -33.8, // Sydney
        lng: 151.2,
        expectValid: false // Should fail
    },
    {
        name: 'Shark in Atlantic (Cosmopolitan)',
        species: 'Shark',
        lat: 40.0,
        lng: -40.0,
        expectValid: true
    }
];

console.log('--- WALLACE LINE BIOGEOGRAPHY TEST ---');

testCases.forEach(test => {
    const result = validateScientific(test.species, '', 1, test.lat, test.lng, null);
    const passed = result.biogeography_valid === test.expectValid;

    console.log(`Test: ${test.name}`);
    console.log(`   Expected: ${test.expectValid ? 'Valid' : 'Invalid'}`);
    console.log(`   Got:      ${result.biogeography_valid ? 'Valid' : 'Invalid'}`);
    console.log(`   Status:   ${passed ? 'PASS ✅' : 'FAIL ❌'}`);
    if (!passed) console.log('   Issues:', result.issues);
    console.log('---');
});
