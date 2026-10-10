import React from 'react';
import { PhoneCall, Download, Sun, Moon, Database } from 'lucide-react';
import { apiService } from '../services/api';

export default function Header({
  activeTab,
  theme = 'dark',
  toggleTheme,
  totalPatients,
  queueCount = 100,
  capacityLimit = 100
}) {
  const patientCountStr = totalPatients != null ? ` (${totalPatients} Patients)` : '';

  const titles = {
    dashboard: {
      title: 'Clinical Screening Dashboard & Dataset Insights',
      subtitle: 'Overview of historical patient cohort, model validation, and prioritized triage metrics'
    },
    queue: {
      title: `Prioritized Callback Queue (Capacity: ${capacityLimit} Calls/Month)`,
      subtitle: 'Ranked list of patients flagged for nurse telephone follow-up'
    },
    dataset: {
      title: `Historical Cohort Dataset Explorer${patientCountStr}`,
      subtitle: 'Direct view of raw and cleaned clinical parameters with outcome labels and model risk bands'
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
  const capacityPct = Math.min(100, Math.round(((queueCount || 100) / capacityLimit) * 100));

  return (
    <header className="top-header">
      <div className="header-title-block">
        <h2>{current.title}</h2>
        <div className="header-subtitle">{current.subtitle}</div>
      </div>

      <div className="header-actions">
        {/* Theme Toggle Button (Light/Dark Mode) */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm theme-toggle-btn"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={15} color="#fbbf24" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={15} color="#38bdf8" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        <div className="capacity-meter-pill" title="Clinic monthly follow-up telephone capacity">
          <PhoneCall size={14} color="var(--color-primary)" />
          <span>Capacity: {capacityLimit} calls/mo</span>
          <div className="capacity-bar-mini">
            <div
              className="capacity-bar-fill"
              style={{ width: `${capacityPct}%` }}
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
