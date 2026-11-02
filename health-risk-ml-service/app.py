import os
import joblib
import traceback
import math
import hashlib
import json
import pandas as pd
import sklearn
from flask import Flask, request, jsonify
from flask_cors import CORS
from risk import risk_level

app = Flask(__name__)
CORS(app, origins=os.environ.get("CLIENT_ORIGIN", "http://localhost:5173"))

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'health_risk_model.pkl')
METADATA_PATH = os.path.join(os.path.dirname(__file__), 'model_metadata.json')
MODERATE_RISK_THRESHOLD = 0.30
HIGH_RISK_THRESHOLD = 0.60
MODEL_VERSION = os.environ.get("MODEL_VERSION", "health-risk-model-v1-six-feature-hybrid")
VALIDATION_STATUS = "prototype_not_clinically_validated"


def load_model_metadata():
    try:
        with open(METADATA_PATH, "r", encoding="utf-8") as metadata_file:
            metadata = json.load(metadata_file)
        expected_hash = metadata.get("sha256")
        with open(MODEL_PATH, "rb") as model_file:
            actual_hash = hashlib.sha256(model_file.read()).hexdigest()
        if expected_hash != actual_hash:
            raise RuntimeError("Model checksum does not match model_metadata.json.")
        expected_version = metadata.get("trained_with", {}).get("scikit-learn")
        if expected_version != sklearn.__version__:
            raise RuntimeError(
                f"scikit-learn {expected_version} is required; "
                f"runtime has {sklearn.__version__}."
            )
        return metadata
    except (OSError, ValueError, KeyError) as error:
        raise RuntimeError(f"Invalid model metadata: {error}") from error

def clamp(value, minimum=0.0, maximum=1.0):
    return max(minimum, min(maximum, value))

def target_deviation_score(data):
    """Measure unhealthy deviation from the user's saved daily targets."""
    targets = data.get("targets")
    if not targets:
        return None

    def target_or_default(name, default):
        value = targets.get(name)
        return value if value is not None else default

    target_sleep = target_or_default("sleep", 7.5)
    target_steps = target_or_default("steps", 7000)
    target_exercise = target_or_default("exercise", 30)
    target_screen = target_or_default("screenTime", 4)
    target_stress = target_or_default("stressLevel", 1)
    target_water = target_or_default("water", 2)
    target_junk = target_or_default("junkFood", 0)

    sleep_deviation = clamp(abs(data["sleep_hours"] - target_sleep) / 4)
    steps_deviation = clamp(max(target_steps - data["daily_steps"], 0) / max(target_steps, 1))
    exercise_deviation = clamp(max(target_exercise - data["exercise_minutes"], 0) / max(target_exercise, 1))
    screen_deviation = clamp(max(data["screen_time_hours"] - target_screen, 0) / 6)
    stress_deviation = clamp(max(data["stress_level"] - target_stress, 0) / 9)
    water_deviation = clamp(max(target_water - data["water_intake_liters"], 0) / max(target_water, 1))
    junk_deviation = clamp(max(data["junk_food_frequency"] - target_junk, 0) / 5)

    return clamp(
        sleep_deviation * 0.18
        + steps_deviation * 0.18
        + exercise_deviation * 0.14
        + screen_deviation * 0.14
        + stress_deviation * 0.14
        + water_deviation * 0.10
        + junk_deviation * 0.12
    )


def rule_based_risk_score(data):
    """Score untrained lifestyle/profile signals without inventing ML labels."""
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

    smoking_risk = {"Non-smoker": 0.0, "Occasional": 0.5, "Regular": 1.0}[data["smoking_habit"]]
    alcohol_risk = {"None": 0.0, "Occasional": 0.5, "Regular": 1.0}[data["alcohol_consumption"]]

    baseline_score = clamp(
        bmi_risk * 0.12
        + age_risk * 0.06
        + steps_risk * 0.18
        + screen_risk * 0.12
        + water_risk * 0.06
        + junk_food_risk * 0.06
        + sleep_risk * 0.12
        + exercise_risk * 0.06
        + stress_risk * 0.10
        + smoking_risk * 0.06
        + alcohol_risk * 0.06
    )
    target_score = target_deviation_score(data)
    return clamp(baseline_score * 0.5 + target_score * 0.5) if target_score is not None else baseline_score

