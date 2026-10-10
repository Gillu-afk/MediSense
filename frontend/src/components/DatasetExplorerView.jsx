import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  AlertCircle,
  Activity,
  CheckCircle,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Info,
  ShieldCheck
} from 'lucide-react';
import { apiService } from '../services/api';

export default function DatasetExplorerView({ onSelectPatient }) {
  const [data, setData] = useState(null);
  const [summaryStats, setSummaryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [riskBand, setRiskBand] = useState('');
  const [sortBy, setSortBy] = useState('queue_rank');
  const [sortOrder, setSortOrder] = useState('ASC');

  useEffect(() => {
    async function loadDatasetSummary() {
      try {
        const res = await apiService.getDashboardSummary();
        if (res && res.kpis) {
          const total = res.kpis.total_patients_loaded;
          const pos = res.kpis.positive_historical_outcomes;
          const neg = total - pos;
          const posPct = total > 0 ? ((pos / total) * 100).toFixed(1) : 0;
          const negPct = total > 0 ? ((neg / total) * 100).toFixed(1) : 0;

          setSummaryStats({
            total,
            positives: pos,
            posPct,
            negatives: neg,
            negPct,
            inQueue: res.kpis.patients_in_callback_queue
          });
        }
      } catch (err) {
        console.warn('Dataset summary fetch warning:', err);
      }
    }
    loadDatasetSummary();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await apiService.getPatients({
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
    fetchPatients();
  }, [page, pageSize, search, riskBand, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  const totalCohortDisplay = summaryStats?.total ?? (data?.total ?? '...');
  const positiveDisplay = summaryStats
    ? `${summaryStats.positives} (${summaryStats.posPct}%)`
    : '...';
  const negativeDisplay = summaryStats
    ? `${summaryStats.negatives} (${summaryStats.negPct}%)`
    : '...';
  const queueDisplay = summaryStats?.inQueue ?? 100;

  return (
    <div>
      {/* Overview Banner */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.25rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: 'var(--radius-sm)'
            }}>
              HISTORICAL COHORT
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Pima Indians Diabetes Dataset (NIDDK / Kaggle)
            </span>
          </div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>
            Cohort Directory ({totalCohortDisplay} Total Patients)
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Raw clinical records with ground-truth outcomes, calculated risk estimates, and physiological zero-audit flags.
          </p>
        </div>

        {/* Dynamic Summary Cards */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--bg-card-subtle)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{totalCohortDisplay}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Cohort</div>
          </div>
          <div style={{ background: 'var(--bg-card-subtle)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--risk-high-text)' }}>{positiveDisplay}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Outcome = 1</div>
          </div>
          <div style={{ background: 'var(--bg-card-subtle)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--risk-low-text)' }}>{negativeDisplay}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Outcome = 0</div>
          </div>
          <div style={{ background: 'var(--bg-card-subtle)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{queueDisplay}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>In Priority Queue</div>
          </div>
        </div>
      </div>

      {/* Clinical Data Audit Alert (Zero-Value Trap Explained) */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderLeft: '4px solid #d97706',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
        marginBottom: '1.25rem',
        fontSize: '0.8rem',
        color: 'var(--text-main)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <AlertTriangle size={16} color="#d97706" />
          <strong style={{ fontSize: '0.85rem' }}>Data Integrity Audit: Medically Impossible Minimum Zeros Handled</strong>
        </div>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
          In the raw dataset, minimum values of <strong>0</strong> in <em>Insulin (48.7% zeros)</em>, <em>SkinThickness (29.6%)</em>, <em>BloodPressure (4.6%)</em>, <em>BMI (1.4%)</em>, and <em>Glucose (0.7%)</em> represent missing lab tests (unrecorded at intake), not living biological zeros. Conversely, <em>Pregnancies = 0</em> is clinically valid (nulliparous women). MediSense treats physiological zeros as missing, adds explicit missingness flags, and imputes training-fold medians with zero leakage.
        </p>
      </div>

      {/* Table Toolbar */}
      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by Patient Code (e.g. PID-120)..."
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
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-card-subtle)',
                fontSize: '0.8rem',
                color: 'var(--text-main)'
              }}
            >
              <option value="">All Risk Bands</option>
              <option value="High Risk">High Risk (&ge; 0.60)</option>
              <option value="Moderate Risk">Moderate Risk (0.35 - 0.59)</option>
              <option value="Low Risk">Low Risk (&lt; 0.35)</option>
            </select>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-card-subtle)',
                fontSize: '0.8rem',
                color: 'var(--text-main)'
              }}
            >
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>

            <a
              href={apiService.getExportUrl()}
              download="medisense_callback_queue_top100.csv"
              className="btn btn-secondary btn-sm"
              title="Download Callback Queue CSV"
            >
              <Download size={13} />
              <span>Export Queue</span>
            </a>
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Activity className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem' }} />
            <p>Loading patient records from dataset...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', color: 'var(--risk-high-text)' }}>{error}</div>
        ) : data && data.patients.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertCircle size={24} style={{ margin: '0 auto 0.5rem' }} />
            <p>No patient records match the selected criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('queue_rank')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      Rank <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th>Patient Code</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('estimated_risk')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      Est. Risk <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th>Risk Band</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('glucose')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      Glucose <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('bmi')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      BMI <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('age')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      Age <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th>Blood Pressure</th>
                  <th>Insulin</th>
                  <th>DPF</th>
                  <th>Preg.</th>
                  <th>Outcome Label</th>
                  <th>Queue Tier</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.patients.map((p) => {
                  const riskPercent = (p.estimated_risk * 100).toFixed(1);
                  return (
                    <tr key={p.id}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                          #{p.queue_rank}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>
                          {p.patient_code}
                        </strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontWeight: 700 }}>{riskPercent}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-risk ${p.risk_band === 'High Risk' ? 'high' : p.risk_band === 'Moderate Risk' ? 'moderate' : 'low'}`}>
                          {p.risk_band}
                        </span>
                      </td>
                      <td>
                        {p.glucose === 0 ? (
                          <span style={{ color: '#d97706', fontSize: '0.725rem' }}>0 (Missing)</span>
                        ) : (
                          <span><strong>{p.glucose}</strong> mg/dL</span>
                        )}
                      </td>
                      <td>
                        {p.bmi === 0 ? (
                          <span style={{ color: '#d97706', fontSize: '0.725rem' }}>0 (Missing)</span>
                        ) : (
                          <span><strong>{p.bmi}</strong> kg/m²</span>
                        )}
                      </td>
                      <td>{p.age} yrs</td>
                      <td>
                        {p.blood_pressure === 0 ? (
                          <span style={{ color: '#d97706', fontSize: '0.725rem' }}>0 (Missing)</span>
                        ) : (
                          `${p.blood_pressure} mmHg`
                        )}
                      </td>
                      <td>
                        {p.insulin === 0 ? (
                          <span style={{ color: '#d97706', fontSize: '0.725rem' }}>0 (Missing)</span>
                        ) : (
                          `${p.insulin} µU/mL`
                        )}
                      </td>
                      <td>{p.diabetes_pedigree_function}</td>
                      <td>{p.pregnancies}</td>
                      <td>
                        {p.outcome === 1 ? (
                          <span style={{
                            background: 'var(--risk-high-bg)',
                            color: 'var(--risk-high-text)',
                            border: '1px solid var(--risk-high-border)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '3px',
                            fontWeight: 600,
                            fontSize: '0.725rem'
                          }}>
                            1 (Diabetic)
                          </span>
                        ) : (
                          <span style={{
                            background: 'var(--risk-low-bg)',
                            color: 'var(--risk-low-text)',
                            border: '1px solid var(--risk-low-border)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '3px',
                            fontWeight: 600,
                            fontSize: '0.725rem'
                          }}>
                            0 (Non-diabetic)
                          </span>
                        )}
                      </td>
                      <td>
                        {p.is_in_callback_queue ? (
                          <span style={{
                            background: 'var(--color-primary-light)',
                            color: 'var(--color-primary)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '3px',
                            fontSize: '0.68rem',
                            fontWeight: 600
                          }}>
                            Top 100 Queue
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                            Standard
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => onSelectPatient(p)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Eye size={12} />
                          <span>View</span>
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
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.total)} of {data.total} total cohort records
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
