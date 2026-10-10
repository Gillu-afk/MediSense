import React from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  UserPlus,
  Cpu,
  ShieldAlert,
  Activity
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, demoMode, queueCount = 100 }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard & Insights', icon: LayoutDashboard },
    { id: 'queue', label: 'Ranked Callback Queue', icon: Users, badge: `${queueCount}/100` },
    { id: 'notes', label: 'Top-10 Nurse Review', icon: ClipboardList, badge: '10' },
    { id: 'screening', label: 'Individual Screening', icon: UserPlus },
    { id: 'model', label: 'Model Evaluation & CV', icon: Cpu },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon-wrapper">
          <Activity size={22} strokeWidth={2.5} />
        </div>
        <div className="brand-text">
          <h1>MediSense</h1>
          <span>Clinical Decision Support</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge && <span className="badge-count">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="clinic-badge">
          <span className="status-dot"></span>
          <span>Community Health Clinic</span>
        </div>
        {demoMode ? (
          <div className="demo-mode-indicator" title="Local/Serverless Demo Mode Active">
            <ShieldAlert size={14} />
            <span>Demo Mode (Ephemeral DB)</span>
          </div>
        ) : (
          <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
            SQLite Persistence Active
          </div>
        )}
      </div>
    </aside>
  );
}
