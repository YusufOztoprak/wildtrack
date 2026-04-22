// ─── AUTH ─────────────────────────────────────────────────────────────────────

const getToken       = () => localStorage.getItem('wt_token');
const setToken       = (t) => localStorage.setItem('wt_token', t);
const clearToken     = () => localStorage.removeItem('wt_token');
const getCurrentUser = () => { try { return JSON.parse(localStorage.getItem('wt_user')); } catch { return null; } };
const setCurrentUser = (u) => localStorage.setItem('wt_user', JSON.stringify(u));
const clearCurrentUser = () => localStorage.removeItem('wt_user');

function updateHeaderAuth() {
  const user      = getCurrentUser();
  const loginBtn  = document.getElementById('headerLoginBtn');
  const userArea  = document.getElementById('headerUserArea');
  const userName  = document.getElementById('headerUserName');

  if (user) {
    loginBtn.classList.add('hidden');
    userArea.classList.remove('hidden');
    userArea.classList.add('flex');
    userName.textContent = user.name || user.email;
  } else {
    loginBtn.classList.remove('hidden');
    userArea.classList.add('hidden');
    userArea.classList.remove('flex');
  }
}

window.openAuthModal = function() {
  document.getElementById('authError').classList.add('hidden');
  document.getElementById('authModal').classList.remove('hidden');
};

window.closeAuthModal = function() {
  document.getElementById('authModal').classList.add('hidden');
};

window.switchAuthTab = function(tab) {
  const isLogin = tab === 'login';
  document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
  document.getElementById('registerForm').classList.toggle('hidden', isLogin);
  document.getElementById('authError').classList.add('hidden');

  const activeClasses   = ['bg-white', 'text-slate-800', 'shadow-sm'];
  const inactiveClasses = ['text-slate-500'];

  const loginTabBtn    = document.getElementById('loginTabBtn');
  const registerTabBtn = document.getElementById('registerTabBtn');

  if (isLogin) {
    loginTabBtn.classList.add(...activeClasses);
    loginTabBtn.classList.remove(...inactiveClasses);
    registerTabBtn.classList.remove(...activeClasses);
    registerTabBtn.classList.add(...inactiveClasses);
  } else {
    registerTabBtn.classList.add(...activeClasses);
    registerTabBtn.classList.remove(...inactiveClasses);
    loginTabBtn.classList.remove(...activeClasses);
    loginTabBtn.classList.add(...inactiveClasses);
  }
};

window.submitLogin = async function() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn      = document.getElementById('loginSubmitBtn');

  if (!email || !password) { showAuthError('Please fill in all fields.'); return; }

  btn.disabled = true;
  btn.textContent = 'Signing in…';
  document.getElementById('authError').classList.add('hidden');

  try {
    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    setToken(data.token);
    setCurrentUser(data.user);
    closeAuthModal();
    updateHeaderAuth();
    showToast(`Welcome back, ${data.user.name || data.user.email}!`);
  } catch (err) {
    showAuthError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
};

