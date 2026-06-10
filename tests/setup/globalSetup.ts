import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

export default async function globalSetup() {
  dotenv.config({ path: path.join(__dirname, '../../.env.test') });

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL not set in .env.test');

  console.log('\n[test] Pushing Prisma schema to test database...');

  execSync('npx prisma db push --accept-data-loss --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl },
  });

  console.log('[test] Test database ready.\n');
}
