import React from 'react';
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
  AlertCircle
} from 'lucide-react';

export default function PatientModal({ patient, onClose, onOpenReview }) {
  if (!patient) return null;

  const riskPercent = (patient.estimated_risk * 100).toFixed(1);

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
              background: '#0284c7',
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
                Queue Priority Rank: <strong>#{patient.queue_rank}</strong> &bull; Intake Status: <strong>{patient.review_status}</strong>
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
            background: patient.risk_band === 'High Risk' ? '#fef2f2' : '#fffbeb',
            border: '1px solid ' + (patient.risk_band === 'High Risk' ? '#fecaca' : '#fde68a'),
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

            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
              Historical Outcome: <br />
              <strong style={{ color: patient.outcome === 1 ? '#b91c1c' : '#047857' }}>
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
              <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Glucose</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                  {patient.glucose === 0 ? <span style={{ color: '#d97706' }}>Unmeasured (0)</span> : `${patient.glucose} mg/dL`}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>BMI</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                  {patient.bmi === 0 ? <span style={{ color: '#d97706' }}>Unmeasured (0)</span> : `${patient.bmi} kg/m²`}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Age</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>{patient.age} yrs</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Blood Pressure</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                  {patient.blood_pressure === 0 ? <span style={{ color: '#d97706' }}>Unmeasured (0)</span> : `${patient.blood_pressure} mmHg`}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Serum Insulin</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                  {patient.insulin === 0 ? <span style={{ color: '#d97706' }}>Unmeasured (0)</span> : `${patient.insulin} µU/mL`}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Skin Thickness</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                  {patient.skin_thickness === 0 ? <span style={{ color: '#d97706' }}>Unmeasured (0)</span> : `${patient.skin_thickness} mm`}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Pedigree (DPF)</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>{patient.diabetes_pedigree_function}</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Pregnancies</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>{patient.pregnancies}</div>
              </div>
            </div>
          </div>

          {/* Top 3 Risk Factors */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              PRIMARY PREDICTIVE RISK DRIVERS:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {patient.top_factors && patient.top_factors.map((f, i) => (
                <div key={i} style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: f.level === 'high' ? '#fef2f2' : '#f8fafc',
                  border: '1px solid ' + (f.level === 'high' ? '#fecaca' : '#e2e8f0'),
                  fontSize: '0.825rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span style={{ color: f.level === 'high' ? '#991b1b' : 'var(--text-main)' }}>
                      {f.factor}: {f.value}
                    </span>
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
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.825rem',
            color: '#166534'
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
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.825rem',
                color: '#1e293b',
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