window.submitRegister = async function() {
  const name     = document.getElementById('registerName').value.trim();
  const email    = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const btn      = document.getElementById('registerSubmitBtn');

  if (!name || !email || !password) { showAuthError('Please fill in all fields.'); return; }

  btn.disabled = true;
  btn.textContent = 'Creating account…';
  document.getElementById('authError').classList.add('hidden');

  try {
    const res  = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    setToken(data.token);
    setCurrentUser(data.user);
    closeAuthModal();
    updateHeaderAuth();
    showToast(`Welcome, ${data.user.name}! Your account has been created.`);
  } catch (err) {
    showAuthError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
};

function showAuthError(msg) {
  const el = document.getElementById('authError');
  el.textContent = msg;
  el.classList.remove('hidden');
}

window.logout = function() {
  clearToken();
  clearCurrentUser();
  updateHeaderAuth();
  showToast('Logged out.', 'info');
};

// ─── API HELPERS ──────────────────────────────────────────────────────────────

function authFetch(url, options = {}) {
  const token   = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

function showToast(message, type = 'success') {
  const palette = { success: 'bg-emerald-800', info: 'bg-blue-700', warning: 'bg-amber-600', error: 'bg-red-700' };
  const el = document.createElement('div');
  el.className = `${palette[type] ?? palette.success} text-white px-4 py-3 rounded-xl shadow-2xl text-sm font-medium pointer-events-auto max-w-xs leading-snug`;
  el.textContent = message;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s, transform .3s';
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(8px)';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

// ─── GEOSPATIAL HELPERS ───────────────────────────────────────────────────────

// Client-side Wallace Line classifier — mirrors backend geospatial.service.ts
function getWallaceRegion(lat, lng) {
  const line = [
    { lat: 20.0, lng: 125.0 }, { lat: 5.0,  lng: 125.0 },
    { lat: 0.0,  lng: 118.0 }, { lat: -5.0, lng: 117.0 },
    { lat: -8.5, lng: 115.5 }, { lat: -15.0, lng: 115.0 },
  ];
  for (let i = 0; i < line.length - 1; i++) {
    const p1 = line[i], p2 = line[i + 1];
    if (lat <= Math.max(p1.lat, p2.lat) && lat >= Math.min(p1.lat, p2.lat)) {
      const lineLng = p1.lng + (lat - p1.lat) * (p2.lng - p1.lng) / (p2.lat - p1.lat);
      return lng < lineLng ? 'Asia' : 'Australia';
    }
  }
  if (lat > 20.0)  return lng < 125.0 ? 'Asia' : 'Australia';
  if (lat < -15.0) return lng < 115.0 ? 'Asia' : 'Australia';
  return null;
}

// Species known to be exclusively/predominantly Australian (east of Wallace Line)
const AUSTRALIAN_SPECIES = [
  'kangaroo', 'wallaby', 'koala', 'wombat', 'echidna', 'platypus',
  'cassowary', 'quoll', 'dingo', 'possum', 'bandicoot', 'numbat',
  'tasmanian devil', 'bilby', 'quokka', 'cockatoo', 'kookaburra', 'emu',
  'frilled lizard', 'sugar glider',
];
// Species known to be exclusively/predominantly west of the Wallace Line
const ASIAN_SPECIES = [
  'orangutan', 'proboscis monkey', 'sun bear', 'gibbon', 'banteng',
  'babirusa', 'anoa', 'maleo', 'Javan', 'Sumatran', 'Bornean',
];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── MAP ──────────────────────────────────────────────────────────────────────

const map = L.map('map', { zoomControl: false }).setView([39.0, 35.0], 6);
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
}).addTo(map);

let markers = [];

// Keyed by observation id for safe onclick references
const observationStore = new Map();

// ─── LOCATION PICKER ──────────────────────────────────────────────────────────

let locationPickMode = false;
let pendingPin       = null;
let pendingLatLng    = null;

const locationPickerIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;">
    <div style="width:28px;height:28px;background:#10b981;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 15px rgba(16,185,129,.5),0 2px 6px rgba(0,0,0,.3);"></div>
  </div>`,
  iconSize:   [28, 28],
  iconAnchor: [14, 28],
});

map.on('click', e => {
  if (!locationPickMode) return;

  pendingLatLng = e.latlng;
  if (pendingPin) map.removeLayer(pendingPin);
  pendingPin = L.marker(e.latlng, { icon: locationPickerIcon, zIndexOffset: 2000 }).addTo(map);

  document.getElementById('selectedCoordDisplay').textContent =
    `${e.latlng.lat.toFixed(5)}°, ${e.latlng.lng.toFixed(5)}°`;
  document.getElementById('locationConfirmPanel').classList.remove('hidden');
});

function enterLocationPickMode() {
  locationPickMode = true;
  map.getContainer().style.cursor = 'crosshair';
  document.getElementById('locationPickerOverlay').classList.remove('hidden');
  document.getElementById('locationConfirmPanel').classList.add('hidden');
  document.getElementById('addObservationModal').classList.add('hidden');
  if (feedOpen) toggleFeed();
}

window.cancelLocationPick = function() {
  locationPickMode = false;
  map.getContainer().style.cursor = '';
  document.getElementById('locationPickerOverlay').classList.add('hidden');
  document.getElementById('locationConfirmPanel').classList.add('hidden');
  if (pendingPin) { map.removeLayer(pendingPin); pendingPin = null; }
  pendingLatLng = null;
};

window.resetLocationPick = function() {
  if (pendingPin) { map.removeLayer(pendingPin); pendingPin = null; }
  pendingLatLng = null;
  document.getElementById('locationConfirmPanel').classList.add('hidden');
  locationPickMode = true;
};

window.confirmLocationAndOpenForm = function() {
  if (!pendingLatLng) return;
  locationPickMode = false;
  map.getContainer().style.cursor = '';
  document.getElementById('locationPickerOverlay').classList.add('hidden');
  document.getElementById('locationConfirmPanel').classList.add('hidden');

  document.getElementById('obsLatLngText').textContent =
    `${pendingLatLng.lat.toFixed(5)}°, ${pendingLatLng.lng.toFixed(5)}°`;
  document.getElementById('addObservationModal').classList.remove('hidden');
};

window.changeLocation = function() {
  document.getElementById('addObservationModal').classList.add('hidden');
  enterLocationPickMode();
};

// Reticle logic
let reticleTimeout;
map.on('movestart', () => {
  if (locationPickMode) return;
  document.getElementById('centerReticle').classList.add('active');
  clearTimeout(reticleTimeout);
});
map.on('moveend', () => {
  reticleTimeout = setTimeout(() => {
    document.getElementById('centerReticle').classList.remove('active');
  }, 2000);
});

function timeAgo(dateString) {
  const date  = new Date(dateString);
  const secs  = Math.round((Date.now() - date) / 1000);
  const mins  = Math.round(secs / 60);
  const hrs   = Math.round(mins / 60);
  const days  = Math.round(hrs  / 24);
  if (secs  < 60) return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hrs   < 24) return `${hrs}h ago`;
  if (days === 1) return 'yesterday';
  if (days  <  7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

async function loadObservations() {
  try {
    const res  = await fetch('/api/observations');
    const data = await res.json();

    markers.forEach(m => map.removeLayer(m));
    markers = [];
    observationStore.clear();

    data.forEach(obs => {
      observationStore.set(obs.id, obs);

      const imgUrl = obs.media?.[0]?.url ?? 'https://images.unsplash.com/photo-1549313861-33587f3d2956?auto=format&fit=crop&q=80&w=150&h=150';
      const icon   = L.divIcon({
        className: 'custom-div-icon',
        html:      `<div class="observation-marker" style="width:48px;height:48px;"><img src="${imgUrl}" alt="${obs.taxon?.name ?? 'Unknown'}" loading="lazy"></div>`,
        iconSize:  [48, 48],
        iconAnchor:[24, 24],
      });
      const marker = L.marker([obs.latitude, obs.longitude], { icon }).addTo(map);
      marker.on('click', () => {
        map.flyTo([obs.latitude, obs.longitude], Math.max(map.getZoom(), 10), { duration: 0.5 });
        openObservationById(obs.id);
      });
      markers.push(marker);
    });

    renderFeed(data);
  } catch (err) {
    console.error('Error loading observations:', err);
  }
}

// ─── FEED SIDEBAR ─────────────────────────────────────────────────────────────

let feedOpen = false;

window.toggleFeed = function() {
  feedOpen = !feedOpen;
  document.getElementById('feedSidebar').classList.toggle('-translate-x-full', !feedOpen);
};

function statusBadgeSmall(status) {
  if (status === 'RESEARCH_GRADE') return `<span class="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Research Grade</span>`;
  if (status === 'NEEDS_ID')       return `<span class="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Needs ID</span>`;
  return `<span class="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">Casual</span>`;
}

