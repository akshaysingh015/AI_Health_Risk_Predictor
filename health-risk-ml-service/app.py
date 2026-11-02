import os
import joblib
import traceback
import math
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=os.environ.get("CLIENT_ORIGIN", "http://localhost:5173"))

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'health_risk_model.pkl')
MODERATE_RISK_THRESHOLD = 0.30
HIGH_RISK_THRESHOLD = 0.60

def clamp(value, minimum=0.0, maximum=1.0):
    return max(minimum, min(maximum, value))


def lifestyle_risk_score(data, model_high_probability):
    """Blend the trained model with every health signal collected by the app."""
    bmi = data["BMI"]
    age = data["Age"]
    sleep = data["sleep_hours"]
    steps = data["daily_steps"]
    exercise = data["exercise_minutes"]
    screen_time = data["screen_time_hours"]
    stress = data["stress_level"]
    water = data["water_intake_liters"]
    junk_food = data["junk_food_frequency"]

    bmi_risk = clamp(abs(bmi - 22) / 15)
    age_risk = clamp((age - 40) / 40)
    sleep_risk = clamp(abs(sleep - 7.5) / 4)
    steps_risk = clamp((7000 - steps) / 7000)
    exercise_risk = clamp((30 - exercise) / 30)
    screen_risk = clamp((screen_time - 4) / 6)
    stress_risk = clamp((stress - 1) / 9)
    water_risk = clamp((2 - water) / 2)
    junk_food_risk = clamp(junk_food / 5)

    return clamp(
        model_high_probability * 0.35
        + bmi_risk * 0.10
        + age_risk * 0.05
        + steps_risk * 0.15
        + screen_risk * 0.10
        + water_risk * 0.05
        + junk_food_risk * 0.05
        + sleep_risk * 0.08
        + exercise_risk * 0.04
        + stress_risk * 0.03
    )


FIELD_LIMITS = {
    "Age": (1, 120),
    "BMI": (10, 80),
    "daily_steps": (0, 100000),
    "screen_time_hours": (0, 24),
    "water_intake_liters": (0, 20),
    "junk_food_frequency": (0, 20),
    "sleep_hours": (0, 24),
    "exercise_minutes": (0, 1440),
    "stress_level": (1, 10),
}


def parse_input(data):
    values = {}
    for field, (minimum, maximum) in FIELD_LIMITS.items():
        if field not in data or isinstance(data[field], bool):
            raise ValueError(f"Missing required field: '{field}'")

        try:
            value = float(data[field])
        except (TypeError, ValueError):
            raise ValueError(f"Field '{field}' must be a number.")

        if not math.isfinite(value) or value < minimum or value > maximum:
            raise ValueError(
                f"Field '{field}' must be between {minimum} and {maximum}."
            )
        values[field] = value
    return values


def model_input(values):
    columns = [
        "Age",
        "BMI",
        "daily_steps",
        "screen_time_hours",
        "water_intake_liters",
        "junk_food_frequency",
    ]
    features = [values[column] for column in columns]
    feature_names = getattr(model, "feature_names_in_", None)
    if feature_names is not None:
        return pd.DataFrame([features], columns=feature_names)
    return [features]


try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print("[OK] Machine Learning model loaded successfully into memory.")
    else:
        print(f"[ERROR] Model file not found at {MODEL_PATH}")
        model = None
except Exception as e:
    print(f"[ERROR] Failed to load the model file: {str(e)}")
    model = None

@app.route('/predict', methods=['POST'])
def predict_risk():
    if model is None:
        return jsonify({"error": "Machine Learning model is unavailable on the server."}), 500

    try:
        if not request.is_json:
            return jsonify({"error": "Invalid request format. Must be JSON."}), 400

        data = request.get_json()

        try:
            values = parse_input(data)
        except ValueError as error:
            return jsonify({"error": str(error)}), 400

        prediction_input = model_input(values)
        probabilities = model.predict_proba(prediction_input)[0]

        classes = list(model.classes_)
        high_risk_index = next(
            (index for index, value in enumerate(classes)
             if value == 1 or str(value).lower() in ("1", "high")),
            None
        )
        if high_risk_index is None:
            return jsonify({"error": "Model does not expose a high-risk class."}), 500

        confidence = round(float(max(probabilities)), 4)
        model_high_probability = float(probabilities[high_risk_index])
        high_risk_probability = round(
            lifestyle_risk_score(values, model_high_probability), 4
        )
        risk_level = (
            "High" if high_risk_probability >= HIGH_RISK_THRESHOLD
            else "Moderate" if high_risk_probability >= MODERATE_RISK_THRESHOLD
            else "Low"
        )

        return jsonify({
            "risk": risk_level,
            "risk_score": high_risk_probability,
            "confidence": confidence,
            "model_risk_score": round(model_high_probability, 4)
        }), 200

    except Exception as e:
        print(f"Server Exception: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": "An unexpected server error occurred during prediction."}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "model_loaded": model is not None}), 200

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)