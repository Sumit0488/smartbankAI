/**
 * src/config/api.js
 *
 * Central API configuration for SmartBank AI.
 * Handles JWT token storage and authenticated GraphQL requests.
 */

const API_ENDPOINT =
  import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';

// ── Token helpers ────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('sba_token');
}

function setToken(t) {
  localStorage.setItem('sba_token', t);
}

function clearToken() {
  localStorage.removeItem('sba_token');
}

// ── GraphQL Helper ───────────────────────────────────────────────────────────

/**
 * Sends a GraphQL query / mutation to the backend.
 * Attaches Authorization: Bearer <token> header when a token exists.
 */
async function graphqlRequest(query, variables = {}) {
  const token = getToken();
  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

// ── Legacy REST helper (kept for potential Lambda integrations) ───────────────

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
  GRAPHQL_ENDPOINT: API_ENDPOINT,
  GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY || '',
  MODE: import.meta.env.VITE_API_MODE || 'graphql',
};

export const apiRequest = async (path, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.message || `API error: ${response.status}`;
    throw new Error(message);
  }
  return response.json();
};

export { API_ENDPOINT, getToken, setToken, clearToken, graphqlRequest };

export default API_CONFIG;
