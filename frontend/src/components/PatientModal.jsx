import React, { useState } from 'react';
import {
  X,
  User,
  Activity,
  Heart,
  Droplet,
  Scale,
  Calendar,
  Layers,
  PhoneCall,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Bot,
  Key
} from 'lucide-react';
import { apiService } from '../services/api';

export default function PatientModal({ patient, onClose, onOpenReview }) {
  if (!patient) return null;

  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const riskPercent = (patient.estimated_risk * 100).toFixed(1);

  const handleGenerateAiReasoning = async () => {
    try {
      setAiLoading(true);
      const res = await apiService.getPatientAiReasoning(patient.id, apiKey);
      setAiData(res);
    } catch (err) {
      alert(`AI Reasoning error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem'
            }}>
              #{patient.queue_rank || patient.id}
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-main)' }}>
                {patient.patient_code} - Clinical Screening Profile
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Queue Priority Rank: <strong>#{patient.queue_rank}</strong> &bull; Intake Status: <strong>{patient.review_status || 'Pending'}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Risk Level Banner */}
          <div style={{
            background: patient.risk_band === 'High Risk' ? 'var(--risk-high-bg)' : 'var(--risk-mod-bg)',
            border: '1px solid ' + (patient.risk_band === 'High Risk' ? 'var(--risk-high-border)' : 'var(--risk-mod-border)'),
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span className={`badge-risk ${patient.risk_band === 'High Risk' ? 'high' : 'moderate'}`}>
                {patient.risk_band}
              </span>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Estimated Risk Probability: <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{riskPercent}%</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Historical Outcome: <br />
              <strong style={{ color: patient.outcome === 1 ? 'var(--risk-high-text)' : 'var(--risk-low-text)' }}>
                {patient.outcome === 1 ? 'Positive (1)' : 'Negative (0)'}
              </strong>
            </div>
          </div>

          {/* Clinical Vitals Grid */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              RECORDED CLINICAL VITALS:
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '0.75rem'
            }}>
              <div style={{ background: 'var(--bg-card-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Glucose</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {patient.glucose === 0 ? <span style={{ color: 'var(--risk-mod-text)' }}>Unmeasured (0)</span> : `${patient.glucose} mg/dL`}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BMI</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {patient.bmi === 0 ? <span style={{ color: 'var(--risk-mod-text)' }}>Unmeasured (0)</span> : `${patient.bmi} kg/m²`}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Age</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{patient.age} yrs</div>
              </div>

              <div style={{ background: 'var(--bg-card-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Blood Pressure</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {patient.blood_pressure === 0 ? <span style={{ color: 'var(--risk-mod-text)' }}>Unmeasured (0)</span> : `${patient.blood_pressure} mmHg`}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Serum Insulin</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {patient.insulin === 0 ? <span style={{ color: 'var(--risk-mod-text)' }}>Unmeasured (0)</span> : `${patient.insulin} µU/mL`}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Skin Thickness</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {patient.skin_thickness === 0 ? <span style={{ color: 'var(--risk-mod-text)' }}>Unmeasured (0)</span> : `${patient.skin_thickness} mm`}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pedigree (DPF)</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{patient.diabetes_pedigree_function}</div>
              </div>

              <div style={{ background: 'var(--bg-card-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pregnancies</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{patient.pregnancies}</div>
              </div>
            </div>
          </div>

          {/* Top 3 Risk Factors */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              PRIMARY PREDICTIVE RISK DRIVERS (ML LOG-ODDS ATTRIBUTION):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {patient.top_factors && patient.top_factors.map((f, i) => (
                <div key={i} style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: f.level === 'high' ? 'var(--risk-high-bg)' : 'var(--bg-card-subtle)',
                  border: '1px solid ' + (f.level === 'high' ? 'var(--risk-high-border)' : 'var(--border-light)'),
                  fontSize: '0.825rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span style={{ color: f.level === 'high' ? 'var(--risk-high-text)' : 'var(--text-main)' }}>
                      {f.factor}: {f.value}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{f.benchmark}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    {f.clinical_note}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Prioritization Reasoning Section (Gemini) */}
          <div style={{
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-focus)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color="var(--color-primary)" />
                <strong style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                  AI Prioritization Reasoning & Clinical Synthesis
                </strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                  title="Configure Gemini API Key"
                >
                  <Key size={12} />
                  <span>{showKeyInput ? 'Hide Key' : 'API Key'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateAiReasoning}
                  disabled={aiLoading}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  {aiLoading ? <Activity className="animate-spin" size={13} /> : <Bot size={13} />}
                  <span>{aiLoading ? 'Synthesizing...' : 'Generate with Gemini AI'}</span>
                </button>
              </div>
            </div>

            {showKeyInput && (
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <input
                  type="password"
                  placeholder="Enter Gemini API Key (or leave blank to use server environment key)..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.75rem', background: 'transparent', color: 'var(--text-main)' }}
                />
              </div>
            )}

            {aiData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle size={12} />
                  <span>Synthesized by: {aiData.model} ({aiData.source})</span>
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.5, background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                  <strong>Prioritization Rationale: </strong> {aiData.reasoning}
                </p>
                {aiData.nurse_call_script && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '0.6rem 0.75rem', borderRadius: '6px' }}>
                    <strong>Tailored Nurse Script: </strong> "{aiData.nurse_call_script}"
                  </p>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Click <strong>"Generate with Gemini AI"</strong> to synthesize why this patient was prioritized at Rank #{patient.queue_rank} and auto-draft an outreach conversation prompt.
              </p>
            )}
          </div>

          {/* Recommended Action */}
          <div style={{
            background: 'var(--banner-info-bg)',
            border: '1px solid var(--banner-info-border)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.825rem',
            color: 'var(--banner-info-text)'
          }}>
            <strong>Recommended Clinic Action: </strong>
            {patient.recommended_action}
          </div>

          {/* Nurse Follow-Up Note (if present) */}
          {patient.nurse_note && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  NURSE FOLLOW-UP PROMPT (TOP 10 QUEUE):
                </span>
                <span className="badge-status pending-approval">
                  {patient.approval_status}
                </span>
              </div>
              <div style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-light)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.825rem',
                color: 'var(--text-main)',
                fontStyle: 'italic',
                lineHeight: 1.5
              }}>
                "{patient.nurse_note}"
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          {patient.queue_rank <= 10 && onOpenReview && (
            <button
              onClick={() => {
                onClose();
                onOpenReview();
              }}
              className="btn btn-primary btn-sm"
            >
              Open in Nurse Review Center
            </button>
          )}
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
