import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, FileText, Download } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import './Prediction.css';

const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const buildReportHtml = (report) => {
    const sensorSummary = report.sensorSummary;
    const sensorRows = sensorSummary ? `
        <div class="sensor-grid">
            <div><strong>Heart Rate</strong><span>${escapeHtml(sensorSummary.heart_rate ?? 'Not available')} bpm</span></div>
            <div><strong>ECG</strong><span>${escapeHtml(sensorSummary.ecg ?? 'Not available')}</span></div>
            <div><strong>SpO2</strong><span>${escapeHtml(sensorSummary.spo2 ?? 'Not available')}%</span></div>
            <div><strong>Temperature</strong><span>${escapeHtml(sensorSummary.temperature ?? 'Not available')} C</span></div>
        </div>
    ` : '<p>No fresh sensor values were available when this report was generated.</p>';

    const concerns = report.primaryConcerns.map((concern) => `
        <div class="item">
            <div class="item-header">
                <strong>${escapeHtml(concern.disease)}</strong>
                <span>${escapeHtml(concern.probability)} Risk</span>
            </div>
            <p>${escapeHtml(concern.desc)}</p>
        </div>
    `).join('');

    const recommendations = report.recommendations.map((recommendation) => `
        <li>${escapeHtml(recommendation)}</li>
    `).join('');

    return `
        <!doctype html>
        <html>
            <head>
                <title>VitalSense AI Health Report</title>
                <style>
                    * { box-sizing: border-box; }
                    body {
                        margin: 0;
                        padding: 32px;
                        color: #111827;
                        font-family: Arial, sans-serif;
                        background: #ffffff;
                    }
                    .report {
                        max-width: 760px;
                        margin: 0 auto;
                    }
                    .header {
                        border-bottom: 2px solid #2563eb;
                        padding-bottom: 18px;
                        margin-bottom: 24px;
                    }
                    h1 {
                        margin: 0 0 8px;
                        font-size: 28px;
                    }
                    h2 {
                        margin: 28px 0 12px;
                        font-size: 18px;
                        color: #1f2937;
                    }
                    p {
                        line-height: 1.5;
                    }
                    .muted {
                        color: #6b7280;
                        margin: 0;
                    }
                    .risk {
                        border: 1px solid #d1d5db;
                        border-radius: 8px;
                        padding: 18px;
                        margin-bottom: 20px;
                    }
                    .risk-score {
                        font-size: 42px;
                        font-weight: 700;
                        color: #d97706;
                        margin-bottom: 6px;
                    }
                    .risk-label {
                        font-size: 18px;
                        font-weight: 700;
                    }
                    .item {
                        border-left: 4px solid #d97706;
                        background: #f9fafb;
                        border-radius: 8px;
                        padding: 14px;
                        margin-bottom: 12px;
                    }
                    .item-header {
                        display: flex;
                        justify-content: space-between;
                        gap: 16px;
                        margin-bottom: 8px;
                    }
                    .sensor-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    .sensor-grid div {
                        border: 1px solid #d1d5db;
                        border-radius: 8px;
                        padding: 12px;
                    }
                    .sensor-grid strong,
                    .sensor-grid span {
                        display: block;
                    }
                    .sensor-grid span {
                        margin-top: 6px;
                        font-size: 18px;
                    }
                    ul {
                        padding-left: 20px;
                    }
                    li {
                        margin-bottom: 10px;
                        line-height: 1.5;
                    }
                    @media print {
                        body { padding: 20px; }
                        .report { max-width: none; }
                    }
                </style>
            </head>
            <body>
                <main class="report">
                    <section class="header">
                        <h1>VitalSense AI Health Report</h1>
                        <p class="muted">Generated ${escapeHtml(new Date().toLocaleString())}</p>
                    </section>

                    <section class="risk">
                        <div class="risk-score">${escapeHtml(report.riskScore)}%</div>
                        <div class="risk-label">Overall Risk Level: ${escapeHtml(report.overallRisk)}</div>
                        <p>Your composite health score based on real-time sensors, BMI, and lifestyle factors.</p>
                    </section>

                    <h2>Sensor Values Used</h2>
                    ${sensorRows}

                    <h2>Specific Disease Predictions</h2>
                    ${concerns}

                    <h2>AI Actionable Insights</h2>
                    <ul>${recommendations}</ul>
                </main>
            </body>
        </html>
    `;
};