function renderFeed(observations) {
  const list = document.getElementById('feedList');

  if (!observations.length) {
    list.innerHTML = `<div class="text-center p-8 text-slate-400 text-sm">No observations yet.</div>`;
    return;
  }

  list.innerHTML = observations.map(obs => {
    const imgUrl  = obs.media?.[0]?.url ?? 'https://images.unsplash.com/photo-1549313861-33587f3d2956?auto=format&fit=crop&q=80&w=150&h=150';
    const name    = obs.taxon?.commonName ?? obs.taxon?.name ?? 'Unknown Species';
    const sci     = obs.taxon?.name ? `<span class="italic text-slate-400 text-xs block">${obs.taxon.name}</span>` : '';
    const author  = obs.author?.name ?? 'Anonymous';
    const ids     = obs.identifications?.length ?? 0;
    const comms   = obs.comments?.length ?? 0;

    return `
      <div class="flex gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 transition-colors"
           onclick="openObservationById(${obs.id})">
        <img src="${imgUrl}" class="w-14 h-14 rounded-lg object-cover shrink-0 shadow-sm" loading="lazy">
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-slate-800 text-sm truncate">${name}</div>
          ${sci}
          <div class="mt-1">${statusBadgeSmall(obs.status)}</div>
          <div class="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
            <span>${author}</span><span>·</span><span>${timeAgo(obs.createdAt)}</span>
          </div>
          <div class="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
            <span>${ids} ID${ids !== 1 ? 's' : ''}</span>
            <span>${comms} comment${comms !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

window.openObservationById = function(id) {
  fetchAndOpenDetail(id).catch(() => showToast('Failed to load observation.', 'error'));
};

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────

function openObservationDetail(obs) {
  const container = document.getElementById('detailModalContainer');

  // Computed metadata
  const ecoRegion   = getWallaceRegion(obs.latitude, obs.longitude);
  const coordsText  = `${obs.latitude.toFixed(4)}°, ${obs.longitude.toFixed(4)}°`;
  const observedDate = new Date(obs.observedAt ?? obs.createdAt)
    .toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  const ecoRegionBadge = ecoRegion
    ? `<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${ecoRegion === 'Australia' ? 'bg-orange-100 text-orange-800' : 'bg-sky-100 text-sky-800'}">${ecoRegion === 'Australia' ? '🦘' : '🌏'} ${ecoRegion}</span>`
    : '';

  const metaRowHtml = `
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2.5">
      ${ecoRegionBadge}
      <span class="text-xs font-mono text-slate-400">${coordsText}</span>
      <span class="text-xs text-slate-400">· ${observedDate}</span>
    </div>`;

  let badgeHtml = '';
  if (obs.status === 'RESEARCH_GRADE') {
    badgeHtml = `<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-200/50 shadow-sm mt-2">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
      <span class="text-xs font-bold tracking-wide uppercase">Research Grade</span></div>`;
  } else if (obs.status === 'NEEDS_ID') {
    badgeHtml = `<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-800 border border-amber-200/50 shadow-sm mt-2">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <span class="text-xs font-bold tracking-wide uppercase">Needs ID</span></div>`;
  } else {
    badgeHtml = `<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shadow-sm mt-2">
      <span class="text-xs font-bold tracking-wide uppercase">Casual</span></div>`;
  }

  // Merge identifications + comments sorted oldest-first
  const timeline = [
    ...(obs.identifications ?? []).map(i => ({ ...i, _type: 'ID' })),
    ...(obs.comments ?? []).map(c => ({ ...c, _type: 'COMMENT' })),
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const timelineHtml = timeline.length === 0
    ? `<div class="text-center py-10">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
        </div>
        <p class="text-sm font-medium text-slate-500">No activity yet.</p>
        <p class="text-xs text-slate-400 mt-1">Be the first to suggest an ID or leave a comment!</p>
      </div>`
    : timeline.map(item => {
        const avatar  = item.user?.avatarUrl ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.user?.name ?? 'U')}&backgroundColor=10b981`;
        const timeStr = timeAgo(item.createdAt);

        if (item._type === 'ID') {
          return `
            <div class="relative pl-6 pb-6 border-l-2 border-emerald-100 last:border-0 last:pb-0 ml-4">
              <div class="absolute -left-[17px] top-0 p-1 bg-white rounded-full">
                <img src="${avatar}" class="w-8 h-8 rounded-full shadow-sm ring-2 ring-white">
              </div>
              <div class="pl-4">
                <div class="flex items-center justify-between mb-1.5">
                  <div class="text-sm font-semibold text-slate-800">${item.user?.name ?? 'User'}</div>
                  <div class="text-xs text-slate-500 font-medium">${timeStr}</div>
                </div>
                <div class="bg-emerald-50/50 border border-emerald-100/80 rounded-xl p-3 shadow-sm">
                  <div class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <div>
                      <div class="text-sm">
                        <span class="font-bold text-emerald-900">${item.taxon?.commonName ?? item.taxon?.name ?? 'Unknown'}</span>
                        ${item.taxon?.name ? `<span class="italic text-emerald-700/80 ml-1">(${item.taxon.name})</span>` : ''}
                      </div>
                      ${item.body ? `<p class="text-sm text-slate-600 mt-2 italic border-l-2 border-emerald-200 pl-3 py-0.5">"${item.body}"</p>` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>`;
        } else {
          return `
            <div class="relative pl-6 pb-6 border-l-2 border-slate-100 last:border-0 last:pb-0 ml-4">
              <div class="absolute -left-[17px] top-0 p-1 bg-white rounded-full">
                <img src="${avatar}" class="w-8 h-8 rounded-full shadow-sm ring-2 ring-white">
              </div>
              <div class="pl-4">
                <div class="flex items-center justify-between mb-1.5">
                  <div class="text-sm font-semibold text-slate-800">${item.user?.name ?? 'User'}</div>
                  <div class="text-xs text-slate-500 font-medium">${timeStr}</div>
                </div>
                <div class="bg-slate-50/80 border border-slate-100 rounded-xl p-3 shadow-sm">
                  <p class="text-sm text-slate-700 leading-relaxed">${item.body}</p>
                </div>
              </div>
            </div>`;
        }
      }).join('');

  const imgUrl       = obs.media?.[0]?.url ?? 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&q=80&w=800&h=600';
  const authorAvatar = obs.author?.avatarUrl ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(obs.author?.name ?? 'O')}&backgroundColor=0f766e`;
  const authorName   = obs.author?.name ?? 'Anonymous';

  const actionArea = getToken()
    ? `<div class="flex p-1 bg-slate-100 rounded-lg mb-4">
         <button onclick="toggleDetailTab('commentTab', this)" class="tab-btn flex-1 text-sm font-semibold py-2 rounded-md bg-white text-slate-800 shadow-sm transition-all">Comment</button>
         <button onclick="toggleDetailTab('idTab', this)" class="tab-btn flex-1 text-sm font-semibold py-2 rounded-md text-slate-500 hover:text-slate-700 transition-all">Suggest ID</button>
       </div>
       <div id="commentTab" class="block">
         <div class="relative">
           <textarea id="commentBody" rows="2" class="w-full text-sm p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow resize-none" placeholder="What are your thoughts?"></textarea>
           <button onclick="submitComment(${obs.id})" class="absolute bottom-3 right-3 bg-emerald-600 text-white font-bold px-4 py-1.5 rounded-lg shadow-md hover:bg-emerald-700 transition-all">Post</button>
         </div>
       </div>
       <div id="idTab" class="hidden">
         <div class="relative mb-3">
           <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
           </div>
           <input type="text" id="idSearch" oninput="searchTaxa(this.value,'idDropdown','selectedIdTaxon')" class="w-full text-sm pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow" placeholder="Search for a species..." autocomplete="off">
           <div id="idDropdown" class="bg-white border border-slate-200 rounded-xl shadow-xl absolute w-full max-h-40 overflow-y-auto hidden z-50 mt-1 divide-y divide-slate-100"></div>
         </div>
         <input type="hidden" id="selectedIdTaxon">
         <div class="relative">
           <textarea id="idBody" rows="1" class="w-full text-sm p-3.5 pr-24 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow resize-none" placeholder="Tell us why (optional)..."></textarea>
           <button onclick="submitID(${obs.id})" class="absolute bottom-2.5 right-2 bg-emerald-600 text-white font-bold px-4 py-1.5 rounded-lg shadow-md hover:bg-emerald-700 transition-all">Submit</button>
         </div>
       </div>`
    : `<div class="text-center py-2">
         <p class="text-sm text-slate-500 mb-3">Sign in to add identifications and comments</p>
         <button onclick="document.getElementById('detailModalContainer').classList.add('hidden'); openAuthModal();" class="bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors text-sm">Sign In</button>
       </div>`;

  // Wiki card — shown only when a taxon is known; body populated async after render
  const wikiCardHtml = obs.taxon ? `
    <div id="wikiSpeciesCard" class="mb-6 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <button onclick="toggleWikiCard()" class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/></svg>
          About this species
        </span>
        <svg id="wikiChevron" class="w-4 h-4 text-slate-400 transition-transform duration-200 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      <div id="wikiCardBody" class="px-4 pb-4">
        <div class="space-y-2 animate-pulse">
          <div class="h-3 bg-slate-200 rounded w-3/4"></div>
          <div class="h-3 bg-slate-200 rounded w-full"></div>
          <div class="h-3 bg-slate-200 rounded w-5/6"></div>
          <div class="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>` : '';

  container.innerHTML = `
    <div class="fixed inset-0 z-[2000] flex items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-md">
      <div class="bg-white sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto max-w-6xl sm:max-h-[90vh] flex flex-col lg:flex-row overflow-hidden">

        <!-- Left: Media -->
        <div class="w-full lg:w-3/5 bg-slate-950 flex flex-col relative h-[40vh] sm:h-[50vh] lg:h-auto">
          <div class="absolute top-4 left-4 z-10 lg:hidden">
            <button onclick="document.getElementById('detailModalContainer').classList.add('hidden')"
                    class="bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
          </div>
          <div class="flex-1 relative flex items-center justify-center overflow-hidden">
            <div class="absolute inset-0 bg-cover bg-center opacity-20 blur-xl scale-110" style="background-image:url('${imgUrl}')"></div>
            <img src="${imgUrl}" class="relative z-10 max-h-full w-full object-contain drop-shadow-2xl p-4">
          </div>
          ${(obs.media?.length ?? 0) > 1 ? `
            <div class="h-20 bg-slate-900/80 flex gap-2 p-3 overflow-x-auto border-t border-slate-800">
              ${obs.media.map(m => `<img src="${m.url}" class="h-full w-16 object-cover rounded-lg border-2 border-transparent hover:border-emerald-500 cursor-pointer transition-colors shrink-0">`).join('')}
            </div>` : ''}
        </div>

        <!-- Right: Details -->
        <div class="w-full lg:w-2/5 flex flex-col bg-white h-[60vh] sm:h-[40vh] lg:h-[90vh]">
          <!-- Header -->
          <div class="p-6 border-b border-slate-100 flex justify-between items-start shrink-0">
            <div class="flex-1 pr-4">
              <div class="flex items-center gap-3 mb-4">
                <img src="${authorAvatar}" class="w-10 h-10 rounded-full ring-2 ring-slate-100 shadow-sm">
                <div>
                  <div class="text-sm font-bold text-slate-800">${authorName}</div>
                  <div class="text-xs text-slate-500">Added ${new Date(obs.createdAt).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' })}</div>
                </div>
              </div>
              <h2 class="text-2xl font-bold text-slate-900 leading-tight">${obs.taxon?.commonName ?? obs.taxon?.name ?? 'Unknown Species'}</h2>
              <p class="text-base text-slate-500 italic mt-0.5">${obs.taxon?.name ?? ''}</p>
              ${badgeHtml}
              ${metaRowHtml}
            </div>
            <button onclick="document.getElementById('detailModalContainer').classList.add('hidden')"
                    class="hidden lg:flex p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Timeline -->
          <div class="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
            ${(obs.description || obs.behavior) ? `
              <div class="mb-8 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Observer's Notes</h3>
                ${obs.behavior ? `<p class="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Behavior: <span class="font-normal normal-case text-slate-600">${obs.behavior}</span></p>` : ''}
                ${obs.description ? `<p class="text-sm text-slate-700 leading-relaxed">${obs.description}</p>` : ''}
              </div>` : ''}
            ${wikiCardHtml}
            <div class="flex items-center gap-2 mb-6">
              <h3 class="font-bold text-slate-800 text-lg">Community Activity</h3>
              <div class="h-px bg-slate-200 flex-1"></div>
            </div>
            <div class="pt-2">${timelineHtml}</div>
          </div>

          <!-- Action Area -->
          <div class="p-5 bg-white border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] shrink-0">
            ${actionArea}
          </div>
        </div>
      </div>
    </div>`;

  container.classList.remove('hidden');

  // Kick off Wikipedia fetch now that the DOM node exists
  if (obs.taxon) {
    fetchWikiSpeciesInfo(obs.taxon.name, obs.taxon.commonName);
  }
}

window.toggleDetailTab = function(tabId, btn) {
  ['commentTab', 'idTab'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
  document.getElementById(tabId)?.classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('bg-white', 'text-slate-800', 'shadow-sm');
    b.classList.add('text-slate-500');
  });
  if (btn) {
    btn.classList.remove('text-slate-500');
    btn.classList.add('bg-white', 'text-slate-800', 'shadow-sm');
  }
};

// ─── WIKIPEDIA SPECIES PANEL ──────────────────────────────────────────────────

window.toggleWikiCard = function() {
  const body    = document.getElementById('wikiCardBody');
  const chevron = document.getElementById('wikiChevron');
  if (!body) return;
  const nowHidden = body.classList.toggle('hidden');
  chevron?.classList.toggle('rotate-180', !nowHidden);
};

async function fetchWikiSpeciesInfo(taxonName, commonName) {
  const body = document.getElementById('wikiCardBody');
  if (!body) return;

  // Try scientific name then common name
  const candidates = [taxonName, commonName].filter(Boolean);
  let data = null;
  for (const name of candidates) {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/ /g, '_'))}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) continue;
      const json = await res.json();
      if (json.type !== 'disambiguation' && json.extract) { data = json; break; }
    } catch { /* try next candidate */ }
  }

  if (!data) {
    body.innerHTML = `<p class="text-sm text-slate-400 italic pb-1">No Wikipedia article found for this species.</p>`;
    return;
  }

  const thumb   = data.thumbnail?.source;
  const extract = escapeHtml(data.extract);
  const pageUrl = data.content_urls?.desktop?.page;

  body.innerHTML = `
    <div class="flex gap-3 items-start pt-1">
      ${thumb ? `<img src="${thumb}" alt="" class="w-20 h-20 object-cover rounded-lg shrink-0 shadow-sm border border-slate-100">` : ''}
      <div class="flex-1 min-w-0">
        <p class="text-sm text-slate-700 leading-relaxed line-clamp-5">${extract}</p>
        ${pageUrl ? `<a href="${pageUrl}" target="_blank" rel="noopener noreferrer" class="inline-block mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors">Read more on Wikipedia →</a>` : ''}
      </div>
    </div>`;
}

