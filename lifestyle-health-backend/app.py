from flask import Flask, request, jsonify
from flask_cors import CORS
import random # Just for our dummy prediction testing!

app = Flask(__name__)
CORS(app) # Allows your Node.js server to send requests here

@app.route('/predict', methods=['POST'])
def predict_risk():
    try:
        # 1. Catch the data sent by Node.js
        data = request.get_json()
        
        # 2. Extract the numbers (This matches your MongoDB blueprint!)
        sleep_hours = data.get('sleepHours')
        daily_steps = data.get('dailySteps')
        stress_level = data.get('stressLevel')
        # ... you will eventually pull all the fields here
        
        print(f"🔍 DEBUG: Received data from Node.js -> Sleep: {sleep_hours}, Steps: {daily_steps}")

        # ---------------------------------------------------------
        # 🧠 YOUR MACHINE LEARNING MODEL WILL GO HERE
        # (e.g., model.predict([[sleep_hours, daily_steps, ...]]))
        # ---------------------------------------------------------
        
        # 3. Generate a dummy prediction for testing
        possible_risks = ["Low Risk", "Moderate Risk", "High Risk"]
        mock_prediction = random.choice(possible_risks)
        
        # 4. Send the prediction back to Node.js!
        return jsonify({
            "status": "success",
            "prediction": mock_prediction,
            "message": "AI analysis complete"
        }), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Runs the AI server on port 5000
    print("🚀 Python AI Microservice is live on http://127.0.0.1:5000")
    app.run(port=5000, debug=True)