const SERVER_ORIGIN = 'https://good-luck-lct.icu';

// Detect Capacitor native environment
const isNativeApp = typeof window !== 'undefined'
  && window.location.protocol === 'capacitor:';

const API_BASE = isNativeApp ? SERVER_ORIGIN + '/api' : '/api';

async function api(url, opts = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + url, { ...opts, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadFile(url, formData) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + url, { method: 'POST', headers, body: formData });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default api;
