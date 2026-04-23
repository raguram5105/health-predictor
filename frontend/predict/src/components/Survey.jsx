import React, { useState, useEffect } from 'react';
import { Save, Activity, Heart, Info } from 'lucide-react';
import './Survey.css';

export default function Survey() {
    const [formData, setFormData] = useState({
        height: '',
        weight: '',
        smoking: 'no',
        alcohol: 'no',
        activityLevel: 'moderate',
        dietType: 'balanced',
        familyHistory: 'none'
    });

    const [bmi, setBmi] = useState(null);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (formData.height && formData.weight) {
            // Height in cm, Weight in kg => BMI = kg / (m * m)
            const heightInMeters = parseFloat(formData.height) / 100;
            const weightInKg = parseFloat(formData.weight);

            if (heightInMeters > 0 && weightInKg > 0) {
                const calculatedBmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
                setBmi(calculatedBmi);
            } else {
                setBmi(null);
            }
        } else {
            setBmi(null);
        }
    }, [formData.height, formData.weight]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setIsSaved(false);
    };

    const handleSave = (e) => {
        e.preventDefault();
        // Simulate API save
        localStorage.setItem('healthSurveyData', JSON.stringify({ ...formData, bmi }));
        setTimeout(() => {
            setIsSaved(true);
        }, 500);
    };

    const getBmiCategory = (value) => {
        if (!value) return { text: '-', color: 'var(--text-muted)' };
        const num = parseFloat(value);
        if (num < 18.5) return { text: 'Underweight', color: 'var(--info)' };
        if (num >= 18.5 && num <= 24.9) return { text: 'Normal', color: 'var(--success)' };
        if (num >= 25 && num <= 29.9) return { text: 'Overweight', color: 'var(--warning)' };
        return { text: 'Obese', color: 'var(--danger)' };
    };

    const bmiCategory = getBmiCategory(bmi);

    return (
        <div className="survey-container">
            <div className="grid-2">
                {/* Form Section */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div className="card-header-flex">
                        <div>
                            <h2 className="card-title">Personal Health Survey</h2>
                            <p style={{ fontSize: '0.9rem' }}>Fill out your details for more accurate predictions.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="survey-form">
                        <div className="form-row-2">
                            <div className="input-group">
                                <label>Height (cm)</label>
                                <input
                                    type="number"
                                    name="height"
                                    placeholder="175"
                                    value={formData.height}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Weight (kg)</label>
                                <input
                                    type="number"
                                    name="weight"
                                    placeholder="70"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row-2">
                            <div className="input-group">
                                <label>Smoking Habit</label>
                                <select name="smoking" value={formData.smoking} onChange={handleChange}>
                                    <option value="no">Never Smoked</option>
                                    <option value="occasional">Occasionally</option>
                                    <option value="regular">Regularly</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Alcohol Consumption</label>
                                <select name="alcohol" value={formData.alcohol} onChange={handleChange}>
                                    <option value="no">None</option>
                                    <option value="occasional">Occasionally</option>
                                    <option value="regular">Regularly</option>
                                </select>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Physical Activity Level</label>
                            <select name="activityLevel" value={formData.activityLevel} onChange={handleChange}>
                                <option value="sedentary">Sedentary (Little to no exercise)</option>
                                <option value="light">Lightly active (Light exercise 1-3 days/week)</option>
                                <option value="moderate">Moderately active (Moderate exercise 3-5 days/week)</option>
                                <option value="very">Very active (Hard exercise 6-7 days/week)</option>
                            </select>
                        </div>

                        <button type="submit" className="btn-primary mt-4" style={{ width: '100%' }}>
                            <Save size={18} />
                            {isSaved ? 'Saved Successfully!' : 'Save Health Data'}
                        </button>
                    </form>
                </div>

                {/* BMI Results Section */}
                <div className="bmi-panel">
                    <div className="glass-panel bmi-card">
                        <h3 className="card-title"><Activity size={20} color="var(--primary)" /> Real-Time BMI</h3>
                        <div className="bmi-display">
                            <div className="bmi-value-ring">
                                <span className="bmi-number" style={{ color: bmiCategory.color }}>
                                    {bmi || '--'}
                                </span>
                                <span className="bmi-unit">kg/m²</span>
                            </div>
                            <div className="bmi-category" style={{ backgroundColor: `${bmiCategory.color}20`, color: bmiCategory.color }}>
                                {bmiCategory.text}
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel tip-card">
                        <h3 className="card-title"><Heart size={20} color="var(--accent)" /> Health Impact</h3>
                        <p>
                            Your Body Mass Index (BMI) is combined with the continuous sensor data to train the prediction model.
                            Maintaining a stable weight significantly reduces cardiovascular risk and improves metabolic predictions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
