// CONFIG
const itemID = "64a2a232b4ad4c1fb2318c3d0a6c23aa";
const surveyBase = `arcgis-survey123:///?itemID=${itemID}`;

// --- Solicitar permiso para sensores (iOS) ---
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

// --- Captura de foto y sensores ---
document.getElementById('cameraInput').addEventListener('change', (ev) => {
  const file = ev.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const imageData = e.target.result;
    document.getElementById('photoPreview').src = imageData;
    window._photoData = imageData;

    // Capturar orientación y geolocalización
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

      // Geolocalización
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

// --- Abrir Survey123 manteniendo valores ---
document.getElementById('openSurvey').onclick = () => {
  if (!window._ori_foto) {
    alert("Take a photo first to capture sensor values.");
    return;
  }

  const o = window._ori_foto;
  const height = parseFloat(document.getElementById('observer_height').value) || 1.6;

  // Construir query string de campos
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

  // --- Detectar si ya hay un registro existente ---
  let existingObjectId = document.getElementById('existingObjectId')?.value || null;

  let url;
  if (existingObjectId) {
    // Abrir registro existente y mantener campos previos
    url = `${surveyBase}&objectId=${existingObjectId}&${qs}`;
  } else {
    // Nuevo registro
    url = `${surveyBase}&${qs}`;
  }

  // Abrir Survey123
  window.location.href = url;
};
