# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start development server (with hot reload)
npm run dev

# Build TypeScript to dist/
npm run build

# Start production server (requires build first)
npm start

# Database setup (requires Docker running)
docker-compose up -d
npx prisma generate
npx prisma db push --force-reset

# Seed taxonomy tree and sample data
npx ts-node src/utils/seed.ts

# Run a single script (e.g. test-wallace)
npx ts-node src/scripts/test-wallace.ts
```

There are no test scripts in package.json. No linter is configured.

## Architecture

WildTrack is a full-stack wildlife observation app (iNaturalist-style) served as a monolith. Express serves both the REST API at `/api/*` and the vanilla JS SPA from `frontend/`.

### Backend (`src/`)

Module layout:
- `modules/auth/` — JWT-based registration & login (`auth.service.ts`, `auth.routes.ts`, `auth.schema.ts`, `auth.controller.ts`)
- `modules/observation/` — Core domain:
  - `observation.service.ts` — CRUD for observations, fires consensus after ID creation
  - `community.service.ts` — **Consensus algorithm**: promotes an observation to `RESEARCH_GRADE` when a taxon reaches ≥2 votes AND >66% of all IDs
  - `observation.controller.ts` / `observation.routes.ts` — REST handlers
  - `observation.schema.ts` — Zod validation schemas
- `modules/ai/ai.service.ts` — Mock species-detection service (checks filename for "wolf"; replace with real ML later)
- `modules/validation/scientific.validator.ts` — Scientific plausibility engine: checks species against `knowledgeBase.ts`, validates behavior/trait combinations (AQUATIC/TERRESTRIAL/AVIAN), cross-checks AI prediction vs user-reported species
- `modules/geospatial/geospatial.service.ts` — Wallace Line classifier: determines if coordinates are in `Asia` or `Australia` biogeographic realm using line-segment interpolation
- `middlewares/auth.middleware.ts` — JWT guard (`authenticate` / `protect`); attaches `req.user = { userId, email }`
- `utils/seed.ts` — Populates taxonomy hierarchy (Kingdom → Species) and demo users/observations
- `utils/jwt.ts` — JWT sign/verify helpers

### Database (Prisma + PostgreSQL)

Key models and relationships:
- `Taxon` — self-referential hierarchy via `parentId` (Kingdom → Phylum → Class → Order → Family → Genus → Species)
- `Observation` — has `status: VerificationStatus` (CASUAL / NEEDS_ID / RESEARCH_GRADE), `taxonId` (set by consensus), `authorId`, spatial coords, and relations to `ObservationMedia`, `Identification[]`, `Comment[]`
- `Identification` — a user's species suggestion on an observation; triggers `updateCommunityConsensus()` after creation
- `Comment` — free-text community comment on an observation

Schema is managed via `prisma db push` (no migration history); `npx prisma generate` is required after any schema change.

### Frontend (`frontend/`)

Vanilla JS SPA (`frontend/src/app.js`) served from `frontend/public/index.html`. Uses Leaflet.js for the map view, Tailwind CSS via CDN. No build step — files are served statically by Express.

### Environment

Copy `.env.example` → `.env`. Required variables:
- `DATABASE_URL` — PostgreSQL connection string (default points to Docker Compose container)
- `PORT` — defaults to 3000
- `NODE_ENV`
- `JWT_SECRET` — must be set for auth to work (not in `.env.example`, add it)
