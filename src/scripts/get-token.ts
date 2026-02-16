
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

async function getToken() {
    const prisma = new PrismaClient();
    let user = await prisma.user.findFirst({ where: { email: 'debug@test.com' } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: 'debug@test.com',
                password: 'hash',
                name: 'Debug User'
            }
        });
    }

    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign({ userId: user.id }, secret!, { expiresIn: '1h' });
    console.log('TOKEN:' + token);
}

getToken();
