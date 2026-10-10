import React, { useState } from 'react';
import {
  UserPlus,
  Activity,
  CheckCircle,
  AlertTriangle,
  Info,
  Send,
  RotateCcw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { apiService } from '../services/api';

const PRESETS = {
  highRisk: {
    pregnancies: 3,
    glucose: 178,
    blood_pressure: 88,
    skin_thickness: 34,
    insulin: 180,
    bmi: 38.5,
    diabetes_pedigree_function: 0.85,
    age: 52
  },
  moderateRisk: {
    pregnancies: 1,
    glucose: 128,
    blood_pressure: 76,
    skin_thickness: 24,
    insulin: 85,
    bmi: 31.2,
    diabetes_pedigree_function: 0.42,
    age: 38
  },
  lowRisk: {
    pregnancies: 0,
    glucose: 92,
    blood_pressure: 68,
    skin_thickness: 18,
    insulin: 65,
    bmi: 22.4,
    diabetes_pedigree_function: 0.28,
    age: 26
  },
  missingVitals: {
    pregnancies: 2,
    glucose: 155,
    blood_pressure: 0, // Unmeasured
    skin_thickness: 0, // Unmeasured
    insulin: 0,        // Unmeasured
    bmi: 34.0,
    diabetes_pedigree_function: 0.62,
    age: 44
  }
};

export default function ScreeningView() {
  const [formData, setFormData] = useState({
    pregnancies: 1,
    glucose: 135,
    blood_pressure: 75,
    skin_thickness: 25,
    insulin: 110,
    bmi: 32.5,
    diabetes_pedigree_function: 0.45,
    age: 42
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleApplyPreset = (presetKey) => {
    setFormData(PRESETS[presetKey]);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiService.screenPatient(formData);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      pregnancies: 0,
      glucose: 115,
      blood_pressure: 72,
      skin_thickness: 20,
      insulin: 80,
      bmi: 28.0,
      diabetes_pedigree_function: 0.35,
      age: 35
    });
    setResult(null);
    setError(null);
  };

  return (
    <div>
      {/* Intro Header */}
      <div style={{
        background: 'white',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span style={{
            background: '#e0f2fe',
            color: '#0369a1',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.2rem 0.5rem',
            borderRadius: 'var(--radius-full)'
          }}>
            INDIVIDUAL SCREENING FORM
          </span>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Decision-Support Assessment</span>
        </div>
        <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)', margin: 0 }}>
          Community Health Patient Intake & Risk Estimator
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          Enter patient clinical vitals. Note: Enter 0 for unmeasured clinical vitals (Glucose, BP, Skin Thickness, Insulin, BMI) to trigger physiological missingness imputation.
        </p>

        {/* Preset Buttons for Demo / Judging */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Quick Presets:</span>
          <button
            type="button"
            onClick={() => handleApplyPreset('highRisk')}
            className="btn btn-secondary btn-sm"
          >
            High Risk (Elevated Glucose & BMI)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('moderateRisk')}
            className="btn btn-secondary btn-sm"
          >
            Moderate Risk
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('lowRisk')}
            className="btn btn-secondary btn-sm"
          >
            Low Risk (Healthy Baseline)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('missingVitals')}
            className="btn btn-secondary btn-sm"
          >
            Missing Insulin/BP (Imputation Test)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Screening Form Card */}
        <div style={{
          background: 'white',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1.25rem', color: 'var(--text-main)' }}>
            Clinical Parameters (8 Metrics)
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Pregnancies */}
              <div className="form-group">
                <label className="form-label">
                  <span>Pregnancies</span>
                  <span className="unit">Valid count (0-25)</span>
                </label>
                <input
                  type="number"
                  name="pregnancies"
                  min="0"
                  max="25"
                  value={formData.pregnancies}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
                <span className="form-helper">0 is clinically valid (nulliparous)</span>
              </div>

              {/* Glucose */}
              <div className="form-group">
                <label className="form-label">
                  <span>Fasting Glucose</span>
                  <span className="unit">mg/dL</span>
                </label>
                <input
                  type="number"
                  name="glucose"
                  min="0"
                  max="350"
                  step="0.1"
                  value={formData.glucose}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
                <span className="form-helper">Median: 117 mg/dL (0 = unmeasured)</span>
              </div>

              {/* Blood Pressure */}
              <div className="form-group">
                <label className="form-label">
                  <span>Diastolic Blood Pressure</span>
                  <span className="unit">mmHg</span>
                </label>
                <input
                  type="number"
                  name="blood_pressure"
                  min="0"
                  max="250"
                  step="0.1"
                  value={formData.blood_pressure}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
                <span className="form-helper">Median: 72 mmHg (0 = unmeasured)</span>
              </div>

              {/* Skin Thickness */}
              <div className="form-group">
                <label className="form-label">
                  <span>Triceps Skin Fold</span>
                  <span className="unit">mm</span>
                </label>
                <input
                  type="number"
                  name="skin_thickness"
                  min="0"
                  max="120"
                  step="0.1"
                  value={formData.skin_thickness}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
                <span className="form-helper">Median: 23 mm (0 = unmeasured)</span>
              </div>

              {/* Insulin */}
              <div className="form-group">
                <label className="form-label">
                  <span>2-Hour Serum Insulin</span>
                  <span className="unit">µU/mL</span>
                </label>
                <input
                  type="number"
                  name="insulin"
                  min="0"
                  max="1000"
                  step="0.1"
                  value={formData.insulin}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
                <span className="form-helper">Median: 125 µU/mL (0 = unmeasured)</span>
              </div>

              {/* BMI */}
              <div className="form-group">
                <label className="form-label">
                  <span>Body Mass Index (BMI)</span>
                  <span className="unit">kg/m²</span>
                </label>
                <input
                  type="number"
                  name="bmi"
                  min="0"
                  max="80"
                  step="0.1"
                  value={formData.bmi}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
                <span className="form-helper">Median: 32.0 kg/m² (&ge;30 = obese)</span>
              </div>

              {/* Diabetes Pedigree Function */}
              <div className="form-group">
                <label className="form-label">
                  <span>Diabetes Pedigree (DPF)</span>
                  <span className="unit">Genetic score</span>
                </label>
                <input
                  type="number"
                  name="diabetes_pedigree_function"
                  min="0.01"
                  max="3.0"
                  step="0.01"
                  value={formData.diabetes_pedigree_function}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
                <span className="form-helper">Median: 0.37 (family history score)</span>
              </div>

              {/* Age */}
              <div className="form-group">
                <label className="form-label">
                  <span>Age</span>
                  <span className="unit">years</span>
                </label>
                <input
                  type="number"
                  name="age"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
                <span className="form-helper">Cohort range: 21-81 years</span>
              </div>
            </div>

            {error && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? <Activity className="animate-spin" size={14} /> : <Send size={14} />}
                <span>{loading ? 'Evaluating Model...' : 'Calculate Estimated Risk'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Result Card (Appears after submission) */}
        {result && (
          <div style={{
            background: 'white',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>SCREENING ID: {result.patient_id}</span>
                <h3 style={{ fontSize: '1.2rem', margin: '0.2rem 0 0', color: 'var(--text-main)' }}>
                  Screening Assessment Output
                </h3>
              </div>
              <span className={`badge-risk ${result.risk_band === 'High Risk' ? 'high' : result.risk_band === 'Moderate Risk' ? 'moderate' : 'low'}`}>
                {result.risk_band}
              </span>
            </div>

            {/* Probability Gauge */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                Estimated Risk Probability
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.5rem',
                fontWeight: 800,
                color: result.risk_band === 'High Risk' ? '#b91c1c' : result.risk_band === 'Moderate Risk' ? '#b45309' : '#047857',
                lineHeight: 1.1,
                margin: '0.25rem 0'
              }}>
                {result.risk_percentage}%
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                Statistical decision-support estimate based on calibrated logistic regression
              </div>
            </div>

            {/* Top 3 Risk Factors */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                TOP 3 CONTRIBUTING RISK FACTORS:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {result.top_risk_factors.map((f, i) => (
                  <div key={i} style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: f.level === 'high' ? '#fef2f2' : '#f8fafc',
                    border: '1px solid ' + (f.level === 'high' ? '#fecaca' : '#e2e8f0'),
                    fontSize: '0.825rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span style={{ color: f.level === 'high' ? '#991b1b' : 'var(--text-main)' }}>{f.factor}: {f.value}</span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{f.benchmark}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem', lineHeight: 1.4 }}>
                      {f.clinical_note}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Action */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.825rem',
              color: '#166534'
            }}>
              <strong>Recommended Clinic Action: </strong>
              {result.recommended_action}
            </div>

            {/* Suggested Nurse Outreach Note */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  SUGGESTED 1-LINE NURSE OUTREACH NOTE:
                </span>
                <span className="badge-status pending-approval">
                  {result.approval_status}
                </span>
              </div>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.825rem',
                color: '#1e293b',
                fontStyle: 'italic',
                lineHeight: 1.5
              }}>
                "{result.suggested_nurse_note}"
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
              <strong>Clinical Guardrail: </strong> {result.clinical_disclaimer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
