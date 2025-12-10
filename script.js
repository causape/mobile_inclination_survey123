// ===========================================
// WGS84 TO UTM CONVERSION FUNCTION (Custom)
// ===========================================

/**
 * Converts WGS84 coordinates (lat, lon) to UTM (Easting, Northing) and calculates the UTM zone.
 * Implements the Taylor series (Krüger formula) for the UTM projection.
 * @param {number} lat Latitude in degrees.
 * @param {number} lon Longitude in degrees.
 * @returns {[number, number, number]} [Easting, Northing, Zone]
 */
function convertWgs84ToUtm(lat, lon) {
    // 1. WGS84 Ellipsoid Constants
    const a = 6378137.0; // Semi-major axis
    const f = 1 / 298.257223563; // Inverse flattening
    const k0 = 0.9996; // Central meridian scale factor
    const e2 = f * (2 - f); // e^2

    // 2. UTM Zone and Meridians
    let rounded_lon = Math.round(lon * 10000000000) / 10000000000;
    
    // Determine UTM zone (1 to 60)
    let zone = Math.floor((rounded_lon + 180) / 6) + 1;
    let lambda0_deg = (zone * 6) - 183; // Central meridian in degrees
    
    // Convert to Radians
    let lambda0 = lambda0_deg * Math.PI / 180; // Central meridian in radians
    let phi = lat * Math.PI / 180; // Latitude in radians
    let lambda = lon * Math.PI / 180; // Longitude in radians

    // 3. Intermediate Variables and Series (Krüger formulas)
    let sinPhi = Math.sin(phi);
    let cosPhi = Math.cos(phi);

    let N = a / Math.sqrt(1 - e2 * Math.pow(sinPhi, 2)); // Radius of curvature
    let T = Math.pow(Math.tan(phi), 2);
    let C = e2 * Math.pow(cosPhi, 2) / (1 - e2);
    let A_term = (lambda - lambda0) * cosPhi; // Angular term for the series

    // --- EASTING (X) CALCULATION ---
    let Easting = k0 * N * (
        A_term +
        (1 - T + C) * Math.pow(A_term, 3) / 6 +
        (5 - 18 * T + Math.pow(T, 2) + 72 * C - 58 * e2 / (1 - e2)) * Math.pow(A_term, 5) / 120
    ) + 500000; // False Easting (500,000 m)

    // --- NORTHING (Y) CALCULATION ---
    
    // Meridian arc length (M)
    let M = a * (
        (1 - e2 / 4 - 3 * Math.pow(e2, 2) / 64 - 5 * Math.pow(e2, 3) / 256) * phi -
        (3 * e2 / 8 + 3 * Math.pow(e2, 2) / 32 + 45 * Math.pow(e2, 3) / 1024) * Math.sin(2 * phi) +
        (15 * Math.pow(e2, 2) / 256 + 45 * Math.pow(e2, 3) / 1024) * Math.sin(4 * phi) -
        (35 * Math.pow(e2, 3) / 3072) * Math.sin(6 * phi)
    );

    let Northing = k0 * (
        M +
        N * Math.tan(phi) * (
            Math.pow(A_term, 2) / 2 +
            (5 - T + 9 * C + 4 * Math.pow(C, 2)) * Math.pow(A_term, 4) / 24 +
            (61 - 58 * T + Math.pow(T, 2) + 600 * C - 330 * e2 / (1 - e2)) * Math.pow(A_term, 6) / 720
        )
    );

    // False Northing for southern hemisphere (adds 10,000,000 m if lat < 0)
    if (lat < 0) {
        Northing += 10000000;
    }

    return [Easting, Northing, zone];
}

// ===========================================
// APPLICATION LOGIC
// ===========================================

// ----------------------------
// 1. URL PARAMETERS CONFIGURATION AND READING
// ----------------------------
const itemID = "64a2a232b4ad4c1fb2318c3d0a6c23aa"; // your Survey123 item ID

// Read Survey123 URL parameters
const params = new URLSearchParams(window.location.search);

// --- DATA STORAGE ---
const surveyData = {
    name:     params.get('name') || "",
    email:    params.get('email') || "",
    height:   params.get('h_user') || "",
    landType: params.get('tLand') || "",
    landDesc: params.get('tDesc') || ""
};

// ----------------------------
// REQUEST SENSOR PERMISSION (iOS / Android)
// ----------------------------
document.getElementById('reqPerm').onclick = async () => {
    // --- iOS 13+ ---
    if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) {
        try {
            const res = await DeviceMotionEvent.requestPermission();
            alert("iOS sensor permission: " + res);
        } catch (err) {
            alert("iOS sensor permission request failed: " + err);
        }
    } 
    // --- Android / Others ---
    else if (window.DeviceOrientationEvent) {
        alert("Sensor access available. Initializing...");
        
        // Temporary listener to "wake up" sensors
        const initListener = (ev) => {
            console.log("First event captured for initialization:", ev);
            window.removeEventListener('deviceorientation', initListener);
        };
        window.addEventListener('deviceorientation', initListener);

        setTimeout(() => {
            alert("Sensors should be ready now. Take your photo.");
        }, 500);
    } 
    else {
        alert("Device orientation sensors not supported.");
    }
};

