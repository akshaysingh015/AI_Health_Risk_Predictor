import os
import joblib
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=os.environ.get("CLIENT_ORIGIN", "http://localhost:5173"))

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'health_risk_model.pkl')

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

        required_fields = [
            "Age", 
            "BMI", 
            "daily_steps", 
            "screen_time_hours", 
            "water_intake_liters", 
            "junk_food_frequency"
        ]

        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: '{field}'"}), 400

        try:
            input_features = [
                float(data["Age"]),
                float(data["BMI"]),
                float(data["daily_steps"]),
                float(data["screen_time_hours"]),
                float(data["water_intake_liters"]),
                float(data["junk_food_frequency"])
            ]
        except ValueError as ve:
            return jsonify({
                "error": f"Data type error. Please ensure all inputs are numbers. Details: {str(ve)}"
            }), 400

        prediction = model.predict([input_features])[0]
        probabilities = model.predict_proba([input_features])[0]
        
        confidence = round(float(max(probabilities)), 4)
        risk_level = "High" if prediction == 1 or str(prediction).lower() == 'high' else "Low"

        return jsonify({
            "risk": risk_level,
            "confidence": confidence
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