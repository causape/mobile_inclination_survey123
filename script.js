// ----------------------------
// CONFIG
// ----------------------------
const itemID = "64a2a232b4ad4c1fb2318c3d0a6c23aa";  // tu Survey123

// ----------------------------
// HELPERS
// ----------------------------
function getUrlParamsClean() {
    // usa URLSearchParams y limpia posibles llaves {}
    const params = {};
    const usp = new URLSearchParams(window.location.search);
    for (const [k, v] of usp.entries()) {
        if (!v) { params[k] = v; continue; }
        // decode y limpiar llaves { } si vienen codificadas o literales
        let val = decodeURIComponent(v);
        val = val.replace(/^\{+/, '').replace(/\}+$/, ''); // quita { y } al inicio/fin
        params[k] = val;
    }
    return params;
}

const urlParams = getUrlParamsClean();
console.log("URL completa recibida:", window.location.href);
console.log("Params recibidos (limpios):", urlParams);

let globalId = urlParams.globalId || null;
let objectId = urlParams.objectId || null;

// Si globalId contiene literalmente "{globalId}" o está vacío, nulléalo
if (globalId && globalId.toLowerCase().includes('globalid')) {
    globalId = null;
}
if (objectId && objectId.toLowerCase().includes('objectid')) {
    objectId = null;
}

console.log("globalId final:", globalId, "objectId final:", objectId);

// ----------------------------
// CAPTURE PHOTO AND SENSORS (omitido aquí: manten tu código)
// ----------------------------
// ... (tu lógica de cámara y sensor, window._ori_foto, etc.)

// ----------------------------
// OPEN SURVEY123 WITH VALUES (EDIT MODE) - con robust checks
// ----------------------------
document.getElementById('openSurvey').onclick = () => {
    if (!window._ori_foto) {
        alert("Take a photo first to capture sensor values.");
        return;
    }

    // Si no recibimos globalId ni objectId, no podemos abrir el registro existente
    if (!globalId && !objectId) {
        alert("No se detecta globalId/objectId en la URL. Abre esta web desde el botón del formulario (debe pasar globalId).");
        console.warn("No globalId/objectId => cannot open in edit mode. URL was:", window.location.href);
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
    ].join("&");

    // Construimos la URL de edición. Si tenemos globalId lo usamos; si no, usamos objectId
    let url;
    if (globalId) {
        url = `arcgis-survey123://?itemID=${itemID}&mode=edit&globalId=${encodeURIComponent(globalId)}&${qs}`;
    } else {
        // Survey123 admite objectId como parámetro en muchos casos
        url = `arcgis-survey123://?itemID=${itemID}&mode=edit&objectId=${encodeURIComponent(objectId)}&${qs}`;
    }

    console.log("Deep link que vamos a abrir:", url);
    window.location.href = url;
};