// ─── TAXON SEARCH ─────────────────────────────────────────────────────────────

let searchTimeout;
window.searchTaxa = function(query, dropdownId, hiddenInputId) {
  clearTimeout(searchTimeout);
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;
  if (query.length < 2) { dropdown.classList.add('hidden'); return; }

  searchTimeout = setTimeout(async () => {
    try {
      const res  = await fetch(`/api/observations/taxa?query=${encodeURIComponent(query)}`);
      const taxa = await res.json();

      dropdown.innerHTML = taxa.length === 0
        ? '<div class="p-3 text-sm text-slate-500 text-center">No species found</div>'
        : '';

      taxa.forEach(t => {
        const div = document.createElement('div');
        div.className = 'p-3 text-sm hover:bg-emerald-50 cursor-pointer flex items-center justify-between group transition-colors';
        div.innerHTML = `
          <div>
            <div class="font-bold text-slate-800 group-hover:text-emerald-700">${t.commonName ?? t.name}</div>
            <div class="italic text-slate-500 text-xs">${t.name}</div>
          </div>
          <span class="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Select</span>`;
        div.onclick = () => {
          document.getElementById(hiddenInputId).value = t.id;
          const visibleId = dropdownId === 'idDropdown' ? 'idSearch' : 'newObsTaxon';
          const visibleEl = document.getElementById(visibleId);
          if (visibleEl) visibleEl.value = t.commonName ?? t.name;
          dropdown.classList.add('hidden');
        };
        dropdown.appendChild(div);
      });

      dropdown.classList.remove('hidden');
    } catch (e) {
      console.error('Taxon search error:', e);
    }
  }, 300);
};

