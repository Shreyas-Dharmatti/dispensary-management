// ─── api.js — shared across all pages ────────────────────────────────────────
const API = 'http://localhost:3000/api';

// ── Token helpers ─────────────────────────────────────────────────────────────
function getToken()       { return localStorage.getItem('token'); }
function getUser()        { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } }
function saveAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// ── Role helpers ──────────────────────────────────────────────────────────────
function hasRole(...roles) {
  const user = getUser();
  if (!user) return false;
  return user.roles.some(r => roles.includes(r));
}
function isAdmin()     { return hasRole('SuperAdmin', 'Admin'); }
function isClinical()  { return hasRole('SuperAdmin', 'Admin', 'Doctor', 'Nurse', 'Pharmacist'); }
function isMember()    { return getUser()?.entityType === 'Member'; }

// ── Auth guard — call at top of every protected page ─────────────────────────
function requireAuth() {
  if (!getToken()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // Token expired or invalid → back to login
  if (res.status === 401) {
    clearAuth();
    window.location.href = 'index.html';
    return null;
  }

  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.error || 'Request failed' };
  return data;
}

const api = {
  get:  (path)         => apiFetch(path),
  post: (path, body)   => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:  (path, body)   => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body) }),
  del:  (path)         => apiFetch(path, { method: 'DELETE' }),
};

// ── Toast notification ────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── Render nav + inject user info ─────────────────────────────────────────────
function renderNav(activePage) {
  const user = getUser();
  if (!user) return;

  const links = [
    { href: 'dashboard.html',     label: 'Dashboard',     always: true },
    { href: 'members.html',       label: 'Members',        always: true },
    { href: 'doctors.html',       label: 'Doctors',        always: true },
    { href: 'appointments.html',  label: 'Appointments',   always: true },
    { href: 'prescriptions.html', label: 'Prescriptions',  clinical: true },
    { href: 'inventory.html',     label: 'Inventory',      clinical: true },
    { href: 'portfolio.html',     label: 'Portfolio',      always: true },
  ];

  const nav = document.getElementById('nav-links');
  if (!nav) return;

  nav.innerHTML = links
    .filter(l => l.always || (l.clinical && isClinical()))
    .map(l => `<a href="${l.href}" class="${l.href.includes(activePage) ? 'active' : ''}">${l.label}</a>`)
    .join('');

  const userEl = document.getElementById('nav-user');
  if (userEl) {
    userEl.innerHTML = `
      <span class="nav-username">${user.username}</span>
      <span class="nav-role">${user.roles.join(', ')}</span>
      <button onclick="logout()" class="btn-logout">Logout</button>
    `;
  }
}

async function logout() {
  try { await api.post('/auth/logout'); } catch {}
  clearAuth();
  window.location.href = 'index.html';
}

// ── Table builder ─────────────────────────────────────────────────────────────
function buildTable(containerId, columns, rows, actionsFn) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!rows || rows.length === 0) {
    container.innerHTML = '<p class="empty">No records found.</p>';
    return;
  }

  const thead = columns.map(c => `<th>${c.label}</th>`).join('');
  const tbody = rows.map(row => {
    const cells = columns.map(c => `<td>${row[c.key] ?? '—'}</td>`).join('');
    const actions = actionsFn ? `<td class="actions">${actionsFn(row)}</td>` : '';
    return `<tr>${cells}${actions}</tr>`;
  }).join('');

  container.innerHTML = `
    <table>
      <thead><tr>${thead}${actionsFn ? '<th>Actions</th>' : ''}</tr></thead>
      <tbody>${tbody}</tbody>
    </table>
  `;
}
