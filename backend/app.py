from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import random

app = Flask(__name__)
CORS(app)

def calculate_bmi(height_cm, weight_kg):
    try:
        h = float(height_cm) / 100
        w = float(weight_kg)
        if h > 0:
            return w / (h * h)
        return 0
    except (ValueError, TypeError):
        return 0

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json or {}
    
    # Simulate processing time for "ML model prediction"
    time.sleep(1.5)

    # Extract features
    height = data.get('height', 170)
    weight = data.get('weight', 70)
    smoking = data.get('smoking', 'no')
    alcohol = data.get('alcohol', 'no')
    activity_level = data.get('activityLevel', 'moderate')

    bmi = calculate_bmi(height, weight)
    
    # Base risk score calculation
    risk_score = 10  # Baseline risk
    
    # BMI Risk
    if bmi > 30:
        risk_score += 25
    elif bmi > 25:
        risk_score += 15
    elif bmi < 18.5:
        risk_score += 10
        
    # Lifestyle Risk
    if smoking == 'regular':
        risk_score += 30
    elif smoking == 'occasional':
        risk_score += 15

    if alcohol == 'regular':
        risk_score += 15
    elif alcohol == 'occasional':
        risk_score += 5

    if activity_level == 'sedentary':
        risk_score += 20
    elif activity_level == 'light':
        risk_score += 10
    elif activity_level == 'very':
        risk_score -= 10 # Protective factor

    # Clamp risk score between 0 and 100
    risk_score = max(5, min(95, risk_score + random.randint(-3, 3))) # Add slight jitter for realism

    # Determine Overall Risk Level
    if risk_score < 25:
        overall_risk = 'Low Risk'
    elif risk_score < 50:
        overall_risk = 'Moderate Risk'
    elif risk_score < 75:
        overall_risk = 'High Risk'
    else:
        overall_risk = 'Severe Risk'

    from typing import List, Dict, Any
    # Generate Primary Concerns dynamically based on inputs
    primary_concerns: List[Dict[str, Any]] = []
    recommendations: List[str] = []

    if bmi >= 25:
        primary_concerns.append({
            'disease': 'Type 2 Diabetes',
            'probability': f'{int(bmi * 1.5)}%',
            'status': 'warning' if bmi > 30 else 'safe',
            'desc': 'Elevated BMI strongly correlates with insulin resistance.'
        })
        recommendations.append('Focus on a balanced diet to reduce BMI to a healthy range.')

    if smoking != 'no':
        primary_concerns.append({
            'disease': 'Cardiovascular Disease',
            'probability': '45%' if smoking == 'regular' else '25%',
            'status': 'warning',
            'desc': 'Smoking drastically restricts blood flow and damages blood vessels.'
        })
        recommendations.append('Consider a smoking cessation program to lower cardiovascular risk immediately.')

    if alcohol == 'regular':
        primary_concerns.append({
            'disease': 'Liver Complications',
            'probability': '35%',
            'status': 'warning',
            'desc': 'Regular alcohol consumption puts continuous strain on hepatic functions.'
        })
        recommendations.append('Reduce alcohol intake to recommended limits (1-2 drinks per day max).')

    if activity_level == 'sedentary':
        primary_concerns.append({
            'disease': 'Metabolic Syndrome',
            'probability': '40%',
            'status': 'warning',
            'desc': 'Lack of physical activity reduces the body\'s ability to metabolize glucose.'
        })
        recommendations.append('Aim for at least 30 minutes of moderate activity, 5 days a week.')

    # If no major flags, add some base healthy notes
    if not primary_concerns:
        primary_concerns.append({
            'disease': 'General Health',
            'probability': 'Optimal',
            'status': 'safe',
            'desc': 'Your inputs fall within healthy physiological bounds.'
        })
        recommendations.append('Maintain your current lifestyle, including diet and exercise habits.')

    # Ensure we always return at least a few recommendations
    if len(recommendations) < 2:
        recommendations.append('Schedule an annual check-up to monitor baseline vitals.')
        recommendations.append('Ensure adequate sleep (7-9 hours/night) for proper recovery.')

    # Return top 3 using a loop to avoid strict linter slice errors
    top_concerns = []
    for i, c in enumerate(primary_concerns):
        if i < 3:
            top_concerns.append(c)
            
    top_recs = []
    for i, r in enumerate(recommendations):
        if i < 3:
            top_recs.append(r)

    result = {
        'overallRisk': overall_risk,
        'riskScore': int(risk_score),
        'primaryConcerns': top_concerns,
        'recommendations': top_recs
    }
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
