// @ts-nocheck
// Shared helpers for talking to the InsightVox API and managing the
// logged-in session (JWT + user info) in localStorage.

// Works whether the frontend is served by the Node backend itself
// (recommended: http://localhost:5000) or by a separate static server
// like VS Code's "Live Server" (typically port 5500/5502). In the
// latter case, API calls are pointed at the backend on port 5000.
const API_BASE = (() => {
  const { protocol, hostname, port } = window.location;
  if (port === '5000' || port === '') return '/api';
  return `${protocol}//${hostname}:5000/api`;
})();

/* ===================== Session helpers ===================== */

function getToken() {
  return localStorage.getItem('iv_token');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('iv_user')) || null;
  } catch {
    return null;
  }
}

function setAuth(token, user) {
  localStorage.setItem('iv_token', token);
  localStorage.setItem('iv_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('iv_token');
  localStorage.removeItem('iv_user');
}

function logout() {
  clearAuth();
  window.location.href = '/';
}

/**
 * Ensures the current page is only viewed by a logged-in user with the
 * given role. Redirects to the correct login page otherwise.
 * Call this at the top of every protected page's script.
 *
 * @param {'student'|'staff'} role
 * @returns {object} the current user
 */
function requireRole(role) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    window.location.href = role === 'staff' ? '/staff/login.html' : '/student/login.html';
    return null;
  }

  if (user.role !== role) {
    // Logged in, but as the wrong type of account -> send to their own area
    window.location.href = user.role === 'staff' ? '/staff/dashboard.html' : '/student/home.html';
    return null;
  }

  return user;
}

/**
 * If the user is already logged in, send them straight to their home page.
 * Used on login/signup pages.
 */
function redirectIfLoggedIn() {
  const user = getUser();
  const token = getToken();
  if (user && token) {
    window.location.href = user.role === 'staff' ? '/staff/dashboard.html' : '/student/home.html';
  }
}

/* ===================== Core fetch wrapper ===================== */

/**
 * @param {string} path - path under /api, e.g. '/posts'
 * @param {object} [options]
 * @param {string} [options.method]
 * @param {object|FormData} [options.body]
 * @param {boolean} [options.auth] - attach Authorization header (default true)
 */
async function apiFetch(path, options = {}) {
  const { method = 'GET', body, auth = true } = options;

  const headers = {};
  let fetchBody;

  if (body instanceof FormData) {
    fetchBody = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(body);
  }

  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: fetchBody });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    if (res.status === 401) {
      // token invalid/expired -> force re-login
      clearAuth();
    }
    const message = (data && data.message) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

/* ===================== Auth API ===================== */

const Auth = {
  signup: (payload) => apiFetch('/auth/signup', { method: 'POST', body: payload, auth: false }),
  login: (payload) => apiFetch('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => apiFetch('/auth/me'),
};

/* ===================== Posts API ===================== */

const Posts = {
  list: (sort = 'recent', status = '') => {
    const params = new URLSearchParams({ sort });
    if (status) params.set('status', status);
    return apiFetch(`/posts?${params.toString()}`);
  },
  get: (id) => apiFetch(`/posts/${id}`),
  create: (formData) => apiFetch('/posts', { method: 'POST', body: formData }),
  remove: (id) => apiFetch(`/posts/${id}`, { method: 'DELETE' }),
  support: (id) => apiFetch(`/posts/${id}/support`, { method: 'PUT' }),
  disagree: (id) => apiFetch(`/posts/${id}/disagree`, { method: 'PUT' }),
  setStatus: (id, status) => apiFetch(`/posts/${id}/status`, { method: 'PUT', body: { status } }),
};

/* ===================== Comments API ===================== */

const Comments = {
  add: (postId, text) => apiFetch(`/posts/${postId}/comments`, { method: 'POST', body: { text } }),
  remove: (id) => apiFetch(`/comments/${id}`, { method: 'DELETE' }),
};

/* ===================== Messages API ===================== */

const Messages = {
  conversations: () => apiFetch('/messages/conversations'),
  thread: (studentId) => apiFetch(`/messages/${studentId}`),
  send: (payload) => apiFetch('/messages', { method: 'POST', body: payload }),
};

// Backend origin, used to resolve paths like "/uploads/xyz.png" when the
// frontend and API aren't served from the same origin (e.g. Live Server).
const API_ORIGIN = API_BASE.replace(/\/api$/, '');

function resolveMediaUrl(path) {
  if (!path) return '';
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path;
  return `${API_ORIGIN}${path}`;
}

/* ===================== Small UI helpers ===================== */

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();

  if (sameDay) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
