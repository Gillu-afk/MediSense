import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  AlertCircle,
  Eye,
  CheckCircle,
  Clock,
  PhoneCall,
  Activity,
  ArrowUpDown
} from 'lucide-react';
import { apiService } from '../services/api';

export default function CallbackQueueView({ onSelectPatient }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [riskBand, setRiskBand] = useState('');
  const [sortBy, setSortBy] = useState('queue_rank');
  const [sortOrder, setSortOrder] = useState('ASC');

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await apiService.getCallbackQueue({
        page,
        pageSize,
        search,
        riskBand,
        sortBy,
        sortOrder
      });
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [page, search, riskBand, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  return (
    <div>
      {/* Capacity & Queue Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{
              background: '#0284c7',
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-full)'
            }}>
              CAPACITY-CONSTRAINED TRIAGE
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Ranked by Model Estimated Risk</span>
          </div>
          <h2 style={{ color: 'white', fontSize: '1.4rem', margin: 0 }}>
            Prioritized Callback Queue: {data ? data.total_in_queue : 100} / 100 Slots
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.35rem' }}>
            Restricted to the clinic's maximum operating capacity of 100 nurse calls per monthly outreach cycle.
          </p>
        </div>

        {/* Stats Grid inside banner */}
        {data && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>{data.high_risk_count}</div>
              <div style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase' }}>High Risk</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>{data.moderate_risk_count}</div>
              <div style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase' }}>Moderate Risk</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#60a5fa' }}>{data.contacted_count}</div>
              <div style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase' }}>Contacted</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>{data.pending_count}</div>
              <div style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase' }}>Pending Call</div>
            </div>
          </div>
        )}
      </div>

      {/* Table & Toolbar Container */}
      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Search by Patient Code (e.g. PID-446)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="filter-group">
            <select
              value={riskBand}
              onChange={(e) => {
                setRiskBand(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-card-subtle)',
                fontSize: '0.85rem',
                color: 'var(--text-main)'
              }}
            >
              <option value="">All Risk Bands</option>
              <option value="High Risk">High Risk (Prob &ge; 0.60)</option>
              <option value="Moderate Risk">Moderate Risk (0.35 - 0.59)</option>
            </select>

            <a
              href={apiService.getExportUrl()}
              download="medisense_callback_queue_top100.csv"
              className="btn btn-secondary btn-sm"
              title="Export complete 100 queue to CSV"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <Activity className="animate-spin" size={28} style={{ margin: '0 auto 0.75rem' }} />
            <p>Loading callback queue...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', color: '#b91c1c' }}>{error}</div>
        ) : data && data.patients.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <AlertCircle size={28} style={{ margin: '0 auto 0.75rem' }} />
            <p>No patients match the search or filter criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', cursor: 'pointer' }} onClick={() => handleSort('queue_rank')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      Rank <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th>Patient ID</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('estimated_risk')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      Estimated Risk <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th>Risk Band</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('glucose')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      Glucose <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('bmi')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      BMI <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th>Primary Risk Drivers (Top 3)</th>
                  <th>Recommended Next Action</th>
                  <th>Call Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.patients.map((patient) => {
                  const riskPercent = (patient.estimated_risk * 100).toFixed(1);
                  const isTop10 = patient.queue_rank <= 10;
                  return (
                    <tr key={patient.id} style={{ background: isTop10 ? '#f0f9ff' : 'transparent' }}>
                      <td>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: isTop10 ? '#0284c7' : '#e2e8f0',
                          color: isTop10 ? 'white' : '#475569'
                        }}>
                          {patient.queue_rank}
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontFamily: 'var(--font-display)', color: '#0f172a' }}>
                          {patient.patient_code}
                        </strong>
                        {isTop10 && (
                          <span style={{
                            marginLeft: '0.4rem',
                            fontSize: '0.65rem',
                            background: '#0284c7',
                            color: 'white',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            fontWeight: 700
                          }}>
                            TOP 10
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{riskPercent}%</span>
                          <div style={{
                            width: '45px',
                            height: '5px',
                            background: '#e2e8f0',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${riskPercent}%`,
                              height: '100%',
                              background: patient.risk_band === 'High Risk' ? '#ef4444' : '#f59e0b'
                            }}></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-risk ${patient.risk_band === 'High Risk' ? 'high' : 'moderate'}`}>
                          {patient.risk_band}
                        </span>
                      </td>
                      <td>
                        <strong>{patient.glucose}</strong> <span style={{ fontSize: '0.7rem', color: '#64748b' }}>mg/dL</span>
                      </td>
                      <td>
                        <strong>{patient.bmi}</strong> <span style={{ fontSize: '0.7rem', color: '#64748b' }}>kg/m²</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxWidth: '240px' }}>
                          {patient.top_factors && patient.top_factors.map((f, i) => (
                            <span
                              key={i}
                              title={f.clinical_note}
                              style={{
                                fontSize: '0.7rem',
                                background: f.level === 'high' ? '#fee2e2' : '#f1f5f9',
                                color: f.level === 'high' ? '#991b1b' : '#334155',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                border: '1px solid ' + (f.level === 'high' ? '#fca5a5' : '#cbd5e1')
                              }}
                            >
                              {f.factor}: {f.value}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#334155', maxWidth: '200px' }}>
                        {patient.recommended_action}
                      </td>
                      <td>
                        <span className={`badge-status ${patient.review_status ? patient.review_status.toLowerCase() : 'pending'}`}>
                          {patient.review_status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => onSelectPatient(patient)}
                          className="btn btn-secondary btn-sm"
                          title="View clinical profile and note"
                        >
                          <Eye size={13} />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {data && (
          <div className="pagination-bar">
            <div>
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.total_matching)} of {data.total_matching} ranked patients (Total Queue: {data.total_in_queue}/100)
            </div>
            <div className="pagination-controls">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <span style={{ padding: '0 0.5rem', fontWeight: 600 }}>
                Page {page} of {data.total_pages}
              </span>
              <button
                disabled={page >= data.total_pages}
                onClick={() => setPage(page + 1)}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
