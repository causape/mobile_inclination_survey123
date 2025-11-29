// ----------------------------
// 1. CONFIGURACIÓN Y LECTURA DE URL
// ----------------------------
const itemID = "64a2a232b4ad4c1fb2318c3d0a6c23aa"; // Tu Survey123 ID

// Leemos los parámetros de la URL de forma robusta
const params = new URLSearchParams(window.location.search);

// Guardamos los datos ORIGINALES que vienen del formulario
// Usamos nombres de variables que coincidan con lo que enviaste en el enlace
const surveyData = {
    name:       params.get('name') || "",
    email:      params.get('email') || "",
    height:     params.get('h_user') || "1.6", // Valor por defecto 1.6 si viene vacío
    landType:   params.get('tLand') || "",
    landDesc:   params.get('tDesc') || ""    
};

// ----------------------------
// 2. INICIALIZACIÓN DE LA WEB
// ----------------------------
// Si la altura vino en la URL, la ponemos en el input visible de la web
const heightInput = document.getElementById('observer_height');
if (heightInput && surveyData.height) {
    heightInput.value = surveyData.height;
}

// ----------------------------
// REQUEST SENSOR PERMISSION (iOS)
// ----------------------------
document.getElementById('reqPerm').onclick = async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) {
        try {
            const res = await DeviceMotionEvent.requestPermission();
            alert("Sensor permission (iOS): " + res);
        } catch (err) {
            alert("Sensor permission request failed: " + err);
        }
    } else if (window.DeviceOrientationEvent) {
        alert("Sensor access available.");
    } else {
        alert("Device orientation sensors not supported.");
    }
};

// ----------------------------
// CAPTURE PHOTO + SENSORS
// ----------------------------
document.getElementById('cameraInput').addEventListener('change', (ev) => {
    const file = ev.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        const imageData = e.target.result;

        // Mostrar preview
        document.getElementById('photoPreview').src = imageData;
        window._photoData = imageData;

        // Capturar orientación 1 vez
        const captureOrientation = (ev) => {
            let heading;

            if (typeof ev.webkitCompassHeading !== "undefined") {
                heading = ev.webkitCompassHeading;
            } else if (ev.absolute) {
                heading = ev.alpha;
            } else {
                heading = 360 - (ev.alpha || 0);
            }

            if (heading < 0) heading += 360;
            if (heading > 360) heading -= 360;

            const pitch = ev.beta || 0;
            const roll = ev.gamma || 0;
            const direction = heading;

            window._ori_foto = { heading, pitch, roll, direction };

            document.getElementById('heading').textContent = heading.toFixed(1);
            document.getElementById('pitch').textContent = pitch.toFixed(1);
            document.getElementById('roll').textContent = roll.toFixed(1);
            document.getElementById('direction').textContent = direction.toFixed(1);

            window.removeEventListener('deviceorientation', captureOrientation);

            // GEOLOCALIZACIÓN
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                    window._ori_foto.lat = pos.coords.latitude;
                    window._ori_foto.lon = pos.coords.longitude;
                    window._ori_foto.accuracy = pos.coords.accuracy;
                    window._ori_foto.elevation = pos.coords.altitude || 0;

                    document.getElementById('latitude').textContent = window._ori_foto.lat.toFixed(6);
                    document.getElementById('longitude').textContent = window._ori_foto.lon.toFixed(6);
                    document.getElementById('accuracy').textContent = window._ori_foto.accuracy.toFixed(1);
                    document.getElementById('elevation').textContent = window._ori_foto.elevation.toFixed(2);

                }, err => {
                    alert("Geolocation error: " + err.message);
                }, { enableHighAccuracy: true });
            }
        };

        window.addEventListener('deviceorientation', captureOrientation);
    };

    reader.readAsDataURL(file);
});

// ----------------------------
// 5. BOTÓN FINAL: COPIAR AL PORTAPAPELES
// ----------------------------
// ----------------------------

// OPEN SURVEY123 WITH VALUES (EDIT MODE)

// ----------------------------

document.getElementById('openSurvey').onclick = () => {

    if (!window._ori_foto) {
        alert("Take a photo first to capture sensor values.");
        return;

    }

    const o = window._ori_foto;
    const height = parseFloat(document.getElementById('observer_height').value) || 1.6;
    const qs = [
        `field:photo_heading=${o.heading.toFixed(2)}`,
        `field:photo_pitch=${o.pitch.toFixed(2)}`,
        `field:photo_roll=${o.roll.toFixed(2)}`,
        `field:latitude_y_camera=${o.lat.toFixed(6)}`,
        `field:longitude_x_camera=${o.lon.toFixed(6)}`,
        `field:photo_accuracy=${o.accuracy.toFixed(1)}`,
        `field:photo_direction=${o.direction.toFixed(1)}`,
        `field:altitude=${o.elevation.toFixed(2)}`,
        `field:observer_height=${height.toFixed(2)}`

        // --- TUS DATOS RECUPERADOS (AQUÍ ESTÁ LA MAGIA) ---
        // Asegúrate que lo que va después de 'field:' es EXACTAMENTE el 'name' de tu Excel
        `field:name=${surveyData.name}`,
        `field:email_contact=${surveyData.email}`,
        `field:typeLand=${surveyData.landType}`,
        `field:typeDescription=${surveyData.landDesc}`

    ].join("&");



    // Abrir el mismo registro para editarlo

    const url = `arcgis-survey123://?itemID=${itemID}&${qs}`



    window.location.href = url;

}; 
