/**
 * src/config/api.js
 * 
 * Central API configuration for SmartBank AI.
 * UPDATED: Authentication (JWT) removed for stability and AWS prep.
 */

export const API_CONFIG = {
  /** REST base URL (kept for potential Lambda integrations) */
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '',

  /** GraphQL endpoint (defaults to local backend) */
  GRAPHQL_ENDPOINT: import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',

  /** Groq LLM API key */
  GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY || '',

  /** Mode: 'mock' | 'graphql' (REST removed for now) */
  MODE: import.meta.env.VITE_API_MODE || 'graphql',
};

// ── HTTP Helper (REST) ──────────────────────────────────────────────────────

/**
 * Generic API request helper.
 * AUTH REMOVED.
 */
export const apiRequest = async (path, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${path}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.message || `API error: ${response.status}`;
    throw new Error(message);
  }

  return response.json();
};

// ── GraphQL Helper ───────────────────────────────────────────────────────────

/**
 * Sends a GraphQL query / mutation to the backend.
 * AUTH REMOVED.
 */
export const graphqlRequest = async (query, variables = {}) => {
  const response = await fetch(
    API_CONFIG.GRAPHQL_ENDPOINT,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  const json = await response.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
};

export default API_CONFIG;
