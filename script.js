document.getElementById('openSurvey').onclick = async () => {

  if (!window._ori_foto || !window._photoData) {
    alert("Take a photo first to capture sensor values.");
    return;
  }

  const token = "AQUI_TU_TOKEN";  // ← colócalo aquí
  const surveyId = "64a2a232b4ad4c1fb2318c3d0a6c23aa";

  const o = window._ori_foto;
  const height = parseFloat(document.getElementById('observer_height').value) || 1.6;

  // -------------------------------------
  // 1. Convert base64 photo to Blob
  // -------------------------------------
  const base64 = window._photoData.split(",")[1];
  const binary = atob(base64);
  const len = binary.length;
  const buffer = new Uint8Array(len);

  for (let i = 0; i < len; i++) buffer[i] = binary.charCodeAt(i);

  const photoBlob = new Blob([buffer], { type: "image/jpeg" });

  // -------------------------------------
  // 2. Build formData to send to Survey123
  // -------------------------------------
  const fd = new FormData();

  fd.append("f", "json");
  fd.append("token", token);
  fd.append("surveyId", surveyId);

  // Atributos del formulario
  fd.append("feature", JSON.stringify({
    attributes: {
      photo_heading: o.heading,
      photo_pitch: o.pitch,
      photo_roll: o.roll,
      latitude_y_camera: o.lat,
      longitude_x_camera: o.lon,
      photo_accuracy: o.accuracy,
      photo_direction: o.direction,
      altitude: o.elevation,
      observer_height: height
    },
    geometry: {
      x: o.lon,
      y: o.lat
    }
  }));

  // Foto como attachment
  fd.append("attachment", photoBlob, "photo.jpg");

  // -------------------------------------
  // 3. Send to Survey123 API
  // -------------------------------------
  const response = await fetch("https://survey123.arcgis.com/api/submit", {
    method: "POST",
    body: fd
  });

  const result = await response.json();
  console.log(result);

  if (result.success) {
    alert("Data sent successfully to Survey123!");
  } else {
    alert("Error sending to Survey123: " + JSON.stringify(result));
  }
};
