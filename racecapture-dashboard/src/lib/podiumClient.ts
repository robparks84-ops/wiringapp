// All calls go through the /api/podium proxy to avoid CORS

async function podiumFetch(path: string, token: string, options?: RequestInit) {
  const url = `/api/podium${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Podium-Token': token,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Podium API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function login(
  username: string,
  password: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const res = await fetch('/api/podium/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({ grant_type: 'password', username, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token as string;
}

export async function getLivestreams(token: string) {
  return podiumFetch('/api/v1/livestreams?expand=true', token);
}

export async function getEventDevices(token: string, eventUri: string) {
  const path = eventUri.replace('https://podium.live', '') + '/devices?expand=true';
  return podiumFetch(path, token);
}

export async function getLaps(token: string, lapsUri: string) {
  const path = lapsUri.replace('https://podium.live', '');
  return podiumFetch(path, token);
}

export async function getLapData(token: string, lapUri: string) {
  const path = lapUri.replace('https://podium.live', '') + '?expand=true';
  return podiumFetch(path, token);
}

export async function getVenue(token: string, venueUri: string) {
  const path = venueUri.replace('https://podium.live', '');
  return podiumFetch(path, token);
}
