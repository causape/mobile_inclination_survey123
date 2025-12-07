// ----------------------------
// 1. UTM CONFIG FOR BADEN-BADEN (Zone 32N WGS84)
// ----------------------------
const utm32 = "+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs";

// ----------------------------
// 2. URL PARAMETERS CONFIGURATION AND READING
// ----------------------------
const itemID = "64a2a232b4ad4c1fb2318c3d0a6c23aa"; // Survey123 ID

const params = new URLSearchParams(window.location.search);

const surveyData = {
    name:     params.get('name') || "",
    email:    params.get('email') || "",
    height:   params.get('h_user')|| "",
    landType: params.get('tLand') || "",
    landDesc: params.get('tDesc') || ""
};

// ----------------------------
// 3. REQUEST SENSOR PERMISSION
// ----------------------------
document.getElementById('reqPerm').onclick = async () => {

    if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) {
        try {
            const res = await DeviceMotionEvent.requestPermission();
            alert("iOS sensor permission: " + res);
        } catch (err) {
            alert("iOS permission failed: " + err);
        }
    } else if (window.DeviceOrientationEvent) {
        alert("Sensors ready...");

        const initListener = (ev) => {
            window.removeEventListener('deviceorientation', initListener);
        };
        window.addEventListener('deviceorientation', initListener);

    } else {
        alert("Device sensors not supported.");
    }
};

// ----------------------------
// 4. CAPTURE PHOTO + ORIENTATION
// ----------------------------
document.getElementById('cameraInput').addEventListener('change', (ev) => {

    const file = ev.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        const imageData = e.target.result;
        document.getElementById('photoPreview').src = imageData;
        window._photoData = imageData;

        const captureOrientation = (ev) => {

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

            window._ori_foto = {
                pitch, roll, direction,
                lat: 0, lon: 0,
                easting: 0, northing: 0,
                accuracy: 0, elevation: 0
            };

            document.getElementById('pitch').textContent = pitch.toFixed(1);
            document.getElementById('roll').textContent = roll.toFixed(1);
            document.getElementById('direction').textContent = direction.toFixed(1);

            window.removeEventListener('deviceorientation', captureOrientation);

            // ----------------------------
            // 5. GET GEOLOCATION + CONVERT TO UTM
            // ----------------------------
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {

                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;

                    // Convert Lat/Lon to UTM 32N
                    const [easting, northing] = proj4("WGS84", utm32, [lon, lat]);

                    window._ori_foto.lat = lat;
                    window._ori_foto.lon = lon;
                    window._ori_foto.easting = easting;
                    window._ori_foto.northing = northing;
                    window._ori_foto.accuracy = pos.coords.accuracy;
                    window._ori_foto.elevation = pos.coords.altitude || 0;

                    // UPDATE UI (only UTM + accuracy + elevation)
                    document.getElementById('easting').textContent = easting.toFixed(2);
                    document.getElementById('northing').textContent = northing.toFixed(2);
                    document.getElementById('accuracy').textContent = pos.coords.accuracy.toFixed(1);
                    document.getElementById('elevation').textContent = (pos.coords.altitude || 0).toFixed(2);

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
// 6. OPEN SURVEY123 (SEND DATA BACK)
// ----------------------------
document.getElementById('openSurvey').onclick = () => {

    if (!window._ori_foto) {
        alert("⚠️ Take the photo first.");
        return;
    }

    const o = window._ori_foto;

    const qs = [
        `field:photo_pitch=${o.pitch.toFixed(2)}`,
        `field:photo_roll=${o.roll.toFixed(2)}`,
        `field:photo_direction=${o.direction.toFixed(1)}`,       

        // UTM coordinates to Survey123
        `field:easting=${o.easting.toFixed(2)}`,
        `field:northing=${o.northing.toFixed(2)}`,
        `field:photo_accuracy=${o.accuracy.toFixed(1)}`,
        `field:altitude=${o.elevation.toFixed(2)}`,

        `field:loaded_data=yes`,

        // Recovered form data
        `field:name=${encodeURIComponent(surveyData.name)}`,
        `field:email_contact=${encodeURIComponent(surveyData.email)}`, 
        `field:height_user=${encodeURIComponent(surveyData.height)}`, 
        `field:typeLand=${encodeURIComponent(surveyData.landType)}`,
        `field:typeDescription=${encodeURIComponent(surveyData.landDesc)}`
    ].join("&");

    const url = `arcgis-survey123://?itemID=${itemID}&${qs}`;
    window.location.href = url;
};
