from flask import Flask, request, jsonify
import requests
import base64

app = Flask(__name__)

SURVEY123_URL = "https://survey123.arcgis.com/api/submit"
SURVEY_ID = "64a2a232b4ad4c1fb2318c3d0a6c23aa"
TOKEN = "AQUI_TU_TOKEN"  # Reemplaza con tu token válido

@app.route("/sendSurvey", methods=["POST"])
def send_survey():
    data = request.json

    photo_base64 = data.get("photo_base64").split(",")[1]
    photo_bytes = base64.b64decode(photo_base64)

    feature = {
        "attributes": {
            "photo_heading": data.get("heading"),
            "photo_pitch": data.get("pitch"),
            "photo_roll": data.get("roll"),
            "latitude_y_camera": data.get("lat"),
            "longitude_x_camera": data.get("lon"),
            "photo_accuracy": data.get("accuracy"),
            "photo_direction": data.get("direction"),
            "altitude": data.get("elevation"),
            "observer_height": data.get("observer_height")
        },
        "geometry": {
            "x": data.get("lon"),
            "y": data.get("lat")
        }
    }

    files = {
        "attachment_picture_taken": ("photo.jpg", photo_bytes, "image/jpeg")
    }
    payload = {
        "f": "json",
        "token": TOKEN,
        "surveyId": SURVEY_ID,
        "feature": requests.utils.json.dumps(feature)
    }

    try:
        resp = requests.post(SURVEY123_URL, data=payload, files=files)
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
