def risk_level(score):
    if score >= 0.60:
        return "High"
    if score >= 0.30:
        return "Moderate"
    return "Low"