export default function Prediction() {
    const [analyzing, setAnalyzing] = useState(true);
    const [predictionResult, setPredictionResult] = useState(null);
    const [error, setError] = useState(null);

    const handleExportPdf = () => {
        if (!predictionResult) return;

        const printWindow = window.open('', '_blank', 'width=900,height=700');

        if (!printWindow) {
            setError('Unable to open the PDF window. Please allow pop-ups for this site and try again.');
            return;
        }

        printWindow.document.open();
        printWindow.document.write(buildReportHtml(predictionResult));
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    useEffect(() => {
        const fetchPrediction = async () => {
            try {
                // Get survey data from localStorage
                const savedData = localStorage.getItem('healthSurveyData');
                const surveyData = savedData ? JSON.parse(savedData) : {};

                const response = await fetch(`${API_BASE_URL}/api/predict`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(surveyData),
                });
                
                if (!response.ok) {
                    throw new Error(`Prediction request failed with status ${response.status}`);
                }
                
                const data = await response.json();
                setPredictionResult(data);
            } catch (err) {
                console.error("Error fetching prediction:", err);
                setError("Unable to load predictions. Make sure the backend server is reachable.");
            } finally {
                setAnalyzing(false);
            }
        };

        fetchPrediction();
    }, []);

    if (analyzing) {
        return (
            <div className="prediction-loading">
                <div className="scanner"></div>
                <h2>Analyzing Physiological Data...</h2>
                <p>Running multi-variable machine learning models on your sensor and survey data.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
                <AlertTriangle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Prediction Error</h2>
                <p>{error}</p>
            </div>
        );
    }

    if (!predictionResult) return null;

    return (
        <div className="prediction-container animate-fade-in">
            {/* Header Summary */}
            <div className="glass-panel report-header">
                <div className="report-title-row">
                    <div>
                        <h2 className="card-title"><FileText size={24} color="var(--primary)" /> Comprehensive Health Report</h2>
                        <p>Generated by VitalSense AI</p>
                    </div>
                    <button className="btn-ghost" type="button" onClick={handleExportPdf}>
                        <Download size={18} /> Export PDF
                    </button>
                </div>

                <div className="risk-score-container">
                    <div className="risk-dial">
                        <svg viewBox="0 0 36 36" className="circular-chart orange">
                            <path className="circle-bg"
                                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path className="circle"
                                strokeDasharray={`${predictionResult.riskScore}, 100`}
                                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <text x="18" y="20.35" className="percentage">{predictionResult.riskScore}%</text>
                        </svg>
                    </div>
                    <div className="risk-details">
                        <h3>Overall Risk Level: <span style={{ color: 'var(--warning)' }}>{predictionResult.overallRisk}</span></h3>
                        <p>Your composite health score based on real-time sensors, BMI, and lifestyle factors.</p>
                    </div>
                </div>

                <div className="sensor-summary-grid">
                    <div>
                        <span>Heart Rate</span>
                        <strong>{predictionResult.sensorSummary?.heart_rate ?? 'Not available'} bpm</strong>
                    </div>
                    <div>
                        <span>ECG</span>
                        <strong>{predictionResult.sensorSummary?.ecg ?? 'Not available'}</strong>
                    </div>
                    <div>
                        <span>SpO2</span>
                        <strong>{predictionResult.sensorSummary?.spo2 ?? 'Not available'}%</strong>
                    </div>
                    <div>
                        <span>Temperature</span>
                        <strong>{predictionResult.sensorSummary?.temperature ?? 'Not available'} C</strong>
                    </div>
                </div>
            </div>

            <div className="grid-2 mt-4">
                {/* Disease Predictions */}
                <div className="glass-panel p-4">
                    <h3 className="section-title">Specific Disease Predictions</h3>
                    <div className="prediction-list">
                        {predictionResult.primaryConcerns.map((concern, idx) => (
                            <div key={idx} className={`prediction-item ${concern.status}`}>
                                <div className="pred-header">
                                    <div className="pred-title">
                                        {concern.status === 'warning' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                                        <strong>{concern.disease}</strong>
                                    </div>
                                    <span className="pred-prob">{concern.probability} Risk</span>
                                </div>
                                <p className="pred-desc">{concern.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Recommendations */}
                <div className="glass-panel p-4">
                    <h3 className="section-title">AI Actionable Insights</h3>
                    <ul className="recommendations-list">
                        {predictionResult.recommendations.map((rec, idx) => (
                            <li key={idx}>
                                <ShieldAlert size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span>{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
