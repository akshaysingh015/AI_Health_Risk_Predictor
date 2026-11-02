import unittest

from app import app
from risk import risk_level


class PredictionContractTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.valid_input = {
            "Age": 30,
            "BMI": 22,
            "daily_steps": 10000,
            "screen_time_hours": 4,
            "water_intake_liters": 3,
            "junk_food_frequency": 0,
            "sleep_hours": 7.5,
            "exercise_minutes": 45,
            "stress_level": 1,
            "gender": "Other",
            "smoking_habit": "Non-smoker",
            "alcohol_consumption": "None",
        }

    def test_rejects_non_numeric_or_out_of_range_input(self):
        invalid = dict(self.valid_input, daily_steps=-1)
        self.assertEqual(self.client.post("/predict", json=invalid).status_code, 400)
        invalid = dict(self.valid_input, stress_level="High")
        self.assertEqual(self.client.post("/predict", json=invalid).status_code, 400)
        invalid_targets = dict(self.valid_input, targets={"steps": -1})
        self.assertEqual(self.client.post("/predict", json=invalid_targets).status_code, 400)

    def test_saved_targets_are_used_by_prediction(self):
        on_target = dict(self.valid_input, targets={
            "sleep": 7.5, "steps": 10000, "exercise": 45, "screenTime": 4,
            "stressLevel": 1, "water": 3, "junkFood": 0
        })
        far_from_target = dict(on_target, sleep_hours=2, daily_steps=500,
                               exercise_minutes=0, screen_time_hours=12,
                               stress_level=10, water_intake_liters=0,
                               junk_food_frequency=10)
        on_target_result = self.client.post("/predict", json=on_target).get_json()
        far_result = self.client.post("/predict", json=far_from_target).get_json()
        self.assertGreater(far_result["rule_based_score"], on_target_result["rule_based_score"])

    def test_score_is_bounded_and_risk_matches_score(self):
        response = self.client.post("/predict", json=self.valid_input)
        self.assertEqual(response.status_code, 200)
        result = response.get_json()
        self.assertGreaterEqual(result["risk_score"], 0)
        self.assertLessEqual(result["risk_score"], 1)
        expected = (
            "High" if result["risk_score"] >= 0.60
            else "Moderate" if result["risk_score"] >= 0.30
            else "Low"
        )
        self.assertEqual(result["risk"], expected)

    def test_health_reports_runtime_model_version(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        result = response.get_json()
        self.assertTrue(result["model_loaded"])
        self.assertEqual(result["sklearn_version"], "1.6.1")
        self.assertEqual(result["validation_status"], "prototype_not_clinically_validated")
        self.assertEqual(result["confidence_status"], "uncalibrated_research_estimate")

    def test_prediction_includes_feature_contributions(self):
        response = self.client.post("/predict", json=self.valid_input)
        result = response.get_json()
        self.assertIsInstance(result["feature_contributions"], dict)
        self.assertIn("sleep", result["feature_contributions"])

    def test_risk_threshold_boundaries(self):
        self.assertEqual(risk_level(0.299), "Low")
        self.assertEqual(risk_level(0.30), "Moderate")
        self.assertEqual(risk_level(0.599), "Moderate")
        self.assertEqual(risk_level(0.60), "High")

    def test_rejects_missing_extreme_and_nan_values(self):
        for field in self.valid_input:
            missing = dict(self.valid_input)
            del missing[field]
            self.assertEqual(self.client.post("/predict", json=missing).status_code, 400)
        for value in [-1, 1000001, float("nan")]:
            invalid = dict(self.valid_input, daily_steps=value)
            self.assertEqual(self.client.post("/predict", json=invalid).status_code, 400)

    def test_missing_model_returns_server_error(self):
        import app as app_module
        original_model = app_module.model
        app_module.model = None
        try:
            self.assertEqual(self.client.post("/predict", json=self.valid_input).status_code, 500)
        finally:
            app_module.model = original_model

    def test_missing_model_file_is_rejected(self):
        import app as app_module
        original_path = app_module.MODEL_PATH
        app_module.MODEL_PATH = "missing-health-risk-model.pkl"
        try:
            with self.assertRaises(RuntimeError):
                app_module.load_model_metadata()
        finally:
            app_module.MODEL_PATH = original_path


if __name__ == "__main__":
    unittest.main()