def rule_based_contributions(data):
    contributions = {
        "bmi": clamp(abs(data["BMI"] - 22) / 15) * 0.12,
        "age": clamp((data["Age"] - 40) / 40) * 0.06,
        "steps": clamp((7000 - data["daily_steps"]) / 7000) * 0.18,
        "screen_time": clamp((data["screen_time_hours"] - 4) / 6) * 0.12,
        "water": clamp((2 - data["water_intake_liters"]) / 2) * 0.06,
        "junk_food": clamp(data["junk_food_frequency"] / 5) * 0.06,
        "sleep": clamp(abs(data["sleep_hours"] - 7.5) / 4) * 0.12,
        "exercise": clamp((30 - data["exercise_minutes"]) / 30) * 0.06,
        "stress": clamp((data["stress_level"] - 1) / 9) * 0.10,
        "smoking": {"Non-smoker": 0.0, "Occasional": 0.03, "Regular": 0.06}[data["smoking_habit"]],
        "alcohol": {"None": 0.0, "Occasional": 0.03, "Regular": 0.06}[data["alcohol_consumption"]],
    }
    return {key: round(value, 4) for key, value in contributions.items()}


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
PROFILE_CATEGORIES = {
    "gender": {"Male", "Female", "Other"},
    "smoking_habit": {"Non-smoker", "Occasional", "Regular"},
    "alcohol_consumption": {"None", "Occasional", "Regular"},
}
TARGET_LIMITS = {
    "sleep": (0, 24),
    "steps": (0, 100000),
    "exercise": (0, 1440),
    "screenTime": (0, 24),
    "stressLevel": (1, 10),
    "water": (0, 20),
    "junkFood": (0, 20),
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
    for field, allowed in PROFILE_CATEGORIES.items():
        if data.get(field) not in allowed:
            raise ValueError(f"Field '{field}' must be one of: {', '.join(sorted(allowed))}.")
        values[field] = data[field]
    if "targets" in data and data["targets"] is not None:
        if not isinstance(data["targets"], dict):
            raise ValueError("Field 'targets' must be an object.")
        targets = {}
        for field, (minimum, maximum) in TARGET_LIMITS.items():
            value = data["targets"].get(field)
            if value is None:
                targets[field] = None
                continue
            if isinstance(value, bool):
                raise ValueError(f"Target '{field}' must be a number.")
            try:
                value = float(value)
            except (TypeError, ValueError):
                raise ValueError(f"Target '{field}' must be a number.")
            if not math.isfinite(value) or value < minimum or value > maximum:
                raise ValueError(f"Target '{field}' must be between {minimum} and {maximum}.")
            targets[field] = value
        values["targets"] = targets
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
        model_metadata = load_model_metadata()
        model = joblib.load(MODEL_PATH)
        print("[OK] Machine Learning model loaded successfully into memory.")
    else:
        print(f"[ERROR] Model file not found at {MODEL_PATH}")
        model = None
except Exception as e:
    print(f"[ERROR] Failed to load the model file: {str(e)}")
    model = None
    model_metadata = None

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
        rule_based_probability = round(rule_based_risk_score(values), 4)
        high_risk_probability = round(
            model_high_probability * 0.35 + rule_based_probability * 0.65, 4
        )
        risk_label = risk_level(high_risk_probability)

        return jsonify({
            "risk": risk_label,
            "risk_score": high_risk_probability,
            "confidence": confidence,
            "model_risk_score": round(model_high_probability, 4),
            "rule_based_score": rule_based_probability,
            "score_method": "prototype-hybrid-six-feature-model-plus-rule-based-all-inputs",
            "model_version": MODEL_VERSION,
            "validation_status": VALIDATION_STATUS,
            "confidence_status": "uncalibrated_research_estimate",
            "feature_contributions": rule_based_contributions(values)
        }), 200

    except Exception as e:
        print(f"Server Exception: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": "An unexpected server error occurred during prediction."}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy" if model is not None else "unhealthy",
        "model_loaded": model is not None,
        "model_version": MODEL_VERSION,
        "sklearn_version": sklearn.__version__,
        "validation_status": VALIDATION_STATUS,
        "confidence_status": "uncalibrated_research_estimate"
    }), 200 if model is not None else 503

if __name__ == '__main__':
    if os.environ.get("NODE_ENV") == "production" or os.environ.get("FLASK_ENV") == "production":
        raise RuntimeError("Do not use Flask's development server in production; run gunicorn app:app.")
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)