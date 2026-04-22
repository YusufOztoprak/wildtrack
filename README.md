# WildTrack

![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169e1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

Community wildlife observation platform with AI-assisted species identification and scientific validation. Inspired by iNaturalist.

**Live demo:** https://wildtrack-vud7.onrender.com

---

## Features

- **AI species identification** — uploads photos to the iNaturalist Vision API for automated species prediction with confidence scores
- **Scientific validation engine** — checks geographic plausibility, validates behavior against species traits (aquatic/terrestrial/avian), cross-references AI prediction against user-reported species
- **Wallace Line classifier** — determines whether an observation falls in the Asian or Australasian biogeographic realm using line-segment interpolation
- **Community consensus** — promotes observations to `RESEARCH_GRADE` when a taxon reaches ≥2 community identifications with >66% agreement
- **Interactive map** — Leaflet.js map with photo markers; click any marker to open a full observation panel
- **Wikipedia species panel** — inline species info pulled from the Wikipedia API on observation detail view
- **Cloudinary photo storage** — images uploaded as buffers directly to Cloudinary; original quality preserved
- **JWT authentication** — register/login with bcrypt-hashed passwords; protected API routes

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18, TypeScript |
| Framework | Express.js |
| Database | PostgreSQL 15 + Prisma ORM |
| Frontend | Vanilla JS SPA, Leaflet.js, Tailwind CSS |
| Storage | Cloudinary |
| AI | iNaturalist Vision API |
| Auth | JWT + bcryptjs |

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for local PostgreSQL)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/YusufOztoprak/wildtrack.git
cd wildtrack
npm install

# 2. Configure environment
cp .env.example .env
# Fill in: JWT_SECRET, CLOUDINARY_*, INATURALIST_API_TOKEN

# 3. Start database
docker-compose up -d
npx prisma generate
npx prisma db push

# 4. Seed with sample observations
npx ts-node src/utils/seed.ts

# 5. Start dev server
npm run dev
```

Open http://localhost:3000

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `INATURALIST_API_TOKEN` | No | iNaturalist Vision API token — AI prediction skipped if unset |
| `PORT` | No | Defaults to 3000 |

## API

```
POST   /api/auth/register
POST   /api/auth/login

GET    /api/observations
POST   /api/observations          # multipart/form-data with photo
GET    /api/observations/:id
POST   /api/observations/:id/identifications
POST   /api/observations/:id/comments
GET    /api/observations/taxa
```

## Deployment

The app is deployed as a monolith on Render using the included `Dockerfile`. On startup it runs `prisma db push` to sync the schema and seeds the database if empty.

Build command: `npm install && npm run build`  
Start command: `npx prisma db push && node dist/utils/seed.js && node dist/server.js`

## License

MIT