document.addEventListener('click', e => {
  if (!e.target.closest('#newObsTaxon') && !e.target.closest('#taxonDropdown'))
    document.getElementById('taxonDropdown')?.classList.add('hidden');
  if (!e.target.closest('#idSearch') && !e.target.closest('#idDropdown'))
    document.getElementById('idDropdown')?.classList.add('hidden');
});

// ─── PHOTO UPLOAD ─────────────────────────────────────────────────────────────

document.getElementById('photoInput').addEventListener('change', function () {
  const file    = this.files[0];
  const preview = document.getElementById('photoPreview');
  const overlay = document.getElementById('photoPreviewOverlay');
  const hint    = document.getElementById('photoUploadHint');

  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    preview.classList.remove('hidden');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    hint.classList.add('hidden');
  };
  reader.readAsDataURL(file);
});

window.clearPhoto = function(event) {
  event.preventDefault();
  event.stopPropagation();
  document.getElementById('photoInput').value        = '';
  document.getElementById('photoPreview').classList.add('hidden');
  document.getElementById('photoPreviewOverlay').classList.add('hidden');
  document.getElementById('photoPreviewOverlay').classList.remove('flex');
  document.getElementById('photoUploadHint').classList.remove('hidden');
};

// ─── SUBMIT OBSERVATION ───────────────────────────────────────────────────────

