import { validateScientific } from '../modules/validation/scientific.validator';

type Case = [string, Parameters<typeof validateScientific>];

const cases: Case[] = [
  ['camel in Arctic (reject)',       ['camel',      '',            1,  80.0,  20.0, null]],
  ['wolf in tropics (suspicious)',   ['wolf',       '',            1,   5.0,  36.0, null]],
  ['wolf in Ankara (valid)',         ['wolf',       '',            1,  39.9,  32.8, null]],
  ['polar_bear in tropics (reject)', ['polar_bear', '',            1,   2.0, 110.0, null]],
  ['deve in Arctic (reject)',        ['deve',       '',            1,  80.0,  20.0, null]],
  ['parrot hibernating (suspicious)',['parrot',     'hibernating', 1,  -3.0, 115.0, null]],
  ['bear hibernating (valid)',       ['bear',       'hibernating', 1,  48.0,  11.0, null]],
  ['polar_bear basking (suspicious)',['polar_bear', 'basking',     1,  72.0,  25.0, null]],
  ['wolf vs eagle AI (suspicious)',  ['wolf',       '',            1,  39.0,  35.0, { species: 'eagle', confidence: 0.85 }]],
  ['grey wolf vs wolf AI (valid)',   ['grey wolf',  '',            1,  39.0,  35.0, { species: 'wolf',  confidence: 0.90 }]],
  ['shark swimming in ocean (valid)',['shark',      'swimming',    1,  -5.0, 110.0, null]],
];

let pass = 0;
for (const [label, args] of cases) {
  const r = validateScientific(...args);
  const firstIssue = r.issues[0] ?? 'OK';
  console.log(`${r.status.padEnd(11)} | ${label.padEnd(35)} | ${firstIssue}`);
  if (!firstIssue.startsWith('Species')) pass++;
}
console.log(`\n${cases.length} cases executed.`);
