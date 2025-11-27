// CONFIG
const itemID = "64a2a232b4ad4c1fb2318c3d0a6c23aa";
const surveyBase = `arcgis-survey123:///?itemID=${itemID}`;

// Request sensor permission (iOS)
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

// Real-time device orientation
window._ori_real = { heading: 0, pitch: 0, roll: 0, direction: 0 };

window.addEventListener('deviceorientation', (ev) => {
  let heading;

  if (typeof ev.webkitCompassHeading !== "undefined") {
    // iOS: usa webkitCompassHeading (0-360)
    heading = ev.webkitCompassHeading;
  } else if (ev.absolute) {
    // Android con valor absoluto
    heading = ev.alpha;
  } else {
    // Android relativo
    heading = 360 - (ev.alpha || 0);
  }

  // Normalizar a 0-360
  if (heading < 0) heading += 360;
  if (heading > 360) heading -= 360;

  const pitch = ev.beta || 0;
  const roll = ev.gamma || 0;
  const direction = heading;

  window._ori_real = { ...window._ori_real, heading, pitch, roll, direction };

  document.getElementById('heading').textContent = heading.toFixed(1);
  document.getElementById('pitch').textContent = pitch.toFixed(1);
  document.getElementById('roll').textContent = roll.toFixed(1);
  document.getElementById('direction').textContent = direction.toFixed(1);
});

// Real-time geolocation
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(pos => {
    window._ori_real.lat = pos.coords.latitude;
    window._ori_real.lon = pos.coords.longitude;
    window._ori_real.accuracy = pos.coords.accuracy;
    window._ori_real.elevation = pos.coords.altitude || 0;

    document.getElementById('latitude').textContent = window._ori_real.lat.toFixed(6);
    document.getElementById('longitude').textContent = window._ori_real.lon.toFixed(6);
    document.getElementById('accuracy').textContent = window._ori_real.accuracy.toFixed(1);
    document.getElementById('elevation').textContent = window._ori_real.elevation.toFixed(2);
  }, err => {
    console.warn("Geolocation error: " + err.message);
  }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 });
}

// Capture photo (congela los sensores al momento de la foto)
document.getElementById('cameraInput').addEventListener('change', (ev) => {
  const file = ev.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const imageData = e.target.result;
    document.getElementById('photoPreview').src = imageData;
    window._photoData = imageData;

    // Freeze sensor values al momento de la foto
    window._ori_foto = { ...window._ori_real };
  };
  reader.readAsDataURL(file);
});

// Open Survey123 with frozen values
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
    `field:altitude=${o.elevation.toFixed(2)}`
  ].join("&");

  const url = surveyBase + "&" + qs;
  window.location.href = url;
};
