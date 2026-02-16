import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create User
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@wildtrack.com' },
    update: {},
    create: {
      email: 'admin@wildtrack.com',
      password: hashedPassword,
      name: 'Admin User',
    },
  });

  console.log(`👤 User created: ${user.email}`);

  // 2. Create Observations
  // Wolf in Istanbul (Belgrad Forest)
  await prisma.observation.create({
    data: {
      species: 'Wolf',
      count: 3,
      latitude: 41.1792,
      longitude: 28.9497,
      behavior: 'Hunting',
      authorId: user.id,
      imageUrl: null
    },
  });

  // Fox in Istanbul (Sariyer)
  await prisma.observation.create({
    data: {
      species: 'Fox',
      count: 1,
      latitude: 41.1633,
      longitude: 29.0542,
      behavior: 'Resting',
      authorId: user.id,
      imageUrl: null
    },
  });

  // Bear in Antalya (Termessos) - Far away
  await prisma.observation.create({
    data: {
      species: 'Bear',
      count: 1,
      latitude: 36.9823,
      longitude: 30.4648,
      behavior: 'Walking',
      authorId: user.id,
      imageUrl: null
    },
  });

  console.log('🐾 Observations seeded: Wolf, Fox, Bear');
  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
