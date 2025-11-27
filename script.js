// Config
const itemID = "64a2a232b4ad4c1fb2318c3d0a6c23aa";
const surveyBase = `arcgis-survey123:///?itemID=${itemID}`;

// Solicitar permiso sensores (iOS)
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

// Captura de foto y congelar sensores
document.getElementById('cameraInput').addEventListener('change', (ev) => {
  const file = ev.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const imageData = e.target.result;
    document.getElementById('photoPreview').src = imageData;
    window._photoData = imageData;

    // Capturar valores de sensores SOLO al tomar la foto
    const capture = (ev) => {
      const heading = 360 - (ev.alpha || 0);
      const pitch = ev.beta || 0;
      const roll = ev.gamma || 0;

      window._ori_foto = { heading, pitch, roll };

      document.getElementById('heading').textContent = heading.toFixed(1);
      document.getElementById('pitch').textContent = pitch.toFixed(1);
      document.getElementById('roll').textContent = roll.toFixed(1);

      // Solo una vez
      window.removeEventListener('deviceorientation', capture);
    };

    window.addEventListener('deviceorientation', capture);
  };
  reader.readAsDataURL(file);
});

// Abrir Survey123 con valores congelados
document.getElementById('openSurvey').onclick = () => {
  if (!window._ori_foto) {
    alert("Take a photo first to capture sensor values.");
    return;
  }

  const o = window._ori_foto;
  const height = parseFloat(document.getElementById('observer_height').value) || 1.6;

  const qs = [
    `field:heading_deg=${o.heading.toFixed(2)}`,
    `field:pitch_deg=${o.pitch.toFixed(2)}`,
    `field:roll_deg=${o.roll.toFixed(2)}`,
    `field:observer_height=${height.toFixed(2)}`
  ].join("&");

  const url = surveyBase + "&" + qs;
  window.location.href = url;
};
