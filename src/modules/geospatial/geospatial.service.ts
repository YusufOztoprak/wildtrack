
// Wallace Line Coordinate Logic
// Separates Indomalayan (Asia) from Australasian (Australia/Wallacea) realms.
// Simplified for MVP: A set of line segments.

interface Point {
    lat: number;
    lng: number;
}

export type EcoRegion = 'Asia' | 'Australia' | 'Unknown';

// Approximate Wallace Line coordinates (North to South)
// 1. East of Philippines
// 2. Between Borneo and Sulawesi (Makassar Strait)
// 3. Between Bali and Lombok (Lombok Strait)
const WALLACE_LINE_POINTS: Point[] = [
    { lat: 20.0, lng: 125.0 }, // North East of Philippines
    { lat: 5.0, lng: 125.0 },  // South of Philippines
    { lat: 0.0, lng: 118.0 },  // Makassar Strait (Equator)
    { lat: -5.0, lng: 117.0 }, // Middle of Makassar Strait
    { lat: -8.5, lng: 115.5 }, // Lombok Strait (Between Bali & Lombok)
    { lat: -15.0, lng: 115.0 } // South into Indian Ocean
];

export const getEcoRegion = (lat: number, lng: number): EcoRegion => {
    // 1. Check if point is roughly within the relevant longitude/latitude box
    // If it's too far west (e.g. Turkey, Europe, Africa) -> Asia (Indomalayan/Palearctic general bucket for this app)
    // If it's too far east (Australia, NZ) -> Australia
    // If it's in the Americas -> Unknown (for now) or handle separately.

    // STRICT SIMPLIFICATION FOR DEMO:
    // Everything West of line is "Asia" (includes Europe/Africa for this context).
    // Everything East of line is "Australia".

    // Algorithm: "Ray Casting" or simply "Is point Left or Right of the line segment?"
    // Since the line goes roughly North -> South, we can check latitude segments.

    // Find the two points the latitude falls between
    for (let i = 0; i < WALLACE_LINE_POINTS.length - 1; i++) {
        const p1 = WALLACE_LINE_POINTS[i];
        const p2 = WALLACE_LINE_POINTS[i + 1];

        // Check if lat is between p1.lat and p2.lat
        // Note: lats are decreasing (20 -> -15)
        if (lat <= Math.max(p1.lat, p2.lat) && lat >= Math.min(p1.lat, p2.lat)) {
            // Interpolate longitude on the line at this latitude
            const slope = (p2.lng - p1.lng) / (p2.lat - p1.lat);
            const lineLng = p1.lng + (lat - p1.lat) * slope;

            if (lng < lineLng) return 'Asia';
            return 'Australia';
        }
    }

    // If outside the latitude range of the defined line:
    if (lat > 20.0) {
        // North of Philippines
        // If lng < 125 -> Asia, else Australia (Pacific)
        return lng < 125.0 ? 'Asia' : 'Australia';
    }
    if (lat < -15.0) {
        // South of Java/Lombok
        return lng < 115.0 ? 'Asia' : 'Australia';
    }

    return 'Unknown';
};
