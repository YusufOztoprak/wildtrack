# WildTrack

[![Live Demo](https://img.shields.io/badge/Live%20Demo-wildtrack--vud7.onrender.com-brightgreen?logo=render&logoColor=white)](https://wildtrack-vud7.onrender.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169e1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448c5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Community wildlife observation platform with AI-assisted species identification and multi-layer scientific validation. Inspired by iNaturalist.

> **[Live Demo →](https://wildtrack-vud7.onrender.com)**

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Algorithms In Depth](#algorithms-in-depth)
  - [Quality Grade Engine](#quality-grade-engine)
  - [Community Consensus](#community-consensus)
  - [Scientific Validation Pipeline](#scientific-validation-pipeline)
  - [Wallace Line Guard](#wallace-line-guard)
  - [GBIF Geographic Sanity Check](#gbif-geographic-sanity-check)
- [Tech Stack](#tech-stack)
- [API Reference](#api-reference)
- [Local Setup](#local-setup)
- [Deployment](#deployment)
- [Screenshots](#screenshots)

---

## Overview

WildTrack is a full-stack wildlife observation platform where users submit geotagged photo observations of animals. Each submission passes through a multi-stage validation pipeline — AI photo recognition, scientific plausibility checks, biogeographic boundary enforcement, and GBIF-backed species range verification — before the community collaboratively identifies and grades it.

---

## Features

### AI Species Identification
Photos are sent to the **iNaturalist Computer Vision API** (`/v1/computervision/score_image`) as raw multipart buffers. The API returns a ranked list of species predictions; WildTrack takes the top result with its combined confidence score and stores it alongside the observation. The AI result is later cross-checked against the user-reported species during validation.

### Scientific Validation Pipeline
Every new observation is routed through a 7-check validator before being saved. Checks cover species existence, extinction status, climate zone plausibility, behavior–trait impossibilities, climate–behavior mismatches, and AI photo consistency. See [Scientific Validation Pipeline](#scientific-validation-pipeline) for full detail.

### Wallace Line Guard
A two-layer biogeographic boundary enforcer. It uses **cross-product geometry** (via Turf.js) to determine which side of Alfred Russel Wallace's historical line an observation falls on, then checks whether the reported species has a known evolutionary origin on the opposing continent. See [Wallace Line Guard](#wallace-line-guard).

### GBIF Geographic Sanity Check
Queries the **Global Biodiversity Information Facility** occurrence API in parallel: once for global records of the species, once for a 5°×5° bounding box around the observation coordinates. If a species has ≥10 global records but zero in the local bounding box, the observation is flagged with a `Location-Species Mismatch`. See [GBIF Geographic Sanity Check](#gbif-geographic-sanity-check).

### Community Consensus & Quality Grades
Observations flow through three verification statuses: `CASUAL` → `NEEDS_ID` → `RESEARCH_GRADE`. Community users add species identifications (votes); after each vote the consensus engine re-evaluates the observation in real time. See [Quality Grade Engine](#quality-grade-engine).

### Interactive Map
Leaflet.js map renders all observations as photo markers. Clicking a marker opens a full detail panel with the photo, species info, community identifications, and a Wikipedia inline article for the identified species — fetched live from the Wikipedia REST API.

### Cloudinary Photo Storage
Images are streamed as `Buffer` objects directly to Cloudinary via the Upload API using `upload_stream`. No temporary files are written to disk; original image quality is preserved.

### Taxonomy Hierarchy
Full Linnaean hierarchy (Kingdom → Phylum → Class → Order → Family → Genus → Species) stored in a self-referential `Taxon` table via Prisma. The seed script populates ~30 species across the tree.

### JWT Authentication
Registration and login with bcrypt-hashed passwords (10 rounds). JWT tokens signed with `HS256` are validated on all write endpoints via an `authenticate` middleware that attaches `{ userId, email }` to `req.user`.

---

## System Architecture

```
Browser (Vanilla JS SPA)
    │
    ├── GET /                  → frontend/public/index.html
    ├── GET /api/*             → Express REST API
    └── Static assets         → frontend/public/

Express (monolith)
    ├── modules/auth/          JWT register + login
    ├── modules/observation/   CRUD, consensus trigger
    ├── modules/ai/            iNaturalist Vision API client
    ├── modules/validation/    7-check scientific validator
    ├── modules/geospatial/    Wallace Line guard + GBIF validator
    └── middlewares/           JWT auth, Multer upload, error handler

PostgreSQL (Prisma ORM)
    ├── User
    ├── Taxon (self-referential hierarchy)
    ├── Observation (status, coordinates, locationMismatch flag)
    ├── ObservationMedia
    ├── Identification (community votes)
    └── Comment
```

---

## Algorithms In Depth

### Quality Grade Engine

**File:** `src/modules/observation/qualityGrade.ts`

Observations pass through a deterministic gate pipeline:

```
Input: ObservationSnapshot {
  hasMedia, hasObservedAt, hasGps,
  identifications: IdentificationVote[],
  hasLocationMismatch
}

Gate 1 — Required metadata
  ✗ → CASUAL

Gate 2 — Community consensus threshold
  ✗ → NEEDS_ID

Gate 3 — Location–species mismatch flag
  ✗ → NEEDS_ID

  ✓ → RESEARCH_GRADE
```

Gates are strictly ordered — an observation cannot skip `NEEDS_ID` to reach `RESEARCH_GRADE`. Each gate's failure is recorded in `failedGates[]` for transparency.

---

### Community Consensus

**File:** `src/modules/observation/community.service.ts`

Triggered after every new `Identification` (community vote). The algorithm:

1. **Deduplicate votes per user** — only the most recent vote per user is counted, preventing vote-stuffing via edits.
2. **Count votes per taxon** — builds a frequency map.
3. **Find the leading taxon** — the taxon with the most votes.
4. **Apply the 2/3 majority threshold** — the leading taxon must have `agreeCount / totalVoters > 2/3` AND `agreeCount >= 2` (absolute minimum, not just a ratio).
5. **Persist result** — updates `observation.status` and `observation.taxonId` atomically.

This mirrors iNaturalist's own consensus algorithm: a supermajority is required so a single dissenting expert can block premature Research Grade promotion.

---

### Scientific Validation Pipeline

**File:** `src/modules/validation/scientific.validator.ts`  
**Knowledge base:** `src/modules/validation/knowledgeBase.ts`

Seven sequential checks on every submission:

| # | Check | Pass | Fail action |
|---|-------|------|-------------|
| 1 | Species in local knowledge base | proceed | `suspicious` + iNaturalist fallback for broad geographic rules |
| 2 | Extinction check | not `dinosaur` | `rejected` immediately |
| 3 | Climate zone distance | zone distance < 2 | distance ≥ 2 → `rejected`; distance = 1 → `suspicious` |
| 4 | Behavior in known behaviors list | behavior matches | `suspicious` |
| 5 | Climate–behavior mismatch | no tropical hibernation, no polar basking | `suspicious` |
| 6 | Trait–behavior impossibility | purely aquatic species can't walk; terrestrial non-avians can't fly | `rejected` |
| 7 | AI photo consistency | names match OR AI confidence < 70% | `suspicious` with mismatch detail |

**Climate zone mapping** (latitude-based):

```
|lat| ≥ 65° → POLAR
|lat| ≥ 50° → SUBPOLAR
|lat| ≥ 23° → TEMPERATE
|lat| ≥ 10° → SUBTROPICAL
otherwise  → TROPICAL
```

**Species name normalization** resolves aliases before all checks: `"grey wolf"`, `"Canis lupus"`, `"kurt"` (Turkish) all resolve to `"wolf"`. Token overlap matching (`"grey wolf"` shares `"wolf"` with AI result `"wolf"`) prevents false photo-mismatch flags.

**iNaturalist fallback** — for species absent from the local knowledge base, the validator queries the iNaturalist Taxa API to obtain the `iconic_taxon_name` (Mammalia, Reptilia, Aves, etc.) and applies broad latitude rules (e.g., no non-polar mammals above 75°N).

---

### Wallace Line Guard

**File:** `src/modules/geospatial/wallaceLine.guard.ts`

Wallace's Line is encoded as a 6-point `LineString` (GeoJSON) running from northeast of the Philippines through the Makassar Strait and Lombok Strait:

```
[125.0,  20.0]  — NE Philippines
[125.0,   5.0]  — S Philippines
[118.0,   0.0]  — Makassar Strait (equator)
[117.0,  -5.0]  — Makassar Strait (mid)
[115.5,  -8.5]  — Lombok Strait (Bali ↔ Lombok)
[115.0, -15.0]  — South Indian Ocean
```

**Realm classification** uses the **cross-product (signed-area) test** on each line segment:

```
cross = (lng2 - lng1)(lat - lat1) - (lat2 - lat1)(lng - lng1)
cross > 0 → Australian realm
cross ≤ 0 → Oriental realm
```

This is geometrically exact for convex segments — superior to the naïve longitude interpolation used in the legacy `geospatial.service.ts`.

**Species origin lookup** — a curated set of 30 Australian marsupials (kangaroo, koala, wombat, Tasmanian devil, etc.) is checked against the reported species name. If the species has `evolutionaryOrigin = 'Australian'` but the observation falls in the `Oriental` realm with no captive flag, it is flagged for review with a descriptive reason.

**Distance from line** — Turf.js `nearestPointOnLine` computes the exact distance in kilometres between the observation point and the nearest point on the Wallace Line geometry, stored in the result for display.

---

### GBIF Geographic Sanity Check

**File:** `src/modules/geospatial/gbif.validator.ts`

Two parallel requests to the GBIF Occurrence API:

```
1. Global count:  GET /v1/occurrence/search?taxonKey=<key>&limit=0
2. Local count:   GET /v1/occurrence/search?taxonKey=<key>
                    &decimalLatitude=<lat±5°>
                    &decimalLongitude=<lng±5°>
                    &limit=0
```

Both fire concurrently via `Promise.all`. A mismatch is declared when:
- `globalCount >= 10` (species is well-documented globally), AND
- `nearbyCount === 0` (zero historical records within 10°×10° box)

The observation's `locationMismatch` flag is set to `true`, which blocks it from reaching `RESEARCH_GRADE` in the quality gate pipeline regardless of community votes.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js 18, TypeScript 5.4 | Type-safe server-side JS |
| Framework | Express 4 | HTTP routing, middleware |
| Database | PostgreSQL 15 | Relational data store |
| ORM | Prisma | Schema management, type-safe queries |
| Frontend | Vanilla JS SPA | No-framework interactive UI |
| Map | Leaflet.js | Geotagged observation map |
| CSS | Tailwind CSS (CDN) | Utility-first styling |
| Storage | Cloudinary | Cloud image hosting |
| AI | iNaturalist Vision API | Species photo recognition |
| Geospatial | Turf.js | Wallace Line geometry |
| External Data | GBIF Occurrence API | Species range validation |
| Auth | JWT + bcryptjs | Stateless authentication |
| Container | Docker + docker-compose | Local PostgreSQL setup |
| Deployment | Render + Dockerfile | Production hosting |

---

## API Reference

### Authentication

```
POST /api/auth/register
Content-Type: application/json

{ "name": "string", "email": "string", "password": "string" }

→ 201 { token, user: { id, name, email } }
```

```
POST /api/auth/login
Content-Type: application/json

{ "email": "string", "password": "string" }

→ 200 { token, user: { id, name, email } }
```

---

### Observations

#### List observations
```
GET /api/observations
GET /api/observations?lat=51.5&lng=-0.1&radius=50   # km radius filter

→ 200 Observation[]
```

#### Get single observation
```
GET /api/observations/:id

→ 200 Observation (with media, identifications, comments, taxon)
```

#### Create observation
```
POST /api/observations
Authorization: Bearer <token>
Content-Type: multipart/form-data

Fields:
  image        File      Photo (required)
  latitude     number    GPS latitude
  longitude    number    GPS longitude
  speciesName  string    User-reported species
  behavior     string    Observed behavior (e.g. "hunting")
  description  string    Free text notes
  observedAt   string    ISO 8601 datetime

→ 201 {
    observation: Observation,
    validation: {
      overall_valid, status, issues[], photo_consistent, normalized_species
    },
    aiPrediction: { species, commonName, confidence } | null,
    wallaceGuard: {
      realm, evolutionaryOrigin, distanceFromLineKm, flaggedForReview, reason
    } | null,
    gbifValidation: {
      valid, speciesName, nearbyCount, globalCount, error?
    } | null
  }
```

#### Add community identification
```
POST /api/observations/:id/identifications
Authorization: Bearer <token>
Content-Type: application/json

{ "taxonId": number, "body": "string" }

→ 201 { identification, consensus: { newStatus, consensusTaxonId } }
```

#### Add comment
```
POST /api/observations/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{ "body": "string" }

→ 201 Comment
```

---

### Taxonomy

```
GET /api/observations/taxa

→ 200 Taxon[]   (full hierarchy, used to populate species picker)
```

---

### Observation shape

```typescript
{
  id: number
  status: "CASUAL" | "NEEDS_ID" | "RESEARCH_GRADE"
  latitude: number
  longitude: number
  description: string | null
  behavior: string | null
  aiConfidence: number | null
  locationMismatch: boolean
  observedAt: string
  createdAt: string
  author: { id, name, avatarUrl }
  taxon: Taxon | null
  media: { id, url }[]
  identifications: Identification[]
  comments: Comment[]
}
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)

### Steps

```bash
# 1. Clone and install dependencies
git clone https://github.com/YusufOztoprak/wildtrack.git
cd wildtrack
npm install

# 2. Configure environment
cp .env.example .env
```

Edit `.env`:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/wildtrack` |
| `JWT_SECRET` | Yes | Any long random string |
| `CLOUDINARY_CLOUD_NAME` | Yes | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Yes | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Yes | From Cloudinary dashboard |
| `INATURALIST_API_TOKEN` | No | iNaturalist API token — AI prediction skipped if absent |
| `PORT` | No | Defaults to `3000` |

```bash
# 3. Start PostgreSQL
docker-compose up -d

# 4. Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# 5. Seed taxonomy tree and sample observations
npx ts-node src/utils/seed.ts

# 6. Start development server (hot reload)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Other commands

```bash
npm run build    # Compile TypeScript → dist/
npm start        # Run compiled production build

# Reset database completely
npx prisma db push --force-reset
npx ts-node src/utils/seed.ts
```

---

## Deployment

The app ships as a single monolith on **Render** using the included `Dockerfile`.

```dockerfile
# Build → dist/
# Startup sequence:
npx prisma db push && node dist/utils/seed.js && node dist/server.js
```

On every cold start:
1. `prisma db push` syncs the schema without destroying data.
2. `seed.js` checks if the taxonomy tree exists; skips if already populated.
3. `server.js` starts Express on `$PORT`.

**Render config:**
- Build command: `npm install && npm run build`
- Start command: `npx prisma db push && node dist/utils/seed.js && node dist/server.js`
- Environment: add all variables from the table above

---

## Screenshots

> Screenshots coming soon. Visit the [live demo](https://wildtrack-vud7.onrender.com) to explore the app.

| View | Description |
|---|---|
| Landing page | Hero section with feature highlights and call-to-action |
| Map view | Interactive Leaflet map with all observations as photo markers |
| Observation detail | Full species panel with Wikipedia article, AI prediction badge, and community IDs |
| Submit form | Multi-field upload form with real-time validation feedback |
| Validation response | JSON breakdown of all validation checks returned on submission |

---

## License

MIT
