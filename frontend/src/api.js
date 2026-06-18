// 使用完整URL直接连接后端（兼容浏览器和原生应用）
const API_BASE = 'https://good-luck-lct.icu/api';

async function api(url, opts = {}) {
  try {
    const res = await fetch(API_BASE + url, {
      headers: { 'Content-Type': 'application/json', ...opts.headers },
      ...opts,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export default api;
