import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Geçersiz email adresi'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
  name: z.string().min(2, 'İsim en az 2 karakter olmalı').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Geçersiz email adresi'),
  password: z.string().min(1, 'Şifre gereklidir'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
