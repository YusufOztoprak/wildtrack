import bcrypt from 'bcryptjs';
import prisma from '../../config/db';
import { signToken } from '../../utils/jwt';
import { z } from 'zod';
import { registerSchema, loginSchema } from './auth.schema';

export const register = async (data: z.infer<typeof registerSchema>) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
    },
  });
  const token = signToken({ id: user.id, email: user.email });
  return { user, token };
};

export const login = async (data: z.infer<typeof loginSchema>) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new Error('Invalid credentials');
  }
  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }
  const token = signToken({ id: user.id, email: user.email });
  return { user, token };
};