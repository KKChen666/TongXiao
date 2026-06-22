const SERVER_ORIGIN = 'https://good-luck-lct.icu';

// Detect Capacitor native environment
const isNativeApp = typeof window !== 'undefined'
  && window.location.protocol === 'capacitor:';

export const API_BASE = isNativeApp ? SERVER_ORIGIN + '/api' : '/api';

async function api(url, opts = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + url, { ...opts, headers });

  if (!res.ok) {
    let errorMsg;
    try {
      errorMsg = await res.text();
    } catch {
      errorMsg = `HTTP ${res.status}`;
    }
    throw new Error(errorMsg || `HTTP ${res.status}`);
  }

  try {
    return await res.json();
  } catch {
    throw new Error('Invalid JSON response from server');
  }
}

export async function uploadFile(url, formData) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + url, { method: 'POST', headers, body: formData });

  if (!res.ok) {
    let errorMsg;
    try {
      errorMsg = await res.text();
    } catch {
      errorMsg = `HTTP ${res.status}`;
    }
    throw new Error(errorMsg || `HTTP ${res.status}`);
  }

  try {
    return await res.json();
  } catch {
    throw new Error('Invalid JSON response from server');
  }
}

/**
 * Create a fetch request with AbortController support
 * @param {string} url - API endpoint
 * @param {object} opts - Fetch options
 * @param {AbortSignal} signal - Abort signal
 * @returns {Promise<Response>}
 */
export async function fetchWithAbort(url, opts = {}, signal) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return fetch(API_BASE + url, { ...opts, headers, signal });
}

export default api;
