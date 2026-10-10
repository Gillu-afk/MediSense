/**
 * MediSense API Client
 * Centralized service module for communicating with the FastAPI backend.
 * Uses same-origin /api base path to ensure seamless operation both locally and on Vercel.
 */

const BASE_URL = '/api';

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'Network request failed';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const apiService = {
  // System Health
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    return handleResponse(res);
  },

  // Dashboard Overview & Insights
  async getDashboardSummary() {
    const res = await fetch(`${BASE_URL}/dashboard/summary`);
    return handleResponse(res);
  },

  // Patient Directory with Pagination & Search
  async getPatients({ page = 1, pageSize = 20, search = '', riskBand = '', sortBy = 'queue_rank', sortOrder = 'ASC' } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      sort_by: sortBy,
      sort_order: sortOrder
    });
    if (search) params.append('search', search);
    if (riskBand) params.append('risk_band', riskBand);

    const res = await fetch(`${BASE_URL}/patients?${params.toString()}`);
    return handleResponse(res);
  },

  // Patient Detail by ID
  async getPatientDetail(patientId) {
    const res = await fetch(`${BASE_URL}/patients/${patientId}`);
    return handleResponse(res);
  },

  // Top 100 Ranked Callback Queue
  async getCallbackQueue({ page = 1, pageSize = 25, search = '', riskBand = '', sortBy = 'queue_rank', sortOrder = 'ASC' } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      sort_by: sortBy,
      sort_order: sortOrder
    });
    if (search) params.append('search', search);
    if (riskBand) params.append('risk_band', riskBand);

    const res = await fetch(`${BASE_URL}/callback-queue?${params.toString()}`);
    return handleResponse(res);
  },

  // ML Evaluation Metrics (5-Fold CV, Baseline vs RF)
  async getModelMetrics() {
    const res = await fetch(`${BASE_URL}/model/metrics`);
    return handleResponse(res);
  },

  // Individual Patient Screening Form Submission
  async screenPatient(formData) {
    const res = await fetch(`${BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    return handleResponse(res);
  },

  // Top 10 Nurse Follow-Up Notes
  async getNurseNotes() {
    const res = await fetch(`${BASE_URL}/nurse-notes`);
    return handleResponse(res);
  },

  // Edit Nurse Note or Update Approval / Call Status
  async updateNurseNote(patientId, updateData) {
    const res = await fetch(`${BASE_URL}/nurse-notes/${patientId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    return handleResponse(res);
  },

  // Download Callback Queue CSV URL
  getExportUrl() {
    return `${BASE_URL}/export/callback-queue`;
  }
};
