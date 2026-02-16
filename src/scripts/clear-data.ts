
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function clearData() {
    console.log('🗑️  Starting System Purge...');

    // 1. Clear Database
    try {
        const deleted = await prisma.observation.deleteMany({});
        console.log(`✅ Database: Deleted ${deleted.count} observations.`);
    } catch (error) {
        console.error('❌ Database Error:', error);
    }

    // 2. Clear Uploads
    const uploadDir = path.join(process.cwd(), 'frontend/public/uploads');
    if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        let fileCount = 0;
        for (const file of files) {
            if (file !== '.gitkeep') {
                fs.unlinkSync(path.join(uploadDir, file));
                fileCount++;
            }
        }
        console.log(`✅ Storage: Deleted ${fileCount} files from uploads.`);
    }

    console.log('✨ System Cleaned Successfully.');
}

clearData()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
