import { ObservationService } from '../services/observation.service.js';

export class ObservationForm {
    constructor(formContainerId, formId, mapManager) {
        this.container = document.getElementById(formContainerId);
        this.form = document.getElementById(formId);
        this.mapManager = mapManager;
        
        this.initEventListeners();
    }

    show(latlng) {
        this.container.classList.remove('hidden');
        document.getElementById('lat').value = latlng.lat;
        document.getElementById('lng').value = latlng.lng;
        document.getElementById('species').focus();
    }

    hide() {
        this.container.classList.add('hidden');
        this.form.reset();
    }

    initEventListeners() {
        // Cancel Button
        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.hide();
        });

        // Form Submit
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData();
            formData.append('species', document.getElementById('species').value);
            formData.append('count', document.getElementById('count').value);
            formData.append('behavior', document.getElementById('behavior').value);
            formData.append('latitude', document.getElementById('lat').value);
            formData.append('longitude', document.getElementById('lng').value);

            const imageInput = document.getElementById('image');
            if (imageInput.files.length > 0) {
                formData.append('image', imageInput.files[0]);
            }

            try {
                const newObs = await ObservationService.create(formData);
                this.mapManager.addMarker(newObs);
                alert('Observation saved successfully!');
                this.hide();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }
}