import { MapManager } from './map/map.js';
import { ObservationForm } from './ui/observation-form.js';
import { ObservationService } from './services/observation.service.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("WildTrack Frontend Initializing...");

    // 1. Initialize UI Form (passed to map for callbacks)
    // We need to create the form instance first, but it needs the map manager...
    // Let's create MapManager first with a placeholder callback, then link them.
    
    let form; 

    const mapManager = new MapManager('map', (latlng) => {
        if (form) {
            form.show(latlng);
        }
    });

    form = new ObservationForm('form-container', 'observation-form', mapManager);

    // 2. Load existing observations
    const observations = await ObservationService.getAll();
    mapManager.renderObservations(observations);
});