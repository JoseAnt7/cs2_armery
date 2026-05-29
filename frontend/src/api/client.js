/**
 * Cliente HTTP para hablar con el backend Flask.
 * Todas las peticiones van a /api (proxy de Vite en desarrollo).
 */

const API_BASE = '/api';

function authHeaders() {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json', ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.msg || `Error ${response.status}`);
  }

  return response.json();
}

async function authRequest(path, options = {}) {
  return request(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });
}

/** Incluye JWT si hay sesión (necesario para admins con páginas ocultas al público). */
async function optionalAuthRequest(path, options = {}) {
  const token = localStorage.getItem('access_token');
  const headers = { Accept: 'application/json', ...options.headers };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return request(path, { ...options, headers });
}

export function fetchCategories() {
  return request('/weapons/categories');
}

export function fetchWeaponFilters() {
  return request('/weapons/filters');
}

export function fetchWeapons({
  category = 'all',
  q = '',
  exterior = 'all',
  rarity = 'all',
  page = 1,
  limit = 24,
  sort = 'name',
  prices = false,
}) {
  const params = new URLSearchParams({
    category,
    q,
    exterior,
    rarity,
    page: String(page),
    limit: String(limit),
    sort,
    prices: prices ? '1' : '0',
  });
  return request(`/weapons?${params}`);
}

export function fetchWeaponDetail(id) {
  return request(`/weapons/${id}`);
}

export function loginUser({ username, password }) {
  return request('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export function registerUser({ username, email, password }) {
  return request('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
}

export function fetchProfile() {
  return authRequest('/profile');
}

export function updateProfile({ username, email, password }) {
  const body = { username, email };
  if (password) body.password = password;
  return authRequest('/profile', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function deleteAccount() {
  return authRequest('/profile', { method: 'DELETE' });
}

export function fetchSubscriptions({ includePlans = false } = {}) {
  const qs = includePlans ? '?include_plans=1' : '';
  return optionalAuthRequest(`/subscriptions${qs}`);
}

export function fetchSubscriptionDetail(slug) {
  return optionalAuthRequest(`/subscriptions/${slug}`);
}

export function fetchPublicSettings() {
  return request('/public-settings');
}

export function fetchUserSubscriptions() {
  return authRequest('/user/subscriptions');
}

export function subscribeToPlan({ subscriptionSlug, planSlug }) {
  return authRequest('/user/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      subscription_slug: subscriptionSlug,
      plan_slug: planSlug,
    }),
  });
}

export function trackVisit(path = '/') {
  return request('/visits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  }).catch(() => {});
}

export function fetchAdminStats() {
  return authRequest('/admin/stats');
}

export function fetchAdminUsers() {
  return authRequest('/admin/users');
}

export function adminCreateUser(body) {
  return authRequest('/admin/users', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function adminPatchUser(userId, body) {
  return authRequest(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function adminSetUserSubscription(userId, body) {
  return authRequest(`/admin/users/${userId}/subscription`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function fetchAdminSettings() {
  return authRequest('/admin/settings');
}

export function adminPatchSettings(body) {
  return authRequest('/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function fetchCSBotStatus() {
  return authRequest('/csbot/status');
}

export function fetchCSBotSettings() {
  return authRequest('/csbot/settings');
}

export function saveCSBotSettings(settings) {
  return authRequest('/csbot/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

export function fetchCSBotCategories() {
  return authRequest('/csbot/categories');
}

export function runCSBotSearch(payload) {
  return authRequest('/csbot/search', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
