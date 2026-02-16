import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RegisterInput, LoginInput } from './auth.schema';
import env from '../../utils/env';

const prisma = new PrismaClient();

export const register = async (input: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new Error('Bu email adresi zaten kullanımda.');
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      name: input.name,
    },
  });

  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '1d' });

  return { user: { id: user.id, email: user.email, name: user.name }, token };
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new Error('Geçersiz email veya şifre.');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);

  if (!isPasswordValid) {
    throw new Error('Geçersiz email veya şifre.');
  }

  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '1d' });

  return { user: { id: user.id, email: user.email, name: user.name }, token };
};
