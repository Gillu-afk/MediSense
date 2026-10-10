import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import CallbackQueueView from './components/CallbackQueueView';
import NurseReviewView from './components/NurseReviewView';
import ScreeningView from './components/ScreeningView';
import ModelEvaluationView from './components/ModelEvaluationView';
import PatientModal from './components/PatientModal';
import { apiService } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await apiService.getHealth();
        setHealthData(res);
      } catch (err) {
        console.warn('Backend health check error:', err);
      }
    }
    checkHealth();
  }, []);

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        demoMode={healthData?.is_demo_mode}
        queueCount={100}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Header activeTab={activeTab} />

        <main className="content-area">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateToQueue={() => setActiveTab('queue')}
              onNavigateToScreening={() => setActiveTab('screening')}
            />
          )}

          {activeTab === 'queue' && (
            <CallbackQueueView
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
