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
            scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://cdn.tailwindcss.com"],
            scriptSrcAttr: ["'unsafe-inline'"], // allow onclick="..." attributes in HTML
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com", "https://cdnjs.cloudflare.com", "https://cdn.tailwindcss.com"],
            imgSrc: ["'self'", "data:", "blob:", "https://*.basemaps.cartocdn.com", "https://unpkg.com", "https://*.tile.openstreetmap.org", "https://res.cloudinary.com", "https://api.dicebear.com", "https://images.unsplash.com", "https://upload.wikimedia.org", "https://*.wikimedia.org", "https://inaturalist-open-data.s3.amazonaws.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            connectSrc: ["'self'", "https://*.tile.openstreetmap.org", "https://*.basemaps.cartocdn.com", "https://en.wikipedia.org", "https://api.inaturalist.org"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// --- Frontend Static Files ---
// __dirname is <project-root>/dist at runtime; step up one level to reach frontend/
const frontendPublic = path.join(__dirname, '../frontend/public');
const frontendSrc    = path.join(__dirname, '../frontend/src');

// 1. Serve 'public' at root (for index.html, styles.css, uploads)
app.use(express.static(frontendPublic));

// 2. Serve 'src' at /src (for app.js, i18n.js modules)
app.use('/src', express.static(frontendSrc));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/observations', observationRoutes);

// Serve index.html for any non-API route (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPublic, 'index.html'));
});

app.use(errorHandler);

export default app;