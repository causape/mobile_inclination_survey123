// === CONFIG ===
const itemID = "64a2a232b4ad4c1fb2318c3d0a6c23aa"; // Your Survey123 Item ID
const surveyBase = `arcgis-survey123:///?itemID=${itemID}`;

// Request sensor permission for iOS and check Android support
document.getElementById('reqPerm').onclick = async () => {
  if(typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission){
    // iOS 13+ requires explicit permission
    try {
      const res = await DeviceMotionEvent.requestPermission();
      alert("Sensor permission (iOS): " + res);
    } catch (err){
      alert("Sensor permission request failed: " + err);
    }
  } else if(window.DeviceOrientationEvent){
    // Android / other browsers usually allow access automatically
    alert("Sensor access is available on your device.");
  } else {
    alert("Device orientation sensors are not supported on this device.");
  }
};

// Capture sensors in real time
window.addEventListener('deviceorientation', (ev)=>{
  const heading = 360 - (ev.alpha || 0);
  const pitch = ev.beta || 0;
  const roll = ev.gamma || 0;

  document.getElementById('heading').textContent = heading.toFixed(1);
  document.getElementById('pitch').textContent = pitch.toFixed(1);
  document.getElementById('roll').textContent = roll.toFixed(1);

  // Store latest values
  window._ori = {heading, pitch, roll};
});

// Capture photo and freeze sensor values
document.getElementById('cameraInput').addEventListener('change', (ev)=>{
  const file = ev.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    document.getElementById('photoPreview').src = e.target.result;
    window._photoData = e.target.result; // base64 if needed

    // Freeze sensor values at the moment of taking the photo
    if(window._ori){
      window._ori_foto = {
        heading: window._ori.heading,
        pitch: window._ori.pitch,
        roll: window._ori.roll
      };
    }
  }
  reader.readAsDataURL(file);
});

// Open Survey123 with frozen values
document.getElementById('openSurvey').onclick = () => {
  const o = window._ori_foto || {heading:0, pitch:0, roll:0};
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
