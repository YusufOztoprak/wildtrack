import { PrismaClient } from '@prisma/client';

// Single test-scoped Prisma client — uses DATABASE_URL set by tests/setup/env.ts.
export const prisma = new PrismaClient();

// Delete all rows in dependency order so foreign-key constraints are satisfied.
export async function cleanDatabase(): Promise<void> {
  await prisma.comment.deleteMany({});
  await prisma.identification.deleteMany({});
  await prisma.observationMedia.deleteMany({});
  await prisma.observation.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.taxon.deleteMany({});
}
