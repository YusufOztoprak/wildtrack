import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './modules/auth/auth.routes';
import observationRoutes from './modules/observation/observation.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

// --- Frontend Statik Dosya Ayarları ---

// 1. Ana Sayfa (index.html) için 'frontend/public' klasörünü sun
app.use(express.static(path.join(process.cwd(), 'frontend/public')));

// 2. Modüler JS dosyaları için 'frontend/src' klasörünü '/src' yolundan sun
app.use('/src', express.static(path.join(process.cwd(), 'frontend/src')));

// 3. Yüklenen resimler için 'frontend/public/uploads' klasörünü '/uploads' yolundan sun
app.use('/uploads', express.static(path.join(process.cwd(), 'frontend/public/uploads')));

// --- API Rotaları ---
app.use('/api/auth', authRoutes);
app.use('/api/observations', observationRoutes);

app.use(errorHandler);

export default app;