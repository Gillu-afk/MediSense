import React from 'react';
import { PhoneCall, Download, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';

export default function Header({ activeTab, queueStats }) {
  const titles = {
    dashboard: {
      title: 'Clinical Screening Dashboard & Dataset Insights',
      subtitle: 'Overview of historical patient cohort, model validation, and prioritized triage metrics'
    },
    queue: {
      title: 'Prioritized Callback Queue (Capacity: 100 Calls/Month)',
      subtitle: 'Ranked list of patients flagged for nurse telephone follow-up'
    },
    notes: {
      title: 'Top-10 Nurse Follow-Up Review Center',
      subtitle: 'Patient-specific 1-line conversation prompts with approval & review state tracking'
    },
    screening: {
      title: 'Individual Patient Diabetes Risk Screening',
      subtitle: 'Decision-support risk assessment based on validated clinical metrics'
    },
    model: {
      title: 'Machine Learning Performance & Stratified Cross-Validation',
      subtitle: 'Leakage-free 5-fold CV evaluation, clinical cost asymmetry analysis, and data trap handling'
    }
  };

  const current = titles[activeTab] || titles.dashboard;

  return (
    <header className="top-header">
      <div className="header-title-block">
        <h2>{current.title}</h2>
        <div className="header-subtitle">{current.subtitle}</div>
      </div>

      <div className="header-actions">
        <div className="capacity-meter-pill" title="Clinic monthly follow-up telephone capacity">
          <PhoneCall size={14} color="#0284c7" />
          <span>Capacity: 100 calls/mo</span>
          <div className="capacity-bar-mini">
            <div
              className="capacity-bar-fill"
              style={{ width: `${queueStats ? Math.min(queueStats.total_in_queue, 100) : 100}%` }}
            ></div>
          </div>
        </div>

        <a
          href={apiService.getExportUrl()}
          download="medisense_callback_queue_top100.csv"
          className="btn btn-secondary btn-sm"
          title="Export Top 100 Callback Queue to CSV"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </a>
      </div>
    </header>
  );
}
