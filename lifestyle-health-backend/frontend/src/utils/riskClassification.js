export const getRiskLabel = (score) => score >= 60 ? 'High Risk' : score >= 30 ? 'Moderate Risk' : 'Low Risk';
