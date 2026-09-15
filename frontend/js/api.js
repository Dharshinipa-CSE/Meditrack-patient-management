// ---------------------------------------------------------------
// api.js
// Thin wrapper around fetch() that attaches the auth token and
// exposes CRUD helper functions for the Patient resource.
// ---------------------------------------------------------------

function getToken() {
  return localStorage.getItem('authToken');
}

async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers['Authorization'] = `Token ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  // Token missing/expired/invalid -> force re-login.
  if (res.status === 401) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    window.location.href = 'index.html';
    throw new Error('Session expired. Please log in again.');
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch (_) { data = null; }
  }

  if (!res.ok) {
    const error = new Error('Request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

const PatientAPI = {
  list(search = '', status = '') {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/patients/${query}`, { method: 'GET' });
  },
  create(payload) {
    return apiRequest('/patients/', { method: 'POST', body: JSON.stringify(payload) });
  },
  update(id, payload) {
    return apiRequest(`/patients/${id}/`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  remove(id) {
    return apiRequest(`/patients/${id}/`, { method: 'DELETE' });
  },
};
