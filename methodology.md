# OSINT & Geolocation Methodology

## Phase 1: Passive Reconnaissance (Footprinting)
*   **MSISDN Analysis**: Identify the country, carrier, and line type from the phone number format.
*   **Digital Footprinting**: Search social media platforms (Instagram, LinkedIn, Twitter/X) for location-tagged posts, check-ins, or mentions of the target number.
*   **Public Record Dorking**: Use advanced search strings (Dorks) to find the number in public leaks, forums, or business directories.

## Phase 2: Active Reconnaissance (The Tracking Link)
When passive data is insufficient, an active "lure" is required.
*   **Theme Selection**: Choose a theme that matches the target's interests (e.g., a "Near Me" restaurant tool for someone looking for food).
*   **The Payload**: Send a link to a capture page (`payload.html`) that requests GPS permission.
*   **The Hook**: Once the target clicks "Allow," the browser's GPS chip provides a **Verified GPS Fix** (accurate to within a few meters).

## Phase 3: Intelligence Correlation
*   **Address Resolution**: Convert coordinates into a human-readable address.
*   **History Mapping**: Track location changes over time to identify high-probability "home" or "work" zones.
*   **Metadata Extraction**: Analyze secondary data such as the target's User-Agent (device type) and IP address.

## Phase 4: Ethical Safeguards
*   **Authorization**: Ensure you have legal permission to track the target.
*   **Data Destruction**: Securely delete target coordinates after the challenge or mission is complete.
