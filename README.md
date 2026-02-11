# 🐾 WildTrack

**WildTrack** is a modern, geospatial wildlife observation platform. It allows researchers and nature enthusiasts to log animal sightings, upload photos, and visualize data on an interactive map.

Built with performance and scalability in mind, WildTrack leverages the power of **PostGIS** for spatial queries and **Leaflet** for a seamless map experience.

---

## 🚀 Features

-   **📍 Geospatial Tracking:** Log precise coordinates (Latitude/Longitude) of wildlife sightings.
-   **🔍 Radius Search:** Find all observations within a specific kilometer radius (e.g., "Show all wolves within 20km").
-   **📸 Photo Evidence:** Upload and view photos of observed animals directly on the map.
-   **🗺️ Interactive Map:** Full-screen, responsive map interface.
-   **🔐 Secure Auth:** JWT-based authentication for secure data entry.

---

## 🛠️ Tech Stack

-   **Backend:** Node.js, Express, TypeScript
-   **Database:** PostgreSQL, Prisma ORM, PostGIS (Spatial Extension)
-   **Frontend:** Vanilla JS (ES Modules), Leaflet.js, CSS3
-   **Tools:** Docker (optional), Multer (File Uploads)

---

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/wildtrack.git
    cd wildtrack
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Copy `.env.example` to `.env` and update your database credentials.
    ```bash
    cp .env.example .env
    ```

4.  **Setup Database:**
    ```bash
    # Enable PostGIS and push schema
    npx prisma db push
    
    # (Optional) Seed with sample data
    npx ts-node src/utils/seed.ts
    ```

5.  **Run the Server:**
    ```bash
    npm run dev
    ```

6.  **Open in Browser:**
    Go to `http://localhost:3000`

---

## 🇺🇦 A Note on Leaflet

This project proudly uses **Leaflet**, the leading open-source JavaScript library for mobile-friendly interactive maps.

We would like to acknowledge **Volodymyr Agafonkin**, the creator of Leaflet. A Ukrainian citizen, Volodymyr continued to support the open-source community even while facing the hardships of the war in Ukraine starting in 2022. His resilience and dedication are an inspiration to developers worldwide.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
