// ----------------------------
// 1. CONFIGURACIÓN Y LECTURA DE PARÁMETROS URL
// ----------------------------
const itemID = "64a2a232b4ad4c1fb2318c3d0a6c23aa"; // tu Survey123

// Usamos URLSearchParams para leer limpiamente los datos que vienen de Survey123
const params = new URLSearchParams(window.location.search);

// Guardamos estos datos para volver a inyectarlos al salir
const surveyData = {
    name:     params.get('name') || "",
    email:    params.get('email') || "",
    height:   params.get('h_user') || "1.6", // Altura por defecto
    landType: params.get('tLand') || "",
    landDesc: params.get('tDesc') || ""
};

// Si viene la altura desde la URL, la ponemos en el input de la web
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

            // Inicializamos lat/lon a 0 para evitar errores si el GPS tarda en responder
            window._ori_foto = { 
                heading, pitch, roll, direction,
                lat: 0, lon: 0, accuracy: 0, elevation: 0
            };

            document.getElementById('heading').textContent = heading.toFixed(1);
            document.getElementById('pitch').textContent = pitch.toFixed(1);
            document.getElementById('roll').textContent = roll.toFixed(1);
            document.getElementById('direction').textContent = direction.toFixed(1);

            window.removeEventListener('deviceorientation', captureOrientation);

            // Capture geolocation ONE TIME
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
// ----------------------------
// 5. ABRIR SURVEY123 (RE-INJECT DATA)
// ----------------------------
document.getElementById('openSurvey').onclick = () => {
    // 1. Verificación de foto
    if (!window._ori_foto) {
        alert("⚠️ Por favor, toma la foto primero.");
        return;
    }

    const o = window._ori_foto;
    
    // --- LÓGICA DE ALTURA SIN VALOR POR DEFECTO ---
    const rawHeight = document.getElementById('observer_height').value;
    
    // Si hay algo escrito, lo pasamos a número con 2 decimales. 
    // Si está vacío (""), se queda vacío ("").
    const heightToSend = rawHeight ? parseFloat(rawHeight).toFixed(2) : "";

    // 2. Construcción de parámetros
    const qs = [
        // --- SENSORES ---
        `field:photo_heading=${o.heading.toFixed(2)}`,
        `field:photo_pitch=${o.pitch.toFixed(2)}`,
        `field:photo_roll=${o.roll.toFixed(2)}`,
        `field:latitude_y_camera=${o.lat.toFixed(6)}`,
        `field:longitude_x_camera=${o.lon.toFixed(6)}`,
        `field:photo_accuracy=${o.accuracy.toFixed(1)}`,
        `field:photo_direction=${o.direction.toFixed(1)}`,
        `field:altitude=${o.elevation.toFixed(2)}`,
        
        // Aquí enviamos la altura (o vacío si no la puso)
        `field:height_user=${heightToSend}`, 

        // --- DATOS RECUPERADOS ---
        `field:name=${encodeURIComponent(surveyData.name)}`,
        `field:email_contact=${encodeURIComponent(surveyData.email)}`, 
        `field:typeLand=${encodeURIComponent(surveyData.landType)}`,
        `field:typeDescription=${encodeURIComponent(surveyData.landDesc)}`
    ].join("&");

    // 3. Abrir Survey123
    console.log("Enviando URL:", qs);
    const url = `arcgis-survey123://?itemID=${itemID}&${qs}`;
    
    window.location.href = url;
};
