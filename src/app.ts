import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import authRoutes from './modules/auth/auth.routes';
import observationRoutes from './modules/observation/observation.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

// Rate Limit: 100 requests per 15 minutes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.'
});

app.use(limiter);

// Security Headers with Custom CSP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:", "https://*.basemaps.cartocdn.com", "https://unpkg.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            connectSrc: ["'self'"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// --- Frontend Static Files ---
// 1. Serve 'public' at root (for index.html, styles.css, uploads)
app.use(express.static(path.join(process.cwd(), 'frontend/public')));

// 2. Serve 'src' at /src (for app.js, i18n.js modules)
app.use('/src', express.static(path.join(process.cwd(), 'frontend/src')));

// --- API Rotaları ---
app.use('/api/auth', authRoutes);
app.use('/api/observations', observationRoutes);

app.use(errorHandler);

// Serve index.html for any other route (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

export default app;