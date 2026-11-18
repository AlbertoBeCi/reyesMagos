export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
export const FAMILY_SLUG = import.meta.env.VITE_FAMILY_SLUG || 'familia-2026';

const TOKEN_KEY = `reyes_token_${FAMILY_SLUG}`;

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    const data = await response.json().catch(() => ({}));
    throw new ApiError(data.detail || 'Sesión expirada o PIN incorrecto.', 401);
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.detail || 'Error en la petición.', response.status);
  }

  return data;
}

export function getMembers() {
  return request(`/api/families/${FAMILY_SLUG}/members`);
}

export async function authMember(memberId, pin) {
  const data = await request(`/api/families/${FAMILY_SLUG}/auth`, {
    method: 'POST',
    body: JSON.stringify({ member_id: memberId, pin }),
  });
  setToken(data.access_token);
  return data;
}

export function getBoard() {
  return request(`/api/families/${FAMILY_SLUG}/board`);
}

export function createWish(payload) {
  return request('/api/wishes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateWish(wishId, payload) {
  return request(`/api/wishes/${wishId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteWish(wishId) {
  return request(`/api/wishes/${wishId}`, {
    method: 'DELETE',
  });
}

export function togglePurchase(wishId) {
  return request(`/api/wishes/${wishId}/toggle-purchase`, {
    method: 'POST',
  });
}
