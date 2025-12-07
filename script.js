// ----------------------------
// 1. URL PARAMETERS CONFIGURATION AND READING
// ----------------------------
const itemID = "64a2a232b4ad4c1fb2318c3d0a6c23aa"; // your Survey123

// We use URLSearchParams to cleanly read the data coming from Survey123
const params = new URLSearchParams(window.location.search);
const utm32 = "+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs";

// --- DATA STORAGE ---
const surveyData = {
    name:     params.get('name') || "",
    email:    params.get('email') || "",
    height:   params.get('h_user')|| "",
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
        
        // Create a temporary event listener to "wake up" the sensors
        const initListener = (ev) => {
            console.log("First event captured for initialization:", ev);
            window.removeEventListener('deviceorientation', initListener);
        };
        window.addEventListener('deviceorientation', initListener);

        // Small delay to ensure correct values
        setTimeout(() => {
            alert("Sensors should be ready now. Take your photo.");
        }, 500);
    } 
    else {
        alert("Device orientation sensors not supported.");
    }
};

// ----------------------------
// CAPTURE PHOTO AND SENSORS
// ----------------------------
document.getElementById('cameraInput').addEventListener('change', (ev) => {
    const file = ev.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const imageData = e.target.result;
        document.getElementById('photoPreview').src = imageData;
        window._photoData = imageData;

        const captureOrientation = (ev) => {
            // --- Calculate direction directly ---
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

            // Initialize lat/lon to 0 to avoid errors if GPS takes time to respond
            window._ori_foto = { 
                pitch, roll, direction,
                lat: 0, lon: 0, accuracy: 0, elevation: 0
            };

            // Update UI
            document.getElementById('pitch').textContent = pitch.toFixed(1);
            document.getElementById('roll').textContent = roll.toFixed(1);
            document.getElementById('direction').textContent = direction.toFixed(1); // Label in UI: "Direction/Heading"

            // Remove listener after first capture
            window.removeEventListener('deviceorientation', captureOrientation);

            // Capture geolocation ONE TIME
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                    window._ori_foto.lat = pos.coords.latitude;
                    window._ori_foto.lon = pos.coords.longitude;
                    window._ori_foto.accuracy = pos.coords.accuracy;
                    window._ori_foto.elevation = pos.coords.altitude || 0;

                    try {
                        const [easting, northing] = proj4("WGS84", utm32, [
                            window._ori_foto.lon,
                            window._ori_foto.lat
                        ]);
                    
                        window._ori_foto.easting = easting;
                        window._ori_foto.northing = northing;
                    
                        document.getElementById('latitude').textContent = easting.toFixed(2);  // ahora EASTING
                        document.getElementById('longitude').textContent = northing.toFixed(2); // ahora NORTHING
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

// ----------------------------
// OPEN SURVEY123 (RE-INJECT DATA)
// ----------------------------
document.getElementById('openSurvey').onclick = () => {
    // 1. Photo verification
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
        `field:latitude_y_camera=${o.lat.toFixed(6)}`,
        `field:longitude_x_camera=${o.lon.toFixed(6)}`,
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
