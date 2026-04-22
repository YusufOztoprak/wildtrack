# WildTrack - Community Wildlife Observation Platform 🌍🐾

WildTrack is a professional, open-source wildlife observation platform heavily inspired by iNaturalist. It allows users to record wildlife sightings, upload media, and collaboratively identify species through a community-driven consensus algorithm.

![WildTrack Banner](https://images.unsplash.com/photo-1501705388883-4ed8a543392c?auto=format&fit=crop&q=80&w=1200)

## 🌟 Key Features

*   **Hierarchical Taxonomy System:** Biological classification engine (Kingdom -> Species) powered by PostgreSQL.
*   **Community Consensus Algorithm:** Observations automatically graduate to `RESEARCH_GRADE` when the community reaches >66% agreement (minimum 2 votes) on a species identification.
*   **Rich Media Support:** Users can attach multiple images to a single observation.
*   **Interactive Mapping:** View global observations on a sleek Leaflet/Mapbox interface.
*   **Real-time Timeline:** Modal views displaying chronologically ordered community comments and ID suggestions.

## 🛠 Tech Stack

*   **Backend:** Node.js, Express, TypeScript
*   **Database:** PostgreSQL with PostGIS (Spatial queries)
*   **ORM:** Prisma
*   **Frontend:** Vanilla JavaScript, HTML5, Tailwind CSS, Leaflet.js
*   **Infrastructure:** Docker & Docker Compose

## 🚀 Getting Started (Local Development)

### Prerequisites
*   Node.js (v18+)
*   Docker & Docker Compose (for PostgreSQL database)

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/wildtrack.git
cd wildtrack
npm install
```

### 2. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```
*(Ensure Docker is running)*

### 3. Start Database & Migrate
Launch the Postgres container and push the schema:
```bash
docker-compose up -d
npx prisma generate
npx prisma db push --force-reset
```

### 4. Seed Initial Data
Populate the taxonomy tree and create sample users/observations:
```bash
npm run seed
```

### 5. Run the Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser!

## 🧠 Architecture Details

### The Consensus Algorithm (`community.service.ts`)
When a user suggests an ID (`Identification`), the system recalculates the observation's status:
1. Groups all IDs by `taxonId`.
2. Finds the taxon with the most votes.
3. If `votes >= 2` AND `votes > (total_ids * 0.66)`, status upgrades to `RESEARCH_GRADE`. Otherwise, it remains `NEEDS_ID`.

## 🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📜 License
[MIT](https://choosealicense.com/licenses/mit/)
