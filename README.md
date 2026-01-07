# Mobile Sensor Capture 

A progressive web application designed to capture precise mobile sensor data (orientation and location) and calculate UTM coordinates in real-time. This tool acts as a "middleware" bridge to inject enriched data into **ArcGIS Survey123** forms.

## Key Features

* **Sensor Capture:** Retrieves Pitch, Roll, and Direction (Compass/Azimuth) from the device.
* **Advanced Geolocation:** Converts WGS84 coordinates (Latitude/Longitude) to **UTM (Easting/Northing)** and automatically calculates the UTM Zone using Krüger formulas.
* **Camera Integration:** Allows users to take a photo while capturing the exact sensor orientation at the moment of capture.
* **Survey123 Integration:** Automatically redirects to the ArcGIS Survey123 app via URL Schemes, passing all calculated data and user information.

## Tech Stack

* **HTML5 & CSS3:** Modern, responsive design with glassmorphism effects.
* **JavaScript (Vanilla):**
    * `DeviceOrientation` API for motion sensors.
    * `Geolocation` API for GPS data.
    * Custom mathematical algorithms for map projection (WGS84 to UTM).
* **Integration:** Uses the `arcgis-survey123://` URL scheme.

## How to Use

This application is designed to be opened via a link containing predefined parameters (e.g., from an email or a QR code).

1.  **Open the App:** Load the webpage on a mobile device.
2.  **Permissions:** Click **"Allow Sensors"** (Required for iOS 13+ and modern Android).
3.  **Capture:**
    * Click **"Take Photo"**.
    * *Android Note:* Wait a few seconds before snapping the picture to ensure sensors stabilize.
4.  **Save:** Press **"Save Photo"** to download the image to your gallery (this is required before attaching it in Survey123).
5.  **Submit:** Click **"Open Survey123 with Values"**. This will launch the Survey123 app and auto-fill the form with your data.

## URL Parameters

The application expects user information via URL parameters to pass them to the final form.

**Example URL:**
`https://your-username.github.io/your-repo/?name=John&email=test@test.com&tLand=Urban`

| Parameter | Description |
| :--- | :--- |
| `name` | Name of the surveyor. |
| `email` | Contact email. |
| `e_height` | Eye height. |
| `tLand` | Land Type. |
| `tDesc` | Land Description. |

## Configuration

The project is currently configured for a specific Survey123 form. To use a different form, update the `itemID` in `script.js`.

**Current Form ID:** `64a2a232b4ad4c1fb2318c3d0a6c23aa`

```javascript
// script.js
const itemID = "64a2a232b4ad4c1fb2318c3d0a6c23aa";
