// ----------------------------
// CONFIGURATION
// ----------------------------

// Survey123 item ID and base URL scheme
const itemID = "64a2a232b4ad4c1fb2318c3d0a6c23aa";
const surveyBase = `arcgis-survey123:///?itemID=${itemID}`;

// ----------------------------
// REQUEST SENSOR PERMISSION (iOS)
// ----------------------------

document.getElementById('reqPerm').onclick = async () => {
  // Check if iOS requires explicit permission for motion sensors
  if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) {
    try {
      // Request permission for device motion sensors (iOS 13+)
      const res = await DeviceMotionEvent.requestPermission();
      alert("Sensor permission (iOS): " + res);
    } catch (err) {
      // If permission request fails
      alert("Sensor permission request failed: " + err);
    }
  } else if (window.DeviceOrientationEvent) {
    // Sensors available on non-iOS devices
    alert("Sensor access available.");
  } else {
    // Device does not support orientation sensors
    alert("Device orientation sensors not supported.");
  }
};

// ----------------------------
// CAPTURE PHOTO + FREEZE ORIENTATION & GPS VALUES
// ----------------------------

document.getElementById('cameraInput').addEventListener('change', (ev) => {
  const file = ev.target.files[0];
  if (!file) return; // Exit if no file selected

  const reader = new FileReader();

  // Read selected image and show preview
  reader.onload = function (e) {
    const imageData = e.target.result;
    document.getElementById('photoPreview').src = imageData;
    window._photoData = imageData; // Save base64 photo globally

    // Function to capture orientation sensor values ONCE
    const captureOrientation = (ev) => {
      let heading;

      // iOS uses a special compass property
      if (typeof ev.webkitCompassHeading !== "undefined") {
        heading = ev.webkitCompassHeading;

      // Some devices support absolute orientation
      } else if (ev.absolute) {
        heading = ev.alpha;

      // Otherwise fallback to calculated heading
      } else {
        heading = 360 - (ev.alpha || 0);
      }

      // Normalize heading to 0–360°
      if (heading < 0) heading += 360;
      if (heading > 360) heading -= 360;

      // Capture pitch (beta) and roll (gamma)
      const pitch = ev.beta || 0;
      const roll = ev.gamma || 0;
      const direction = heading; // Same as heading

      // Store all orientation data globally
      window._ori_foto = { heading, pitch, roll, direction };

      // Display sensor values on screen
      document.getElementById('heading').textContent = heading.toFixed(1);
      document.getElementById('pitch').textContent = pitch.toFixed(1);
      document.getElementById('roll').textContent = roll.toFixed(1);
      document.getElementById('direction').textContent = direction.toFixed(1);

      // Stop listening after the first reading
      window.removeEventListener('deviceorientation', captureOrientation);

      // ----------------------------
      // CAPTURE GEOLOCATION ONE TIME
      // ----------------------------
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          // Store GPS attributes
          window._ori_foto.lat = pos.coords.latitude;
          window._ori_foto.lon = pos.coords.longitude;
          window._ori_foto.accuracy = pos.coords.accuracy;
          window._ori_foto.elevation = pos.coords.altitude || 0;

          // Display GPS values in UI
          document.getElementById('latitude').textContent = window._ori_foto.lat.toFixed(6);
          document.getElementById('longitude').textContent = window._ori_foto.lon.toFixed(6);
          document.getElementById('accuracy').textContent = window._ori_foto.accuracy.toFixed(1);
          document.getElementById('elevation').textContent = window._ori_foto.elevation.toFixed(2);
        }, err => {
          // Geolocation error handling
          alert("Geolocation error: " + err.message);
        }, { enableHighAccuracy: true });
      }
    };

    // Start listening for orientation events
    window.addEventListener('deviceorientation', captureOrientation);
  };

  // Convert image to base64
  reader.readAsDataURL(file);
});

// ----------------------------
// OPEN SURVEY123 WITH FROZEN SENSOR VALUES
// ----------------------------

document.getElementById('openSurvey').onclick = () => {
  // User must take photo before opening Survey123
  if (!window._ori_foto) {
    alert("Take a photo first to capture sensor values.");
    return;
  }

  // Extract captured values
  const o = window._ori_foto;
  const height = parseFloat(document.getElementById('observer_height').value) || 1.6;

  // Build query string with pre-filled Survey123 fields
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

  // Create full Survey123 URL and redirect
  const url = surveyBase + "&" + qs;
  window.location.href = url;
};
