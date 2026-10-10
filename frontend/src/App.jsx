import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import CallbackQueueView from './components/CallbackQueueView';
import DatasetExplorerView from './components/DatasetExplorerView';
import NurseReviewView from './components/NurseReviewView';
import ScreeningView from './components/ScreeningView';
import ModelEvaluationView from './components/ModelEvaluationView';
import PatientModal from './components/PatientModal';
import { apiService } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [stats, setStats] = useState({
    totalPatients: null,
    queueCount: null,
    capacityLimit: 100,
    positiveOutcomes: null
  });

  // Theme Management (Light / Dark Mode, default: dark for modern healthcare analytics feel)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('medisense_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = theme === 'dark' ? 'dark-mode' : 'light-mode';
    localStorage.setItem('medisense_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [healthRes, summaryRes] = await Promise.allSettled([
          apiService.getHealth(),
          apiService.getDashboardSummary()
        ]);

        if (healthRes.status === 'fulfilled') {
          setHealthData(healthRes.value);
        }

        if (summaryRes.status === 'fulfilled' && summaryRes.value?.kpis) {
          const kpis = summaryRes.value.kpis;
          setStats({
            totalPatients: kpis.total_patients_loaded,
            queueCount: kpis.patients_in_callback_queue,
            capacityLimit: kpis.callback_queue_capacity || 100,
            positiveOutcomes: kpis.positive_historical_outcomes
          });
        }
      } catch (err) {
        console.warn('Initial data load warning:', err);
      }
    }
    loadInitialData();
  }, []);

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        demoMode={healthData?.is_demo_mode}
        totalPatients={stats.totalPatients}
        queueCount={stats.queueCount}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Header
          activeTab={activeTab}
          theme={theme}
          toggleTheme={toggleTheme}
          totalPatients={stats.totalPatients}
          queueCount={stats.queueCount}
          capacityLimit={stats.capacityLimit}
        />

        <main className="content-area">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateToQueue={() => setActiveTab('queue')}
              onNavigateToScreening={() => setActiveTab('screening')}
              onNavigateToDataset={() => setActiveTab('dataset')}
            />
          )}

          {activeTab === 'queue' && (
            <CallbackQueueView
              onSelectPatient={(patient) => setSelectedPatient(patient)}
            />
          )}

          {activeTab === 'dataset' && (
            <DatasetExplorerView
              onSelectPatient={(patient) => setSelectedPatient(patient)}
            />
          )}

          {activeTab === 'notes' && (
            <NurseReviewView />
          )}

          {activeTab === 'screening' && (
            <ScreeningView />
          )}

          {activeTab === 'model' && (
            <ModelEvaluationView />
          )}
        </main>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <PatientModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onOpenReview={() => setActiveTab('notes')}
        />
      )}
    </div>
  );
}
