import { PrismaClient, Rank, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const force = process.argv.includes('--force');
  if (!force) {
    const existing = await prisma.user.count();
    if (existing > 0) {
      console.log('Database already seeded — skipping.');
      return;
    }
  } else {
    console.log('--force flag detected — clearing existing data...');
    await prisma.comment.deleteMany();
    await prisma.identification.deleteMany();
    await prisma.observationMedia.deleteMany();
    await prisma.observation.deleteMany();
    await prisma.user.deleteMany();
    await prisma.taxon.deleteMany();
  }

  console.log('Seeding database...');

  // ── 1. Taxonomy ──────────────────────────────────────────────────────────────
  const animalia = await prisma.taxon.create({
    data: { name: 'Animalia', commonName: 'Animals', rank: Rank.KINGDOM },
  });

  const mammalia = await prisma.taxon.create({
    data: { name: 'Mammalia', commonName: 'Mammals', rank: Rank.CLASS, parentId: animalia.id },
  });

  const reptilia = await prisma.taxon.create({
    data: { name: 'Reptilia', commonName: 'Reptiles', rank: Rank.CLASS, parentId: animalia.id },
  });

  // Mammals
  const equidae = await prisma.taxon.create({
    data: { name: 'Equidae', commonName: 'Horses & Zebras', rank: Rank.FAMILY, parentId: mammalia.id },
  });
  const canidae = await prisma.taxon.create({
    data: { name: 'Canidae', commonName: 'Canids', rank: Rank.FAMILY, parentId: mammalia.id },
  });
  const delphinidae = await prisma.taxon.create({
    data: { name: 'Delphinidae', commonName: 'Oceanic Dolphins', rank: Rank.FAMILY, parentId: mammalia.id },
  });

  const zebra = await prisma.taxon.create({
    data: { name: 'Equus quagga', commonName: 'Plains Zebra', rank: Rank.SPECIES, parentId: equidae.id },
  });
  const wolf = await prisma.taxon.create({
    data: { name: 'Canis lupus', commonName: 'Gray Wolf', rank: Rank.SPECIES, parentId: canidae.id },
  });
  const dolphin = await prisma.taxon.create({
    data: { name: 'Tursiops truncatus', commonName: 'Bottlenose Dolphin', rank: Rank.SPECIES, parentId: delphinidae.id },
  });

  // Reptiles
  const crocodylidae = await prisma.taxon.create({
    data: { name: 'Crocodylidae', commonName: 'Crocodiles', rank: Rank.FAMILY, parentId: reptilia.id },
  });
  const croc = await prisma.taxon.create({
    data: { name: 'Crocodylus porosus', commonName: 'Saltwater Crocodile', rank: Rank.SPECIES, parentId: crocodylidae.id },
  });

  // ── 2. Users ─────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.create({
    data: {
      email: 'alice@wildtrack.app',
      password: passwordHash,
      name: 'Alice Nakamura',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    },
  });

  const ben = await prisma.user.create({
    data: {
      email: 'ben@wildtrack.app',
      password: passwordHash,
      name: 'Ben Okafor',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ben',
    },
  });

  // ── 3. Observations ──────────────────────────────────────────────────────────
  const obsZebra = await prisma.observation.create({
    data: {
      authorId: alice.id,
      taxonId: zebra.id,
      status: VerificationStatus.RESEARCH_GRADE,
      description: 'Small herd of 6–8 plains zebra grazing near the Athi River. One juvenile visible.',
      behavior: 'GRAZING',
      latitude: -1.2,
      longitude: 36.8,
      observedAt: new Date(Date.now() - 86400000 * 3),
      media: {
        create: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Plains_Zebra_Equus_quagga.jpg/1280px-Plains_Zebra_Equus_quagga.jpg' }],
      },
    },
  });

  const obsWolf = await prisma.observation.create({
    data: {
      authorId: ben.id,
      taxonId: wolf.id,
      status: VerificationStatus.NEEDS_ID,
      description: 'Young wolf or wolf-dog hybrid spotted near forest edge settlement. Lean build, alert posture, approximately 20kg.',
      behavior: 'FORAGING',
      latitude: 65.0,
      longitude: 14.0,
      observedAt: new Date(Date.now() - 86400000 * 1),
      media: {
        create: [{ url: 'https://res.cloudinary.com/dneo1twzx/image/upload/v1776855300/wildtrack/gjabyhzwnljks5ysvlvn.jpg' }],
      },
    },
  });

  const obsCroc = await prisma.observation.create({
    data: {
      authorId: alice.id,
      taxonId: croc.id,
      status: VerificationStatus.RESEARCH_GRADE,
      description: 'Saltwater crocodile observed near riverbank, partially submerged. Estimated 3m length, actively patrolling waterway edge.',
      behavior: 'FORAGING',
      latitude: -12.4,
      longitude: 130.8,
      observedAt: new Date(Date.now() - 86400000 * 5),
      media: {
        create: [{ url: 'https://res.cloudinary.com/dneo1twzx/image/upload/v1776847313/wildtrack/qpcruqiace2neh6g0fyu.jpg' }],
      },
    },
  });

  const obsDolphin = await prisma.observation.create({
    data: {
      authorId: ben.id,
      taxonId: dolphin.id,
      status: VerificationStatus.RESEARCH_GRADE,
      description: 'Pod of ~12 bottlenose dolphins bow-riding a fishing vessel off the Strait of Messina.',
      behavior: 'SOCIALIZING',
      latitude: 38.0,
      longitude: 15.0,
      observedAt: new Date(Date.now() - 86400000 * 2),
      media: {
        create: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Tursiops_truncatus_01.jpg/1280px-Tursiops_truncatus_01.jpg' }],
      },
    },
  });

  // ── 4. Community identifications ─────────────────────────────────────────────
  await prisma.identification.createMany({
    data: [
      { observationId: obsZebra.id, userId: ben.id, taxonId: zebra.id, body: 'Confirmed Equus quagga — stripe pattern consistent with East African subspecies.' },
      { observationId: obsWolf.id, userId: alice.id, taxonId: wolf.id, body: 'Gait and coat match Canis lupus. Needs a second ID to reach research grade.' },
      { observationId: obsCroc.id, userId: ben.id, taxonId: croc.id, body: 'Scute pattern and size confirm C. porosus. Dominant male territory.' },
      { observationId: obsDolphin.id, userId: alice.id, taxonId: dolphin.id, body: 'Rostrum length and coloration match T. truncatus. Classic bow-riding behaviour.' },
    ],
  });

  // ── 5. Comments ──────────────────────────────────────────────────────────────
  await prisma.comment.createMany({
    data: [
      { observationId: obsZebra.id, userId: ben.id, body: 'Any photos of the juvenile? Would be useful for age-class estimates.' },
      { observationId: obsWolf.id, userId: alice.id, body: 'Could this be a dog-wolf hybrid? Ear shape looks slightly off.' },
      { observationId: obsCroc.id, userId: ben.id, body: 'Darwin Harbour area has a known population — consistent with recent survey data.' },
    ],
  });

  console.log('Seeded: 4 taxa trees, 2 users, 4 observations, 4 IDs, 3 comments.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
