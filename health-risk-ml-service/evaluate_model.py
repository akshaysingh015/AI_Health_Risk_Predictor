"""Evaluate the prototype risk score against an independent labeled CSV dataset.

Required columns:
  label (0/1), Age, BMI, daily_steps, screen_time_hours,
  water_intake_liters, junk_food_frequency, sleep_hours,
  exercise_minutes, stress_level, gender, smoking_habit,
  alcohol_consumption

Optional target columns can be supplied as targets_* (for example targets_steps).
This evaluator never creates labels and exits with an error when the dataset is
missing, malformed, or contains only one outcome class.
"""

import argparse
import json
import sys

import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

from app import HIGH_RISK_THRESHOLD, model, model_input, parse_input, rule_based_risk_score


REQUIRED_COLUMNS = {
    "label", "Age", "BMI", "daily_steps", "screen_time_hours",
    "water_intake_liters", "junk_food_frequency", "sleep_hours",
    "exercise_minutes", "stress_level", "gender", "smoking_habit",
    "alcohol_consumption",
}


def build_row(row):
    data = row.to_dict()
    targets = {
        key.removeprefix("targets_"): data[key]
        for key in data
        if key.startswith("targets_") and pd.notna(data[key])
    }
    if targets:
        data["targets"] = targets
    data.pop("label", None)
    return parse_input(data)


def calibration_bins(labels, scores, bin_count=10):
    bins = []
    for lower in [index / bin_count for index in range(bin_count)]:
        upper = lower + (1 / bin_count)
        selected = [
            index for index, score in enumerate(scores)
            if lower <= score < upper or (upper == 1 and score == upper)
        ]
        if selected:
            bins.append({
                "lower": round(lower, 2),
                "upper": round(upper, 2),
                "count": len(selected),
                "mean_prediction": round(sum(scores[index] for index in selected) / len(selected), 4),
                "observed_rate": round(sum(labels[index] for index in selected) / len(selected), 4),
            })
    return bins


def evaluate(path):
    frame = pd.read_csv(path)
    missing = sorted(REQUIRED_COLUMNS - set(frame.columns))
    if missing:
        raise ValueError(f"Dataset is missing required columns: {', '.join(missing)}")
    if frame.empty:
        raise ValueError("Validation dataset is empty.")

    labels = []
    scores = []
    model_scores = []
    rows = []
    for row_number, (_, row) in enumerate(frame.iterrows(), start=2):
        label = row["label"]
        if label not in (0, 1, 0.0, 1.0):
            raise ValueError(f"Row {row_number} has a label that is not 0 or 1.")
        values = build_row(row)
        high_risk_index = next(
            (index for index, value in enumerate(model.classes_)
             if value == 1 or str(value).lower() in ("1", "high")),
            None
        )
        if high_risk_index is None:
            raise ValueError("Model does not expose a high-risk class.")
        model_probability = float(model.predict_proba(model_input(values))[0][high_risk_index])
        rule_probability = float(rule_based_risk_score(values))
        final_probability = model_probability * 0.35 + rule_probability * 0.65
        labels.append(int(label))
        scores.append(final_probability)
        model_scores.append(model_probability)
        rows.append(values)

    if len(set(labels)) < 2:
        raise ValueError("Validation dataset must contain both outcome classes.")

    predicted = [int(score >= HIGH_RISK_THRESHOLD) for score in scores]
    matrix = confusion_matrix(labels, predicted, labels=[0, 1]).tolist()
    metrics = {
        "accuracy": round(accuracy_score(labels, predicted), 4),
        "precision": round(precision_score(labels, predicted, zero_division=0), 4),
        "recall": round(recall_score(labels, predicted, zero_division=0), 4),
        "f1": round(f1_score(labels, predicted, zero_division=0), 4),
        "roc_auc": round(roc_auc_score(labels, scores), 4),
    }
    bias = {}
    for field in ("gender",):
        bias[field] = {}
        for group, group_frame in frame.groupby(field, dropna=False):
            indexes = list(group_frame.index)
            group_labels = [labels[frame.index.get_loc(index)] for index in indexes]
            group_scores = [scores[frame.index.get_loc(index)] for index in indexes]
            group_predicted = [int(score >= HIGH_RISK_THRESHOLD) for score in group_scores]
            bias[field][str(group)] = {
                "count": len(indexes),
                "accuracy": round(accuracy_score(group_labels, group_predicted), 4),
                "recall": round(recall_score(group_labels, group_predicted, zero_division=0), 4),
                "roc_auc": round(roc_auc_score(group_labels, group_scores), 4)
                if len(set(group_labels)) == 2 else None,
            }
    frame["age_group"] = pd.cut(frame["Age"], bins=[0, 29, 44, 120], labels=["under_30", "30_44", "45_plus"])
    bias["age_group"] = {}
    for group, group_frame in frame.groupby("age_group", observed=True):
        indexes = list(group_frame.index)
        group_labels = [labels[frame.index.get_loc(index)] for index in indexes]
        group_scores = [scores[frame.index.get_loc(index)] for index in indexes]
        group_predicted = [int(score >= HIGH_RISK_THRESHOLD) for score in group_scores]
        bias["age_group"][str(group)] = {
            "count": len(indexes),
            "accuracy": round(accuracy_score(group_labels, group_predicted), 4),
            "recall": round(recall_score(group_labels, group_predicted, zero_division=0), 4),
            "roc_auc": round(roc_auc_score(group_labels, group_scores), 4)
            if len(set(group_labels)) == 2 else None,
        }

    return {
        "validation_status": "research_evaluation_only_not_clinically_validated",
        "sample_count": len(labels),
        "threshold": HIGH_RISK_THRESHOLD,
        "metrics": metrics,
        "confusion_matrix": {"labels": ["low_or_moderate", "high"], "matrix": matrix},
        "calibration": calibration_bins(labels, scores),
        "bias_slices": bias,
        "model_score_metrics": {
            "roc_auc": round(roc_auc_score(labels, model_scores), 4)
        },
    }


def main():
    parser = argparse.ArgumentParser(description="Evaluate the prototype score on labeled data.")
    parser.add_argument("--input", required=True, help="Path to an independent labeled CSV dataset.")
    parser.add_argument("--output", help="Optional path for the JSON report.")
    args = parser.parse_args()
    try:
        report = evaluate(args.input)
    except (OSError, ValueError, KeyError) as error:
        print(f"Evaluation failed: {error}", file=sys.stderr)
        return 2
    serialized = json.dumps(report, indent=2)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as output_file:
            output_file.write(serialized + "\n")
    else:
        print(serialized)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
