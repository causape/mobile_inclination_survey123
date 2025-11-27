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

  const pitch_sensor = ev.beta || 0;
  const roll = ev.gamma || 0;
  const direction = heading;

  // Ajuste del pitch respecto al horizonte
  const pitch_real = 90 - pitch_sensor;  // ahora 0° = horizontal, + hacia abajo

  // Altura del observador
  const observer_height = parseFloat(document.getElementById('observer_height').value) || 1.6;
  const elevation = window._ori_foto?.elevation || 0; // si ya existe
  const SURFACE_OFFSET = 0; // opcional

  // Convertir a radianes
  const pitch_rad = Math.abs(pitch_real) * Math.PI / 180;

  // Calcular distancia máxima visible
  let distance_max;
  if (pitch_rad < 0.01) {  // casi horizontal
    distance_max = 1000;    // límite máximo
  } else {
    distance_max = (observer_height + elevation + SURFACE_OFFSET) / Math.tan(pitch_rad);
  }

  // Guardar en objeto global
  window._ori_foto = {
    heading,
    pitch: pitch_sensor,
    roll,
    direction,
    pitch_real,
    distance_max
  };

  document.getElementById('heading').textContent = heading.toFixed(1);
  document.getElementById('pitch').textContent = pitch_sensor.toFixed(1);
  document.getElementById('roll').textContent = roll.toFixed(1);
  document.getElementById('direction').textContent = direction.toFixed(1);
  document.getElementById('distance').textContent = distance_max.toFixed(2) + " m";

  window.removeEventListener('deviceorientation', captureOrientation);

  // Capture geolocation ONE TIME (igual que antes)
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
