export class MapManager {
    constructor(mapId, onClickCallback) {
        // Initialize Leaflet Map
        // 41.0082, 28.9784 is Istanbul
        this.map = L.map(mapId).setView([41.0082, 28.9784], 10);

        // Add OpenStreetMap Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Handle Map Clicks
        this.map.on('click', (e) => {
            onClickCallback(e.latlng);
        });
    }

    addMarker(observation) {
        const { latitude, longitude, species, count, imageUrl } = observation;

        let popupContent = `<b>${species}</b><br>Count: ${count}`;
        
        if (imageUrl) {
            // Ensure the image path is correct relative to the server
            popupContent += `<br><img src="${imageUrl}" class="popup-image" alt="${species}">`;
        }

        L.marker([latitude, longitude])
            .addTo(this.map)
            .bindPopup(popupContent);
    }

    renderObservations(observations) {
        observations.forEach(obs => this.addMarker(obs));
    }
}