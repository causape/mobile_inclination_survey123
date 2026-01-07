# Mobile Sensor Capture 

This is a web tool I built to capture sensor data (like GPS and device tilt) and send it directly to **ArcGIS Survey123**.

It acts as a bridge: you take a photo here, the app calculates your exact location (converting GPS to UTM) and orientation, and then it opens Survey123 with all that data pre-filled.

## What it does
* **Captures Data:** Gets the Pitch, Roll, and Direction (Compass) from your phone.
* **GPS to UTM:** Automatically converts standard Latitude/Longitude into UTM coordinates.
* **Photo:** Takes a picture and saves the sensor data from that exact moment.
* **Connects to Survey123:** Sends all this info straight to the Survey123 app.

## How to use it

1.  Open the web link on your mobile phone.
2.  Tap **"Allow Sensors"** (You need to do this for the compass/tilt to work).
3.  Tap **"Take Photo"**.
    * *Tip:* If you are on Android, wait 1-2 seconds before snapping the photo so the sensors stabilize.
4.  **Important:** Tap **"Save Photo"** to download the image to your gallery. (If you are using IPhone you can press the image and save it manually into your gallery)
5.  Finally, tap **"Open Survey123 with Values"**. This opens the app and fills in your form.

## Setup
Right now, this is connected to a specific Survey123 form.

**Current Form ID:** `64a2a232b4ad4c1fb2318c3d0a6c23aa`

If you want to use a different form, just open `script.js` and change the `itemID` variable at the top of the javascript file (script.js).

## Notes
* **HTTPS Required:** This only works if hosted on a secure site (like GitHub Pages) because browsers block sensor access on insecure sites.

