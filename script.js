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
    landDesc:   params.get('tDesc') || "",
    globalId:   params.get('globalId') || ""
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
document.getElementById('openSurvey').onclick = async () => {
    // Validación básica
    if (!window._ori_foto) {
        alert("⚠️ Por favor, toma la foto primero para capturar los sensores.");
        return;
    }

    const o = window._ori_foto;
    // Leemos la altura final del input (por si el usuario la cambió manualmente en la web)
    const finalHeight = document.getElementById('observer_height').value;

    // CONSTRUIMOS EL OBJETO JSON
    // Aquí mezclamos: 
    // A) Los datos nuevos calculados (sensores)
    // B) Los datos antiguos que vinieron de Survey123 (para restaurarlos)
    const dataObj = {
        // --- NUEVOS DATOS (SENSORES) ---
        h: o.heading.toFixed(2),
        p: o.pitch.toFixed(2),
        r: o.roll.toFixed(2),
        lat: o.lat.toFixed(6),
        lon: o.lon.toFixed(6),
        acc: o.accuracy.toFixed(1),
        alt: o.elevation.toFixed(2),
        dir: o.direction.toFixed(1),
        obs_h: finalHeight,

        // --- DATOS RECUPERADOS (DEVOLUCIÓN) ---
        // Estas claves ("form_name", etc.) son las que usarás en pulldata("@json")
        form_name: surveyData.name,
        form_email: surveyData.email,
        form_land: surveyData.landType,
        form_desc: surveyData.landDesc
    };

    const jsonString = JSON.stringify(dataObj);

    // INTENTAR COPIAR AUTOMÁTICAMENTE
    try {
        await navigator.clipboard.writeText(jsonString);
        alert("✅ ¡Datos copiados con éxito!\n\n1. Vuelve a Survey123.\n2. Pega en el cuadro de texto.");
    } catch (err) {
        console.error("Fallo al copiar auto:", err);
        // Fallback: Si el navegador bloquea el copiado, mostramos un cuadro para copiar manual
        prompt("Copia este código manualmente y pégalo en Survey123:", jsonString);
    }
};
