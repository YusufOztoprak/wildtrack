import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔌 Enabling PostGIS extension...');
    // This raw SQL command enables the PostGIS extension in PostgreSQL
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    console.log('✅ PostGIS enabled successfully!');
  } catch (error) {
    console.error('❌ Error enabling PostGIS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
