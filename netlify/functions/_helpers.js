const CLICKUP_API_BASE = "https://api.clickup.com/api/v2";

/**
 * Make a ClickUp API call with the provided token.
 */
export async function clickupFetch(endpoint, token, options = {}) {
  const url = `${CLICKUP_API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": token,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.err || data.error || `ClickUp API error: ${response.status}`
    );
    error.status = response.status;
    error.clickupError = data;
    throw error;
  }

  return data;
}

/**
 * Standard response helper.
 */
export function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

/**
 * Parse JSON body safely from event.
 */
export function parseBody(event) {
  try {
    return JSON.parse(event.body || "{}");
  } catch (e) {
    return {};
  }
}

/**
 * Handle CORS preflight requests.
 */
export function handleOptions() {
  return {
    statusCode: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
    body: "",
  };
}
