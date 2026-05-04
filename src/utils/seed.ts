import { PrismaClient, Rank } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log('Database already seeded — skipping.');
    return;
  }

  console.log('Seeding database...');

  const animalia = await prisma.taxon.create({
    data: { name: 'Animalia', commonName: 'Animals', rank: Rank.KINGDOM },
  });

  const mammalia = await prisma.taxon.create({
    data: { name: 'Mammalia', commonName: 'Mammals', rank: Rank.CLASS, parentId: animalia.id },
  });

  const reptilia = await prisma.taxon.create({
    data: { name: 'Reptilia', commonName: 'Reptiles', rank: Rank.CLASS, parentId: animalia.id },
  });

  const equidae = await prisma.taxon.create({
    data: { name: 'Equidae', commonName: 'Horses & Zebras', rank: Rank.FAMILY, parentId: mammalia.id },
  });
  const canidae = await prisma.taxon.create({
    data: { name: 'Canidae', commonName: 'Canids', rank: Rank.FAMILY, parentId: mammalia.id },
  });
  const delphinidae = await prisma.taxon.create({
    data: { name: 'Delphinidae', commonName: 'Oceanic Dolphins', rank: Rank.FAMILY, parentId: mammalia.id },
  });

  await prisma.taxon.create({
    data: { name: 'Equus quagga', commonName: 'Plains Zebra', rank: Rank.SPECIES, parentId: equidae.id },
  });
  await prisma.taxon.create({
    data: { name: 'Canis lupus', commonName: 'Gray Wolf', rank: Rank.SPECIES, parentId: canidae.id },
  });
  await prisma.taxon.create({
    data: { name: 'Tursiops truncatus', commonName: 'Bottlenose Dolphin', rank: Rank.SPECIES, parentId: delphinidae.id },
  });

  const crocodylidae = await prisma.taxon.create({
    data: { name: 'Crocodylidae', commonName: 'Crocodiles', rank: Rank.FAMILY, parentId: reptilia.id },
  });
  await prisma.taxon.create({
    data: { name: 'Crocodylus porosus', commonName: 'Saltwater Crocodile', rank: Rank.SPECIES, parentId: crocodylidae.id },
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.user.create({
    data: {
      email: 'alice@wildtrack.app',
      password: passwordHash,
      name: 'Alice Nakamura',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    },
  });

  await prisma.user.create({
    data: {
      email: 'ben@wildtrack.app',
      password: passwordHash,
      name: 'Ben Okafor',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ben',
    },
  });

  console.log('Seeded: 11 taxa, 2 demo users.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
