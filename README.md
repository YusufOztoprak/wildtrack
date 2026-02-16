# 🐾 WildTrack: Advanced Wildlife Observation Platform

> **WildTrack** is a sophisticated, full-stack geospatial application designed for the precise logging and analysis of wildlife data. Built with modern web technologies, it features **strict scientific validation**, **AI integration**, and **secure geospatial data management**.



---

## 🎯 Project Purpose

WildTrack is engineered to bridge the gap between citizen science and rigorous ecological research. While traditional observation platforms often suffer from data noise and misidentification, WildTrack enforces a **Strict Biological Validation Protocol**. The system serves as a high-fidelity data ingestion engine for biodiversity monitoring, ensuring that every recorded observation is scientifically plausible and taxonomically accurate.

## 🌍 Why This Project Matters

In the face of accelerating biodiversity loss, accurate data is the cornerstone of effective conservation strategy. A *"garbage in, garbage out"* approach to wildlife data can lead to flawed research conclusions and misguided policy. WildTrack addresses this by implementing an **active validation layer** that filters out impossible biological combinations (e.g., anatomical constraints) and high-confidence mismatches before they enter the dataset.

## 🌱 Social & Environmental Impact

-   **Empowering Conservation:** Provides researchers with a clean, validated stream of data to track species migration and population density.
-   **Protecting Integrity:** Prevents the pollution of scientific datasets with false positives, preserving the reliability of ecological models.
-   **Awareness:** Visualizes local biodiversity through heatmaps, fostering a deeper connection between communities and their natural environment.

## 🔬 Scientific Motivation

The system is built on the principle of **Biological Consistency**. It integrates a rule-based inference engine that cross-references species traits (e.g., *Aquatic*, *Terrestrial*, *Avian*) against reported behaviors. This goes beyond simple logging; it models the physical constraints of the natural world to reject biologically impossible scenarios (e.g., *purely aquatic species engaging in terrestrial locomotion*).

## 💡 Real-World Value

WildTrack demonstrates how software architecture can enforce scientific rigor. It is designed for:
-   **Research Institutes:** As a pre-validated data collection node.
-   **National Parks:** For real-time monitoring of invasive or endangered species.
-   **Educational Entities:** As a tool to teach taxonomic classification and ecological interdependencies.

---

## 🌟 Key Features

### 🔬 Scientific Biological Validation Engine
WildTrack isn't just a form; it's a scientific tool.
-   **Trait-Based Logic:** The backend "engine" knows that *Sharks* are `Aquatic` and *Wolves* are `Terrestrial`.
-   **Behavioral Constraints:** Prevents impossible data entry (e.g., "A shark walking" or "A penguin flying").
-   **International Support:** Fully supports **English** and **Turkish** inputs, normalizing local names (e.g., "Kurt") to scientific standards before validation.

### 🛡️ Enterprise-Grade Security
-   **Strict AI Verification:**
    -   Integrated AI analysis for image uploads.
    -   **Fail-Closed Security:** If uploaded evidence does not match the claim (e.g., Image of a Cat, Claim of a Wolf), the system **blocks** the request and deletes the file.
    -   High-confidence threshold (>80%) for rejection.
-   **Data Integrity:**
    -   **Geospatial Bounds:** Validates coordinates are within Earth's limits.
    -   **Sanity Checks:** Prevents unrealistic counts (e.g., herd of 1000 tigers).
-   **Infrastructure:**
    -   **Rate Limiting:** Protects against brute-force attacks.
    -   **Content Security Policy (CSP):** Mitigates XSS risks.
    -   **JWT Authentication:** Secure, stateless user sessions.

### 🌍 Geospatial Intelligence
-   **Interactive Mapping:** Built with **Leaflet.js** for responsive, mobile-friendly maps.
-   **Radius Search:** Efficient **PostGIS** queries to find sightings within specific kilometers.
-   **Heatmaps:** Visualize density of wildlife populations.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | **Node.js & Express** | High-performance REST API. |
| **Language** | **TypeScript** | Type-safe, robust code quality. |
| **Database** | **PostgreSQL** | Relational data integrity. |
| **ORM** | **Prisma** | Modern database access & migration. |
| **Geospatial** | **PostGIS** | Spatial extensions for PostgreSQL. |
| **Frontend** | **Vanilla JS (ES6+)** | Lightweight, fast, no-framework overhead. |
| **Maps** | **Leaflet** | Leading open-source mapping library. |
| **Container** | **Docker** | Consistent development environment. |

---

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18+)
-   PostgreSQL (with PostGIS extension enabled)
-   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/wildtrack.git
    cd wildtrack
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/wildtrack?schema=public"
    JWT_SECRET="your-super-secret-key"
    PORT=3000
    ```

4.  **Database Initialization**
    ```bash
    # Push schema to DB
    npx prisma db push

    # (Optional) Seed with scientific data
    npx ts-node src/utils/seed.ts
    ```

5.  **Run Application**
    ```bash
    # Development Mode
    npm run dev

    # Production Build
    npm run build
    npm start
    ```

---

## 🧪 Testing

We have included scripts to verify the integrity and security of the system:
-   `src/scripts/verify-no-image.ts`: Tests optional upload logic.
-   `src/scripts/clear-data.ts`: Purges database for fresh testing.

---

## 🇺🇦 Acknowledgements

This project proudly uses **Leaflet**, the leading open-source JavaScript library for mobile-friendly interactive maps.

We would like to acknowledge **Volodymyr Agafonkin**, the creator of Leaflet. A Ukrainian citizen, Volodymyr continued to support the open-source community even while facing the hardships of the war in Ukraine starting in 2022. His resilience and dedication are an inspiration to developers worldwide.

Map data provided by **OpenStreetMap**.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