// ----------------------------
// CAPTURE PHOTO AND SENSOR DATA
// ----------------------------
document.getElementById('cameraInput').addEventListener('change', (ev) => {
    const file = ev.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const imageData = e.target.result;
        document.getElementById('photoPreview').src = imageData;
        window._photoData = imageData;
        console.log("Photo loaded:", window._photoData);

        
        enableSaveButton(); // <-- New function
        
        const captureOrientation = (ev) => {
            // --- Direct heading calculation ---
            let direction;
            if (typeof ev.webkitCompassHeading !== "undefined") {
                direction = ev.webkitCompassHeading;
            } else if (ev.absolute) {
                direction = ev.alpha;
            } else {
                direction = 360 - (ev.alpha || 0);
            }
            if (direction < 0) direction += 360;
            if (direction > 360) direction -= 360;

            const pitch = ev.beta || 0;
            const roll = ev.gamma || 0;

            // Initialize GPS values to avoid null issues
            window._ori_foto = { 
                pitch, roll, direction,
                lat: 0, lon: 0, accuracy: 0, elevation: 0
            };

            // Update UI
            document.getElementById('pitch').textContent = pitch.toFixed(1);
            document.getElementById('roll').textContent = roll.toFixed(1);
            document.getElementById('direction').textContent = direction.toFixed(1);

            // Remove listener after first reading
            window.removeEventListener('deviceorientation', captureOrientation);

            // Capture geolocation once
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                    window._ori_foto.lat = pos.coords.latitude;
                    window._ori_foto.lon = pos.coords.longitude;
                    window._ori_foto.accuracy = pos.coords.accuracy;
                    window._ori_foto.elevation = pos.coords.altitude || 0;

                    try {
                        // LOCAL FUNCTION: convertWgs84ToUtm
                        const [easting, northing, zone] = convertWgs84ToUtm(
                            window._ori_foto.lat,
                            window._ori_foto.lon
                        );
                    
                        window._ori_foto.easting = easting;
                        window._ori_foto.northing = northing;
                        window._ori_foto.utm_zone = zone;

                        document.getElementById('latitude').textContent = northing.toFixed(2);
                        document.getElementById('longitude').textContent = easting.toFixed(2);
                    } catch (err) {
                        console.error("Error converting to UTM:", err);
                    }

                    document.getElementById('accuracy').textContent = window._ori_foto.accuracy.toFixed(1);
                    document.getElementById('elevation').textContent = window._ori_foto.elevation.toFixed(2);
                }, err => {
                    console.log("Geolocation error: " + err.message);
                }, { enableHighAccuracy: true });
            }
        };

        window.addEventListener('deviceorientation', captureOrientation);
    };

    reader.readAsDataURL(file);
});
// ============================
// BUTTON TO SAVE THE PHOTO
// ============================
document.getElementById("savePhotoBtn").addEventListener("click", () => {
    console.log("Save button clicked");

    if (!window._photoData) {
        alert("⚠️ Please take a photo first.");
        return;
    }

    const link = document.createElement("a");
    link.href = window._photoData;
    link.download = "captured_photo.jpg";
    link.click();

    console.log("Download triggered");
});

function enableSaveButton() {
    const btn = document.getElementById("savePhotoBtn");
    btn.style.opacity = "1";
    btn.style.pointerEvents = "auto";
    btn.textContent = "Save Photo";
}

// ----------------------------
// OPEN SURVEY123 (RE-INJECT DATA)
// ----------------------------
document.getElementById('openSurvey').onclick = () => {
    // 1. Verify the user took the photo
    if (!window._ori_foto) {
        alert("⚠️ Please take the photo first.");
        return;
    }

    const o = window._ori_foto;    
    
    // 2. Build query parameters
    const qs = [
        // --- SENSORS ---
        `field:photo_pitch=${o.pitch.toFixed(2)}`,
        `field:photo_roll=${o.roll.toFixed(2)}`,
        `field:photo_direction=${o.direction.toFixed(1)}`,       
        // UTM coordinates
        `field:latitude_y_camera=${o.northing.toFixed(2)}`,
        `field:longitude_x_camera=${o.easting.toFixed(2)}`,
        `field:photo_accuracy=${o.accuracy.toFixed(1)}`,
        `field:altitude=${o.elevation.toFixed(2)}`,       
        `field:loaded_data=yes`,
        // --- RECOVERED DATA ---
        `field:name=${encodeURIComponent(surveyData.name)}`,
        `field:email_contact=${encodeURIComponent(surveyData.email)}`, 
        `field:height_user=${encodeURIComponent(surveyData.height)}`, 
        `field:typeLand=${encodeURIComponent(surveyData.landType)}`,
        `field:typeDescription=${encodeURIComponent(surveyData.landDesc)}`
    ].join("&");

    // 3. Open Survey123
    console.log("Sending URL:", qs);
    const url = `arcgis-survey123://?itemID=${itemID}&${qs}`;
    
    window.location.href = url;
};
