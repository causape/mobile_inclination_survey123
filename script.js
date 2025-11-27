<!-- HTML -->
<label>Heading: <span id="heading">0</span>°</label><br>
<label>Pitch: <span id="pitch">0</span>°</label><br>
<label>Roll: <span id="roll">0</span>°</label><br>
<label>Direction: <span id="direction">0</span>°</label><br>
<label>Latitude: <span id="latitude">0</span></label><br>
<label>Longitude: <span id="longitude">0</span></label><br>
<label>Accuracy: <span id="accuracy">0</span> m</label><br>
<label>Elevation: <span id="elevation">0</span> m</label><br>
<input type="file" id="cameraInput" accept="image/*" capture="environment"><br>
<button id="reqPerm">Request Sensor Permission (iOS)</button>
<button id="openSurvey">Open Survey123</button>
<img id="photoPreview" width="200" />

<script>
const itemID = "64a2a232b4ad4c1fb2318c3d0a6c23aa";
const surveyBase = `arcgis-survey123:///?itemID=${itemID}`;

let geoWatchID = null;

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

// Capture photo and freeze sensors
document.getElementById('cameraInput').addEventListener('change', (ev) => {
  const file = ev.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const imageData = e.target.result;
    document.getElementById('photoPreview').src = imageData;
    window._photoData = imageData;
  };
  reader.readAsDataURL(file);
});

// Device orientation updates in real-time
window.addEventListener('deviceorientation', (ev) => {
  let heading;

  if (typeof ev.webkitCompassHeading !== "undefined") {
    heading = ev.webkitCompassHeading; // iOS
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

  window._ori_foto = window._ori_foto || {};
  window._ori_foto.heading = heading;
  window._ori_foto.pitch = pitch;
  window._ori_foto.roll = roll;
  window._ori_foto.direction = direction;

  document.getElementById('heading').textContent = heading.toFixed(1);
  document.getElementById('pitch').textContent = pitch.toFixed(1);
  document.getElementById('roll').textContent = roll.toFixed(1);
  document.getElementById('direction').textContent = direction.toFixed(1);
});

// Geolocation updates in real-time
if (navigator.geolocation) {
  geoWatchID = navigator.geolocation.watchPosition(pos => {
    window._ori_foto = window._ori_foto || {};
    window._ori_foto.lat = pos.coords.latitude;
    window._ori_foto.lon = pos.coords.longitude;
    window._ori_foto.accuracy = pos.coords.accuracy;
    window._ori_foto.elevation = pos.coords.altitude || 0;

    document.getElementById('latitude').textContent = pos.coords.latitude.toFixed(6);
    document.getElementById('longitude').textContent = pos.coords.longitude.toFixed(6);
    document.getElementById('accuracy').textContent = pos.coords.accuracy.toFixed(1);
    document.getElementById('elevation').textContent = (pos.coords.altitude || 0).toFixed(2);
  }, err => {
    alert("Geolocation error: " + err.message);
  }, { enableHighAccuracy: true });
}

// Open Survey123 with frozen values
document.getElementById('openSurvey').onclick = () => {
  if (!window._ori_foto) {
    alert("Take a photo first to capture sensor values.");
    return;
  }

  const o = window._ori_foto;
  const height = parseFloat(document.getElementById('observer_height')?.value) || 1.6;

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
</script>
