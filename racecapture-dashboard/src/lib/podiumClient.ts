// Podium API client
// Auth uses OAuth2 password grant → Bearer token for all requests.
// All calls go through /api/podium proxy to avoid CORS.

const PROXY_BASE = '/api/podium';

async function podiumFetch(path: string, token: string, options?: RequestInit) {
  const url = `${PROXY_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  if (res.status === 401) throw new Error('Session expired — please log in again.');
  if (!res.ok) throw new Error(`Podium API error ${res.status}: ${await res.text()}`);
  return res.json();
}

/**
 * Log in with email + password via OAuth2 password grant.
 * Returns the access_token string to store.
 */
export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${PROXY_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      username: email,
      password: password,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = `Login failed (${res.status})`;
    try {
      const json = JSON.parse(text);
      if (json.error_description) msg = json.error_description;
      else if (json.error) msg = json.error;
    } catch { /* not JSON */ }
    throw new Error(msg);
  }

  const json = await res.json();
  if (!json.access_token) throw new Error('Login succeeded but no access_token in response.');
  return json.access_token;
}

/**
 * Get current livestreams (eventdevices that are actively streaming).
 * Returns { total, eventdevices: [...] }
 */
export async function getLivestreams(token: string) {
  return podiumFetch('/api/v1/livestreams?expand=true', token);
}

/**
 * Get a single eventdevice by its URI (expanded, includes channels).
 */
export async function getEventDevice(token: string, uri: string) {
  const path = uri.replace('https://podium.live', '');
  return podiumFetch(`${path}?expand=true`, token);
}

/**
 * Get devices for an event.
 */
export async function getEventDevices(token: string, eventUri: string) {
  const path = eventUri.replace('https://podium.live', '') + '/devices?expand=true';
  return podiumFetch(path, token);
}

/**
 * Get laps for an eventdevice.
 * lapsUri example: "https://podium.live/api/v1/events/70290/devices/6052/laps"
 */
export async function getLaps(token: string, lapsUri: string) {
  const path = lapsUri.replace('https://podium.live', '');
  return podiumFetch(path, token);
}

/**
 * Get a single lap with expanded data.
 */
export async function getLapData(token: string, lapUri: string) {
  const path = lapUri.replace('https://podium.live', '') + '?expand=true';
  return podiumFetch(path, token);
}

/**
 * Get venue info.
 */
export async function getVenue(token: string, venueUri: string) {
  const path = venueUri.replace('https://podium.live', '');
  return podiumFetch(path, token);
}

/**
 * Get account info for the authenticated user.
 */
export async function getAccount(token: string) {
  return podiumFetch('/api/v1/account', token);
}
