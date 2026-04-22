import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const camelObservations = await prisma.observation.findMany({
    where: {
      taxon: {
        name: { contains: 'camel', mode: 'insensitive' },
      },
    },
    include: { taxon: true },
  });

  if (camelObservations.length === 0) {
    console.log('No camel observations found.');
    return;
  }

  const ids = camelObservations.map(o => o.id);
  console.log(`Found ${ids.length} camel observation(s):`);
  camelObservations.forEach(o =>
    console.log(`  id=${o.id}  taxon="${o.taxon?.name}"  status=${o.status}`)
  );

  const { count: comments } = await prisma.comment.deleteMany({
    where: { observationId: { in: ids } },
  });
  console.log(`Deleted ${comments} comment(s)`);

  const { count: identifications } = await prisma.identification.deleteMany({
    where: { observationId: { in: ids } },
  });
  console.log(`Deleted ${identifications} identification(s)`);

  const { count: media } = await prisma.observationMedia.deleteMany({
    where: { observationId: { in: ids } },
  });
  console.log(`Deleted ${media} media record(s)`);

  const { count: observations } = await prisma.observation.deleteMany({
    where: { id: { in: ids } },
  });
  console.log(`Deleted ${observations} observation(s)`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
