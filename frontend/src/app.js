import { translations } from './i18n.js';

// --- State ---
let currentLang = 'en';
let map;
let markers = [];
let user = null;
let newObsMarker = null;
let isSelectingLocation = false;

// --- Config ---
const API_URL = 'http://localhost:3000/api';

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initEventListeners();
    checkAuth();
    loadObservations();
});

// --- Map Logic ---
function initMap() {
    // Default center: Turkey (can be changed)
    map = L.map('map').setView([39.9334, 32.8597], 6);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    map.on('click', onMapClick);
}

let heatLayer = null;

function toggleHeatmap() {
    if (heatLayer) {
        if (map.hasLayer(heatLayer)) {
            map.removeLayer(heatLayer);
            document.getElementById('toggle-heatmap').classList.remove('active-btn');
        } else {
            heatLayer.addTo(map);
            document.getElementById('toggle-heatmap').classList.add('active-btn');
        }
    }
}

function onMapClick(e) {
    if (!isSelectingLocation) return;

    isSelectingLocation = false;
    map.getContainer().style.cursor = '';

    // Update form lat/lng
    document.getElementById('form-lat').value = e.latlng.lat;
    document.getElementById('form-lng').value = e.latlng.lng;

    // Show temporary marker
    if (newObsMarker) map.removeLayer(newObsMarker);
    newObsMarker = L.marker(e.latlng).addTo(map)
        .bindPopup(translations[currentLang].locationSelect).openPopup();

    // Open Modal after selection
    openModal('obs-modal');
}

async function loadObservations() {
    try {
        const radius = document.getElementById('radius-filter').value;
        const center = map.getCenter();

        // Construct query params
        const params = new URLSearchParams({
            lat: center.lat,
            lng: center.lng,
            radius: radius
        });

        const res = await fetch(`${API_URL}/observations?${params}`);
        const data = await res.json();

        if (data.success) {
            renderMarkers(data.data);
            updateHeatmap(data.data);
        }
    } catch (err) {
        console.error('Failed to load observations', err);
    }
}

function updateHeatmap(observations) {
    const heatData = observations.map(o => [o.latitude, o.longitude, o.count]); // intensity based on count

    if (heatLayer) {
        heatLayer.setLatLngs(heatData);
    } else {
        heatLayer = L.heatLayer(heatData, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
        });
    }
    // Note: Don't automatically add to map, let user toggle
}

function renderMarkers(observations) {
    // Clear existing
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const speciesFilter = document.getElementById('species-filter').value;

    observations.forEach(obs => {
        if (speciesFilter !== 'all' && obs.species !== speciesFilter) return;

        const popupContent = `
            <div style="min-width: 150px;">
                <h4 style="margin:0; color: #10B981;">${obs.species}</h4>
                <div style="font-size: 0.85rem; color: #9CA3AF; margin-bottom: 5px;">
                    ${new Date(obs.observedAt).toLocaleDateString()}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                    <span class="badge" style="background:rgba(16,185,129,0.2); color:#10B981; padding:2px 6px; border-radius:4px; font-size:0.75rem;">${obs.count} observed</span>
                </div>
                <div style="font-style:italic; font-size:0.9rem; margin-bottom:5px;">
                    ${obs.behavior || 'No behavior recorded'}
                </div>
                <div style="font-size:0.75rem; color:#6B7280;">
                    Reporter: ${obs.author?.name || 'Unknown'}
                </div>
                ${obs.imageUrl ? `<img src="${obs.imageUrl}" style="width:100%; margin-top:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.1);">` : ''}
            </div>
        `;

        // Determine icon based on species (simple heuristic or random for demo)
        let iconClass = 'fa-paw';
        if (obs.species.toLowerCase().includes('bird') || obs.species.toLowerCase().includes('eagle')) iconClass = 'fa-crow';
        if (obs.species.toLowerCase().includes('wolf') || obs.species.toLowerCase().includes('dog')) iconClass = 'fa-dog';
        if (obs.species.toLowerCase().includes('cat') || obs.species.toLowerCase().includes('lynx')) iconClass = 'fa-cat';

        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<i class="fa-solid ${iconClass}" style="color: #10B981; font-size: 24px;"></i>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15]
        });

        const marker = L.marker([obs.latitude, obs.longitude], { icon: customIcon })
            .bindPopup(popupContent);

        marker.addTo(map);
        markers.push(marker);
    });

    // Populate species filter if empty
    const dropdown = document.getElementById('species-filter');
    if (dropdown.options.length === 1) { // Only 'All' exists
        const species = [...new Set(observations.map(o => o.species))];
        species.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            dropdown.appendChild(opt);
        });
    }
}