document.getElementById('newObsTaxon').addEventListener('input', e => {
  window.searchTaxa(e.target.value, 'taxonDropdown', 'selectedTaxonId');
});

window.openAddObservation = function() {
  if (!getToken()) { openAuthModal(); return; }
  enterLocationPickMode();
};

document.getElementById('submitObservation').addEventListener('click', async () => {
  if (!getToken()) {
    document.getElementById('addObservationModal').classList.add('hidden');
    openAuthModal();
    return;
  }

  const btn = document.getElementById('submitObservation');

  if (!pendingLatLng) {
    showToast('Please click the map to pick a location first.', 'warning');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>Uploading…`;

  const latLng   = pendingLatLng;
  const taxonId  = document.getElementById('selectedTaxonId').value;
  const desc     = document.getElementById('newObsDesc').value;
  const behavior = document.getElementById('newObsBehavior').value;
  const fileEl   = document.getElementById('photoInput');

  const formData = new FormData();
  if (fileEl.files[0]) formData.append('image', fileEl.files[0]);
  if (taxonId)         formData.append('taxonId', taxonId);
  if (desc)            formData.append('description', desc);
  if (behavior)        formData.append('behavior', behavior);
  formData.append('latitude',   latLng.lat);
  formData.append('longitude',  latLng.lng);
  formData.append('observedAt', new Date().toISOString());

  try {
    const res  = await authFetch('/api/observations', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) {
      // Validator rejection — show every issue as its own red toast, keep modal open
      if (data.issues?.length) {
        data.issues.forEach(msg => showToast(msg, 'error'));
      } else {
        showToast(data.error || 'Submission failed.', 'error');
      }
      return;
    }

    document.getElementById('addObservationModal').classList.add('hidden');
    // Reset form
    document.getElementById('selectedTaxonId').value = '';
    document.getElementById('newObsTaxon').value     = '';
    document.getElementById('newObsDesc').value      = '';
    document.getElementById('newObsBehavior').value  = '';
    window.clearPhoto({ preventDefault: () => {}, stopPropagation: () => {} });
    if (pendingPin) { map.removeLayer(pendingPin); pendingPin = null; }
    pendingLatLng = null;

    await loadObservations();

    if (data.aiPrediction) {
      const { species, commonName, confidence } = data.aiPrediction;
      const pct   = Math.round((confidence ?? 0) * 100);
      const label = commonName ? `${commonName} (${species})` : species;
      showToast(`AI detected: ${label} — ${pct}% confidence`, 'info');

      // Wallace Line cross-check
      const region    = getWallaceRegion(latLng.lat, latLng.lng);
      const sLower    = label.toLowerCase();
      const isAussie  = AUSTRALIAN_SPECIES.some(k => sLower.includes(k));
      const isAsian   = ASIAN_SPECIES.some(k => sLower.includes(k));
      if (region === 'Asia' && isAussie) {
        showToast('⚠️ This species is unusual for this biogeographic region (normally east of the Wallace Line).', 'warning');
      } else if (region === 'Australia' && isAsian) {
        showToast('⚠️ This species is unusual for this biogeographic region (normally west of the Wallace Line).', 'warning');
      }
    } else {
      showToast('Observation submitted!');
    }

    // Scientific validation warnings (suspicious — saved, but flagged)
    if (data.validationResult?.status === 'suspicious' && data.validationResult.issues?.length) {
      data.validationResult.issues.forEach(msg => showToast(`⚠️ ${msg}`, 'warning'));
    }
  } catch (err) {
    const msg = err.message?.includes('Failed to fetch')
      ? 'Network error — please check your connection.'
      : err.message || 'Submission failed.';
    showToast(msg, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Upload Observation</span><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>`;
  }
});

