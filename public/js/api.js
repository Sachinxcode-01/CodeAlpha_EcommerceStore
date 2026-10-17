/**
 * CodeAlpha E-commerce Store — Asynchronous API Client Wrapper
 * Handles credentials, headers, response envelopes, and error unwrapping.
 */

const API_BASE = '/api/v1';

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
    credentials: 'include', // Send and receive HttpOnly cookies
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = result.error?.message || `HTTP ${response.status}: Request failed`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.code = result.error?.code || 'API_ERROR';
      err.details = result.error?.details || null;
      throw err;
    }

    return result;
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${url}:`, err);
    throw err;
  }
}
