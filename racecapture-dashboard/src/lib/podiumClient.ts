// All calls go through the /api/podium proxy to avoid CORS.
// Auth uses session cookies — no OAuth client credentials required.

async function podiumFetch(path: string, session: string, options?: RequestInit) {
  const url = `/api/podium${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Podium-Session': session,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Podium API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// Log in with email + password. Returns the session cookie string to store.
export async function login(email: string, password: string): Promise<string> {
  const res = await fetch('/api/podium/users/sign_in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      'user[email]': email,
      'user[password]': password,
    }),
  });

  // podium.live responds with a redirect (302) on success — our proxy captures the cookie
  const sessionCookie = res.headers.get('x-podium-set-session');
  if (sessionCookie) return sessionCookie;

  // Some Devise setups return 200 with JSON on success
  if (res.ok || res.status === 302 || res.status === 200) {
    const text = await res.text();
    // If the cookie wasn't in the header try parsing a token from JSON response
    try {
      const json = JSON.parse(text);
      if (json.access_token) return `bearer:${json.access_token}`;
    } catch { /* not JSON */ }
  }

  throw new Error(`Login failed (${res.status}). Check your email and password.`);
}

export async function getLivestreams(session: string) {
  return podiumFetch('/api/v1/livestreams?expand=true', session);
}

export async function getDeviceLiveData(session: string, fullUrl: string) {
  const path = fullUrl.replace('https://podium.live', '');
  return podiumFetch(path, session);
}

export async function getEventDevices(session: string, eventUri: string) {
  const path = eventUri.replace('https://podium.live', '') + '/devices?expand=true';
  return podiumFetch(path, session);
}

export async function getLaps(session: string, lapsUri: string) {
  const path = lapsUri.replace('https://podium.live', '');
  return podiumFetch(path, session);
}

export async function getLapData(session: string, lapUri: string) {
  const path = lapUri.replace('https://podium.live', '') + '?expand=true';
  return podiumFetch(path, session);
}

export async function getVenue(session: string, venueUri: string) {
  const path = venueUri.replace('https://podium.live', '');
  return podiumFetch(path, session);
}

// Returns { sensorMap: { ChannelName: index | [latIdx, lonIdx] } } for decoding telemetry stream
export async function getSensorMap(
  session: string,
  deviceId: string,
): Promise<Record<string, number | number[]>> {
  const res = await fetch(`/api/podium/sensors/${deviceId}`, {
    headers: { 'X-Podium-Session': session },
  });
  if (!res.ok) throw new Error(`getSensorMap ${res.status}`);
  const data = await res.json();
  return data.sensorMap ?? {};
}