// --- Auth Logic ---
function checkAuth() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    const authSection = document.getElementById('auth-section');

    if (token && userStr) {
        user = JSON.parse(userStr);
        authSection.innerHTML = `
            <span style="margin-right:10px;">Hi, ${user.name}</span>
            <button id="logout-btn" class="btn-secondary" data-i18n="logout">${translations[currentLang].logout}</button>
        `;
        document.getElementById('logout-btn').addEventListener('click', logout);
    } else {
        authSection.innerHTML = `
            <button id="login-btn" class="btn-secondary" data-i18n="login">${translations[currentLang].login}</button>
        `;
        document.getElementById('login-btn').addEventListener('click', () => openModal('auth-modal'));
    }
}

// --- Utility ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Inline styles for toast (can proceed to css, but for guaranteed visual fix doing inline backup)
    Object.assign(toast.style, {
        background: type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        marginBottom: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(4px)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease-out'
    });

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
    });

    // Remove after 3s
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function login(email, password) {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            closeModal('auth-modal');
            checkAuth();
            showToast(translations[currentLang].loginSuccess, 'success');
        } else {
            showToast(translations[currentLang].loginFailed + (data.message || ''), 'error');
        }
    } catch (err) {
        showToast(translations[currentLang].loginError, 'error');
    }
}

async function register(name, email, password) {
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();

        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            closeModal('auth-modal');
            checkAuth();
            showToast(translations[currentLang].registerSuccess, 'success');
        } else {
            showToast(translations[currentLang].registerFailed + (data.message || ''), 'error');
        }
    } catch (err) {
        showToast(translations[currentLang].registerError, 'error');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    user = null;
    checkAuth();
}

