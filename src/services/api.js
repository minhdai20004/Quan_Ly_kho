const BASE_URL = '/api';

async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const token = JSON.parse(localStorage.getItem('user') || '{}')?.token;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'API request failed');
  }

  return data;
}

export const api = {
  get:    (endpoint)       => apiRequest(endpoint, { method: 'GET' }),
  post:   (endpoint, body) => apiRequest(endpoint, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (endpoint, body) => apiRequest(endpoint, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (endpoint, body) => apiRequest(endpoint, { method: 'PATCH',  body: JSON.stringify(body || {}) }),
  delete: (endpoint)       => apiRequest(endpoint, { method: 'DELETE' }),
};

export default api;