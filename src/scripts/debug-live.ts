
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

async function test() {
    console.log('Testing Observation Create (JSON Mode)...');

    // 1. Create/Get User
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

    // 2. Generate Token
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('JWT_SECRET missing in env!');
        return;
    }
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '1h' });
    console.log('Token:', token.substring(0, 10) + '...');

    // 3. Send Request
    try {
        console.log('Sending POST to http://localhost:3000/api/observations');
        const res = await fetch('http://localhost:3000/api/observations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                species: 'Fish',
                count: 1,
                latitude: 40.0,
                longitude: 30.0,
                behavior: 'Walking'
            })
        });

        const text = await res.text();
        console.log('Response Status:', res.status);
        console.log('Response Body:', text);

        try {
            const json = JSON.parse(text);
            console.log('✅ JSON parsed successfully.');
            if (!json.success) console.error('❌ API returned success: false');
        } catch {
            console.error('❌ JSON INVALID! The server returned non-JSON content.');
        }

    } catch (e) {
        console.error('Fetch Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
