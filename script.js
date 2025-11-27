// === CONFIG ===
const itemID = "64a2a232b4ad4c1fb2318c3d0a6c23aa"; // Your Survey123 Item ID
const surveyBase = `arcgis-survey123:///?itemID=${itemID}`;

// Request sensor permission for iOS and check Android support
document.getElementById('reqPerm').onclick = async () => {
  if(typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission){
    try {
      const res = await DeviceMotionEvent.requestPermission();
      alert("Sensor permission (iOS): " + res);
    } catch (err){
      alert("Sensor permission request failed: " + err);
    }
  } else if(window.DeviceOrientationEvent){
    alert("Sensor access is available on your device.");
  } else {
    alert("Device orientation sensors are not supported on this device.");
  }
};

// Capture photo and freeze sensor values
document.getElementById('cameraInput').addEventListener('change', (ev)=>{
  const file = ev.target.files[0];
  if(!file) return;

  // Create a temporary image to read EXIF or orientation if needed
  const reader = new FileReader();
  reader.onload = function(e){
    const imageData = e.target.result;
    document.getElementById('photoPreview').src = imageData;
    window._photoData = imageData;

    // Capture sensor values at this moment
    window.addEventListener('deviceorientation', function captureOnce(ev){
      const heading = 360 - (ev.alpha || 0);
      const pitch = ev.beta || 0;
      const roll = ev.gamma || 0;

      // Freeze values
      window._ori_foto = { heading, pitch, roll };

      // Display frozen values
      document.getElementById('heading').textContent = heading.toFixed(1);
      document.getElementById('pitch').textContent = pitch.toFixed(1);
      document.getElementById('roll').textContent = roll.toFixed(1);

      // Remove listener after first capture
      window.removeEventListener('deviceorientation', captureOnce);
    });

    // Set up download link
    const downloadLink = document.getElementById('downloadPhoto');
    downloadLink.href = imageData;
    downloadLink.style.display = 'inline-block';
  }
  reader.readAsDataURL(file);
});

// Open Survey123 with frozen values
document.getElementById('openSurvey').onclick = () => {
  if(!window._ori_foto){
    alert("Please take a photo first to capture sensor values.");
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
