import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EMAIL = 'yusufoztoprak35@gmail.com';

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    console.log(`No user found with email: ${EMAIL}`);
    return;
  }
  console.log(`Found user: ${user.name} (id: ${user.id})`);

  const observationIds = (
    await prisma.observation.findMany({
      where: { authorId: user.id },
      select: { id: true },
    })
  ).map(o => o.id);
  console.log(`Found ${observationIds.length} observation(s) to clean up`);

  const { count: comments } = await prisma.comment.deleteMany({
    where: { userId: user.id },
  });
  console.log(`Deleted ${comments} comment(s)`);

  const { count: identifications } = await prisma.identification.deleteMany({
    where: { userId: user.id },
  });
  console.log(`Deleted ${identifications} identification(s)`);

  const { count: media } = await prisma.observationMedia.deleteMany({
    where: { observationId: { in: observationIds } },
  });
  console.log(`Deleted ${media} media record(s)`);

  const { count: observations } = await prisma.observation.deleteMany({
    where: { authorId: user.id },
  });
  console.log(`Deleted ${observations} observation(s)`);

  await prisma.user.delete({ where: { id: user.id } });
  console.log(`Deleted user: ${EMAIL}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