// --- Observation Logic ---
async function saveObservation(e) {
    e.preventDefault();
    if (!user) {
        alert(translations[currentLang].pleaseLogin);
        return;
    }

    const form = e.target;
    const formData = new FormData(form);

    // Explicitly add lat/lng if utilizing FormData directly, 
    // but here we are sending multipart/form-data so browser handles inputs.
    // Ensure lat/lng are set
    if (!formData.get('latitude') || !formData.get('longitude')) {
        alert(translations[currentLang].locationSelect);
        return;
    }

    // Loading State
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving & Analyzing...';

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/observations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData // Sends multipart/form-data
        });

        const data = await res.json();
        if (data.success) {
            closeModal('obs-modal');
            form.reset();
            if (newObsMarker) map.removeLayer(newObsMarker);
            loadObservations();

            // AI Feedback
            if (data.aiPrediction) {
                const userSpecies = formData.get('species');
                const aiSpecies = data.aiPrediction.species;
                const confidence = Math.round(data.aiPrediction.confidence * 100);

                if (userSpecies.toLowerCase() !== aiSpecies.toLowerCase()) {
                    showToast(`${translations[currentLang].aiPredicted} ${aiSpecies} (${confidence}%)`, 'info');
                } else {
                    showToast(`${translations[currentLang].aiConfirmed} ${aiSpecies} (${confidence}%)`, 'success');
                }
            } else {
                showToast(translations[currentLang].obsSaved, 'success');
            }

        } else {
            showToast(translations[currentLang].obsSaveFailed + (data.message || 'Error'), 'error');
        }
    } catch (err) {
        showToast(translations[currentLang].obsSaveError, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

// --- Stats Logic ---
let speciesChartInst = null;
let trendChartInst = null;

async function loadStats() {
    try {
        const res = await fetch(`${API_URL}/observations/stats`);
        const data = await res.json();

        if (data.success) {
            renderCharts(data.data);
        }
    } catch (err) {
        console.error('Failed to load stats', err);
    }
}

function renderCharts(data) {
    // Top Species Doughnut
    const speciesCtx = document.getElementById('speciesChart').getContext('2d');
    if (speciesChartInst) speciesChartInst.destroy();

    speciesChartInst = new Chart(speciesCtx, {
        type: 'doughnut',
        data: {
            labels: data.topSpecies.map(s => s.species),
            datasets: [{
                data: data.topSpecies.map(s => s.count),
                backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#fff' } }
            }
        }
    });

    // Trend Line Chart
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    if (trendChartInst) trendChartInst.destroy();

    trendChartInst = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: data.dailyCounts.map(d => new Date(d.date).toLocaleDateString()),
            datasets: [{
                label: 'Observations',
                data: data.dailyCounts.map(d => d.count),
                borderColor: '#10B981',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(16, 185, 129, 0.2)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
                x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// --- UI Logic ---
function initEventListeners() {
    // Modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });

    document.getElementById('add-obs-btn').addEventListener('click', () => {
        if (!user) {
            showToast(translations[currentLang].pleaseLogin, 'error');
            openModal('auth-modal');
        } else {
            isSelectingLocation = true;
            closeModal('obs-modal'); // Ensure hidden
            map.getContainer().style.cursor = 'crosshair';
            showToast(translations[currentLang].locationSelect, 'info');
        }
    });

    document.getElementById('show-stats-btn').addEventListener('click', () => {
        openModal('stats-modal');
        loadStats();
    });

    // Forms
    document.getElementById('auth-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        if (document.getElementById('name-group').classList.contains('hidden')) {
            login(formData.get('email'), formData.get('password'));
        } else {
            register(formData.get('name'), formData.get('email'), formData.get('password'));
        }
    });

    document.getElementById('obs-form').addEventListener('submit', saveObservation);

    // Filters
    document.getElementById('radius-filter').addEventListener('change', (e) => {
        document.getElementById('radius-val').textContent = e.target.value + ' km';
        loadObservations();
    });

    document.getElementById('toggle-heatmap').addEventListener('click', toggleHeatmap);

    document.getElementById('species-filter').addEventListener('change', () => {
        // Reloading isn't strictly necessary if we just filter client side, but good for sync
        loadObservations();
    });

    // Map move
    map.on('moveend', () => {
        loadObservations();
    });

    // Language
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchLanguage(e.target.dataset.lang));
    });

    // Auth Switch
    const switchLink = document.getElementById('switch-to-register');
    if (switchLink) {
        switchLink.addEventListener('click', (e) => {
            e.preventDefault();
            const title = document.getElementById('auth-title');
            const nameGroup = document.getElementById('name-group');
            const btn = e.target;

            if (nameGroup.classList.contains('hidden')) {
                // Swith to Register
                nameGroup.classList.remove('hidden');
                title.textContent = translations[currentLang].register;
                btn.textContent = translations[currentLang].login;
                btn.previousElementSibling.textContent = translations[currentLang].haveAccount;
            } else {
                // Switch to Login
                nameGroup.classList.add('hidden');
                title.textContent = translations[currentLang].login;
                btn.textContent = translations[currentLang].register;
                btn.previousElementSibling.textContent = translations[currentLang].noAccount;
            }
        });
    }
}

function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function switchLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.lang-btn[data-lang="${lang}"]`).classList.add('active');

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
}