// ─── DETAIL REFRESH ───────────────────────────────────────────────────────────

async function fetchAndOpenDetail(obsId) {
  const res = await fetch(`/api/observations/${obsId}`);
  if (!res.ok) throw new Error('Failed to refresh observation');
  const obs = await res.json();
  observationStore.set(obs.id, obs);
  openObservationDetail(obs);
  loadObservations(); // update map markers + feed in background
}

// ─── SUBMIT COMMENT ───────────────────────────────────────────────────────────

window.submitComment = async function(obsId) {
  const bodyEl = document.getElementById('commentBody');
  const body   = bodyEl?.value?.trim();
  if (!body) return;

  try {
    const res = await authFetch(`/api/observations/${obsId}/comments`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ body }),
    });
    if (!res.ok) throw new Error('Failed to post comment');

    await fetchAndOpenDetail(obsId);
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ─── SUBMIT IDENTIFICATION ────────────────────────────────────────────────────

window.submitID = async function(obsId) {
  const taxonId = document.getElementById('selectedIdTaxon')?.value;
  const body    = document.getElementById('idBody')?.value;

  if (!taxonId) { showToast('Please select a species from the dropdown first.', 'warning'); return; }

  try {
    const res = await authFetch(`/api/observations/${obsId}/identifications`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ taxonId, body }),
    });
    if (!res.ok) throw new Error('Failed to submit identification');

    await fetchAndOpenDetail(obsId);
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ─── INIT ─────────────────────────────────────────────────────────────────────

updateHeaderAuth();
loadObservations();
