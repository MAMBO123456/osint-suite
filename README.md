# White-Hat OSINT Intelligence Suite v4.2

A professional-grade Open Source Intelligence (OSINT) and Geospatial tracking dashboard designed for ethical hackers, investigators, and CTF participants.

> [!WARNING]
> **LEGAL DISCLAIMER**: Use this tool only for authorized testing, educational purposes, or with explicit legal permission. The developer is not responsible for misuse or illegal activities.

## 🚀 Key Features
- **Phone Intelligence**: Deep prefix analysis, MCC/MNC carrier identification, and registration state lookup.
- **Deep Recon Pivots**: Direct integration with Truecaller, WhatsApp, IntelX, and more to reveal identities.
- **Geospatial Mapping**: Multi-layer Leaflet.js maps (Satellite/Hybrid) with automatic state-level zoom.
- **Lure Engine (Payloads)**: Specialized HTML capture pages mimicking YouTube, Zoom, and Package Trackers.
- **Real-Time Webhooks**: Support for external listeners (Webhook.site) to receive live GPS data globally.
- **Confidence Indicators**: Visual badges to differentiate between "Passive Estimates" and "Verified GPS Fixes."

## 🛠️ How It Works (The 3-Step Process)
1. **Passive Recon**: Enter a target phone number to see its registration state, carrier, and digital footprint across the web.
2. **The Lure**: Go to the **Payloads** tab, pick a theme (e.g., YouTube), and generate a tracking link.
3. **The Catch**: Send the link. When the target clicks "Allow," their **exact house-level GPS coordinates** are sent to your Webhook listener and mapped in the dashboard.

## 🕹️ Operation Manual: Button Guide

### Geospatial Actions (Center Panel)
- **RESOLVE ADDRESS**: Converts Latitude/Longitude coordinates into a human-readable physical address.
- **DEMO: MY REAL GPS**: Tests the browser's sensor by capturing your current location to verify system accuracy.
- **REFINE / UPDATE FIX**: Manually input coordinates from external sources to update the map markers.
- **DARK / SATELLITE / HYBRID**: Switch map layers to see building-level details or street names.

### Digital Footprint (Top Right)
- **IG GEOTAGS / FB CHECK-INS**: Cross-references the number with public social media check-ins and tagged photos.
- **TWITTER CLUES**: Scans for number mentions in public tweets or bio strings.
- **WORK LOCATIONS**: Checks professional platforms like LinkedIn for corporate office associations.

### Pivot Intelligence (Bottom Right)
- **TRUECALLER**: Professional identity lookup to reveal the target's **Real Name**.
- **WHATSAPP / TELEGRAM**: Verifies active profiles and retrieves publicly available avatar photos.
- **INTELX / DEHASHED**: Scans data breaches and dark-web dumps for number associations.
- **HLR LOOKUP**: Checks the "Home Location Register" to see if the SIM is currently active on a network.

### Intelligence Correlation (Bottom Left)
- **INPUT CLUES**: Manually store discoveries (Names, Addresses) here. The suite uses these to verify the reliability of incoming GPS packets.

## 📦 Installation & Deployment
This is a **static web application**. No backend server is required.
1. Download or clone this repository.
2. To run locally: Open a terminal in the folder and run `python -m http.server 8000`.
3. To deploy online: Upload all files to **GitHub Pages** or **Vercel**.

## 📂 File Structure
- `index.html`: Main intelligence dashboard.
- `script.js`: Core logic and intelligence engine.
- `style.css`: Modern hacker-themed UI.
- `payload.html`: Universal GPS capture page.
- `video.html`: Specialized YouTube-themed capture page.
- `tracker.html`: Specialized Package-delivery capture page.
- `methodology.md`: In-app OSINT guide.

## ⚖️ Ethics & Best Practices
- **Respect Privacy**: Do not track individuals without consent.
- **Link Masking**: Use URL shorteners (Bitly/TinyURL) to make links look professional.
- **Data OPSEC**: Periodically clear your webhook history to protect gathered intelligence.
