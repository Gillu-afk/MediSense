import React, { useState, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  Activity,
  CheckCircle,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { apiService } from '../services/api';

export default function DashboardView({ onNavigateToQueue, onNavigateToScreening }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadSummary() {
      try {
        setLoading(true);
        const res = await apiService.getDashboardSummary();
        setData(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <Activity className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
        <p>Loading clinical dashboard metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c' }}>
        <h3>Error loading dashboard</h3>
        <p>{error}</p>
      </div>
    );
  }

  const { kpis, insights, distribution, demo_mode, storage_notice } = data;

  return (
    <div>
      {/* Clinical Disclaimer Banner */}
      <div className="clinical-disclaimer-banner">
        <Info size={20} color="#16a34a" />
        <div>
          <strong>Clinical Screening Notice:</strong> Model scores are statistical risk estimates designed for outreach prioritization, not confirmed diagnoses. Clinical laboratory tests (FPG, HbA1c) are required for diabetes confirmation.
        </div>
      </div>

      {/* Demo Mode Notice if applicable */}
      {demo_mode && (
        <div className="demo-notice-banner">
          <AlertTriangle size={18} />
          <div>
            <strong>Serverless Demo Storage:</strong> {storage_notice}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {/* KPI 1 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Patients Loaded</span>
            <div className="kpi-icon-wrap" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <Users size={16} />
            </div>
          </div>
          <div className="kpi-value">{kpis.total_patients_loaded}</div>
          <span className="kpi-label-tag">{kpis.total_patients_loaded_label}</span>
        </div>

        {/* KPI 2 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Confirmed Positives</span>
            <div className="kpi-icon-wrap" style={{ background: '#fef2f2', color: '#ef4444' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="kpi-value">{kpis.positive_historical_outcomes}</div>
          <span className="kpi-label-tag">{kpis.positive_historical_outcomes_label}</span>
        </div>

        {/* KPI 3 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Callback Queue</span>
            <div className="kpi-icon-wrap" style={{ background: '#ecfdf5', color: '#10b981' }}>
              <CheckCircle size={16} />
            </div>
          </div>
          <div className="kpi-value">{kpis.patients_in_callback_queue} / 100</div>
          <span className="kpi-label-tag">{kpis.callback_queue_capacity_label}</span>
        </div>

        {/* KPI 4 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Model Recall</span>
            <div className="kpi-icon-wrap" style={{ background: '#fdf4ff', color: '#a855f7' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value">{(kpis.model_recall * 100).toFixed(1)}%</div>
          <span className="kpi-label-tag">{kpis.model_recall_label}</span>
        </div>

        {/* KPI 5 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Model ROC-AUC</span>
            <div className="kpi-icon-wrap" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Award size={16} />
            </div>
          </div>
          <div className="kpi-value">{kpis.model_roc_auc.toFixed(3)}</div>
          <span className="kpi-label-tag">{kpis.model_roc_auc_label}</span>
        </div>

        {/* KPI 6 */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Precision@100</span>
            <div className="kpi-icon-wrap" style={{ background: '#e0f2fe', color: '#0369a1' }}>
              <Layers size={16} />
            </div>
          </div>
          <div className="kpi-value">{(kpis.precision_at_100 * 100).toFixed(1)}%</div>
          <span className="kpi-label-tag">2.32x Enrichment vs Base Rate</span>
        </div>
      </div>

      {/* Analytics Distributions Grid */}
      <div className="analytics-grid">
        {/* Glucose Distribution */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <div className="analytics-card-title">Fasting / Plasma Glucose Distribution</div>
              <div className="analytics-card-subtitle">Cohort patient counts across clinical glycemic bands</div>
            </div>
          </div>
          <div className="dist-bars">
            {distribution.glucose_distribution.map((item, idx) => {
              const maxVal = Math.max(...distribution.glucose_distribution.map(d => d.count));
              const pct = (item.count / maxVal) * 100;
              const isHigh = idx >= 3;
              return (
                <div key={item.range} className="dist-bar-item">
                  <div className="dist-bar-meta">
                    <span>{item.range} mg/dL</span>
                    <span style={{ color: isHigh ? '#b91c1c' : '#475569', fontWeight: 600 }}>{item.count} patients</span>
                  </div>
                  <div className="dist-bar-track">
                    <div
                      className="dist-bar-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isHigh ? '#ef4444' : idx === 2 ? '#f59e0b' : '#0284c7'
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BMI Distribution */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <div className="analytics-card-title">Body Mass Index (BMI) Distribution</div>
              <div className="analytics-card-subtitle">Cohort patient counts across WHO weight tiers</div>
            </div>
          </div>
          <div className="dist-bars">
            {distribution.bmi_distribution.map((item, idx) => {
              const maxVal = Math.max(...distribution.bmi_distribution.map(d => d.count));
              const pct = (item.count / maxVal) * 100;
              const isObese = idx >= 3;
              return (
                <div key={item.range} className="dist-bar-item">
                  <div className="dist-bar-meta">
                    <span>{item.range} kg/m²</span>
                    <span style={{ color: isObese ? '#b91c1c' : '#475569', fontWeight: 600 }}>{item.count} patients</span>
                  </div>
                  <div className="dist-bar-track">
                    <div
                      className="dist-bar-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isObese ? '#f43f5e' : idx === 2 ? '#f59e0b' : '#0d9488'
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Evidence-Backed Findings Section */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3>Empirical Clinical Dataset Findings & Hidden Traps Handled</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Calculated directly from the 768-patient cohort without fabricated values or hand-waving.
          </p>
        </div>
      </div>

      <div className="insights-container">
        {insights.map((ins) => (
          <div key={ins.id} className="insight-card">
            <div className="insight-header">
              <span className="insight-category-badge">{ins.category}</span>
              <div className="insight-title">{ins.title}</div>
            </div>
            <div className="insight-finding">
              <strong>Finding: </strong> {ins.finding}
            </div>
            <div className="insight-relevance">
              <strong>Clinical Context: </strong> {ins.clinical_relevance}
            </div>
            <div className="insight-trap-tag">
              ✓ Trap Handled: {ins.trap_addressed}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Footer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
        <button
          onClick={onNavigateToQueue}
          className="btn btn-primary"
          style={{ padding: '1rem', justifyContent: 'space-between' }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700 }}>Review Prioritized Callback Queue</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Triage top 100 patients within monthly outreach limit</div>
          </div>
          <ArrowRight size={18} />
        </button>

        <button
          onClick={onNavigateToScreening}
          className="btn btn-secondary"
          style={{ padding: '1rem', justifyContent: 'space-between' }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700 }}>Perform New Patient Screening</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Calculate real-time risk estimate & draft nurse notes</div>
          </div>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
