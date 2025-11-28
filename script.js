// ----------------------------
// CONFIGURATION
// ----------------------------

// Survey123 surveyId y token
const surveyId = "64a2a232b4ad4c1fb2318c3d0a6c23aa";
const token = "AQUI_TU_TOKEN";  // <- reemplaza con tu token válido

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
// CAPTURE PHOTO + FREEZE ORIENTATION & GPS VALUES
// ----------------------------

document.getElementById('cameraInput').addEventListener('change', (ev) => {
  const file = ev.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const imageData = e.target.result;
    document.getElementById('photoPreview').src = imageData;
    window._photoData = imageData; // Guardar foto base64 globalmente

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
// SEND DATA + PHOTO TO SURVEY123 API
// ----------------------------

document.getElementById('openSurvey').onclick = async () => {

  if (!window._ori_foto || !window._photoData) {
    alert("Take a photo first to capture sensor values.");
    return;
  }

  const o = window._ori_foto;
  const height = parseFloat(document.getElementById('observer_height').value) || 1.6;

  const payload = {
    heading: o.heading,
    pitch: o.pitch,
    roll: o.roll,
    direction: o.direction,
    lat: o.lat,
    lon: o.lon,
    accuracy: o.accuracy,
    elevation: o.elevation,
    observer_height: height,
    photo_base64: window._photoData
  };

  try {
    const resp = await fetch("http://127.0.0.1:5000/sendSurvey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await resp.json();
    console.log(result);
    if (result.success) {
      alert("Data sent successfully to Survey123!");
    } else {
      alert("Error sending data: " + JSON.stringify(result));
    }
  } catch (err) {
    alert("Network error: " + err);
  }
};
