import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  PhoneCall,
  AlertTriangle,
  Save,
  Edit3,
  User,
  ShieldCheck,
  Activity,
  FileCheck
} from 'lucide-react';
import { apiService } from '../services/api';

export default function NurseReviewView() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [saveSuccessId, setSaveSuccessId] = useState(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await apiService.getNurseNotes();
      setNotes(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleStartEdit = (note) => {
    setEditingId(note.patient_id);
    setEditText(note.note_text);
  };

  const handleSaveText = async (patientId) => {
    try {
      setSavingId(patientId);
      const updated = await apiService.updateNurseNote(patientId, {
        note_text: editText,
        reviewed_by: 'Staff Nurse'
      });
      setNotes(notes.map((n) => (n.patient_id === patientId ? updated : n)));
      setEditingId(null);
      triggerSuccess(patientId);
    } catch (err) {
      alert(`Failed to save note: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  const handleStatusChange = async (patientId, newStatus) => {
    try {
      setSavingId(patientId);
      const updated = await apiService.updateNurseNote(patientId, {
        review_status: newStatus,
        reviewed_by: 'Staff Nurse'
      });
      setNotes(notes.map((n) => (n.patient_id === patientId ? updated : n)));
      triggerSuccess(patientId);
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleApproval = async (patientId, currentApproval) => {
    const newApproval = currentApproval === 'APPROVED' ? 'PENDING_APPROVAL' : 'APPROVED';
    try {
      setSavingId(patientId);
      const updated = await apiService.updateNurseNote(patientId, {
        approval_status: newApproval,
        reviewed_by: 'Clinical Nurse Lead'
      });
      setNotes(notes.map((n) => (n.patient_id === patientId ? updated : n)));
      triggerSuccess(patientId);
    } catch (err) {
      alert(`Failed to toggle approval: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  const triggerSuccess = (id) => {
    setSaveSuccessId(id);
    setTimeout(() => setSaveSuccessId(null), 2500);
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Activity className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
        <p>Loading Top-10 nurse follow-up notes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'var(--risk-high-text)', background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high-border)', borderRadius: '8px' }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  const totalNotes = notes.length;
  const approvedCount = notes.filter((n) => n.approval_status === 'APPROVED').length;
  const contactedCount = notes.filter((n) => n.review_status === 'Contacted' || n.review_status === 'Completed').length;

  return (
    <div>
      {/* Overview Banner */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-full)'
            }}>
              HUMAN-IN-THE-LOOP CLINICAL TRIAGE
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Top {totalNotes} Highest-Risk Queue</span>
          </div>
          <h2 style={{ fontSize: '1.3rem', margin: 0, color: 'var(--text-main)' }}>
            Nurse Follow-Up Note Review & Approval Center
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Concise 1-line notes generated exclusively from verified clinical metrics (no hallucinated symptoms). All notes require nurse sign-off before outreach.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-light)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--risk-low-text)' }}>{approvedCount} / {totalNotes}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Approved</div>
          </div>
          <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-light)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{contactedCount} / {totalNotes}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contacted</div>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {notes.map((item) => {
          const isEditing = editingId === item.patient_id;
          const isSaving = savingId === item.patient_id;
          const isSuccess = saveSuccessId === item.patient_id;
          const isApproved = item.approval_status === 'APPROVED';

          return (
            <div key={item.patient_id} className="nurse-note-card">
              {/* Header: Rank, Patient Code, Risk, Status Badges */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem'
                  }}>
                    #{item.queue_rank}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{item.patient_code}</strong>
                      <span className="badge-risk high">
                        {(item.estimated_risk * 100).toFixed(1)}% Est. Risk
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Glucose: <strong>{item.glucose}</strong> mg/dL &bull; BMI: <strong>{item.bmi}</strong> kg/m² &bull; Age: <strong>{item.age}</strong> yrs
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Approval Toggle Badge / Button */}
                  <button
                    onClick={() => handleToggleApproval(item.patient_id, item.approval_status)}
                    className="btn btn-sm"
                    style={{
                      background: isApproved ? 'var(--status-approved-bg)' : 'var(--risk-high-bg)',
                      color: isApproved ? 'var(--status-approved-text)' : 'var(--risk-high-text)',
                      borderColor: isApproved ? 'var(--status-approved-border)' : 'var(--risk-high-border)',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}
                    title="Click to toggle nurse approval"
                  >
                    {isApproved ? (
                      <>
                        <ShieldCheck size={14} />
                        <span>APPROVED</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={14} />
                        <span>PENDING_APPROVAL</span>
                      </>
                    )}
                  </button>

                  {/* Outreach Status Selector */}
                  <select
                    value={item.review_status}
                    onChange={(e) => handleStatusChange(item.patient_id, e.target.value)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-main)'
                    }}
                  >
                    <option value="Pending">Pending Call</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Escalated">Escalated to Clinician</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Note Content / Inline Edit */}
              <div style={{ marginTop: '0.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  PATIENT-SPECIFIC CONVERSATION TOPIC (1-LINE PROMPT):
                </div>

                {isEditing ? (
                  <div>
                    <textarea
                      className="note-textarea"
                      rows={2}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        onClick={() => setEditingId(null)}
                        className="btn btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveText(item.patient_id)}
                        disabled={isSaving}
                        className="btn btn-primary btn-sm"
                      >
                        <Save size={13} />
                        <span>{isSaving ? 'Saving...' : 'Save Note'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-light)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}>
                    <span style={{ lineHeight: 1.5 }}>{item.note_text}</span>
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="btn btn-secondary btn-sm"
                      style={{ flexShrink: 0, padding: '0.25rem 0.5rem' }}
                      title="Edit note text"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Key Factor Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.35rem', borderTop: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CITED INDICATORS:</span>
                {item.top_factors && item.top_factors.map((f, i) => (
                  <span
                    key={i}
                    title={f.clinical_note}
                    style={{
                      fontSize: '0.7rem',
                      background: f.level === 'high' ? 'var(--risk-high-bg)' : 'var(--bg-card-subtle)',
                      color: f.level === 'high' ? 'var(--risk-high-text)' : 'var(--text-main)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      border: '1px solid ' + (f.level === 'high' ? 'var(--risk-high-border)' : 'var(--border-light)')
                    }}
                  >
                    {f.factor}: {f.value}
                  </span>
                ))}

                {item.reviewed_by && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Reviewed by: <strong>{item.reviewed_by}</strong> ({item.updated_at ? item.updated_at.split(' ')[0] : 'Today'})
                  </span>
                )}

                {isSuccess && (
                  <span style={{ marginLeft: 'auto', color: 'var(--risk-low-text)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle2 size={13} /> Saved!
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
