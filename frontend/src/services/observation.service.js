import { API_URL } from '../config/api.js';

export const ObservationService = {
    async getAll() {
        try {
            const response = await fetch(`${API_URL}/observations`);
            return await response.json();
        } catch (error) {
            console.error("Error fetching observations:", error);
            return [];
        }
    },

    async create(formData) {
        // Note: We are sending FormData, so we don't set Content-Type header manually.
        // The browser sets it to multipart/form-data with the boundary automatically.
        const response = await fetch(`${API_URL}/observations`, {
            method: 'POST',
            body: formData
            // Add Authorization header here if you implement login in frontend later
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create observation');
        }

        return await response.json();
    }
};