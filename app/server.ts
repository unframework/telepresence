import io from 'socket.io-client';

const SERVER_URL = 'https://nm-telepresence-server-dev.glitch.me';

export interface Session {}

export interface SpaceRegistration {
  spaceId: string;
  participantId: string;
}

export interface SpaceStatus {
  spaceId: string;
  name: string;
  participants: { participantId: string; name: string }[];
}

async function apiFetch(
  path: string,
  body?: string | Blob
): Promise<{ [key: string]: unknown }> {
  const res = await fetch(`${SERVER_URL}${path}`, {
    credentials: 'include',
    headers:
      body && typeof body === 'string'
        ? {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        : {
            Accept: 'application/json'
          },
    method: body ? 'POST' : 'GET',
    body
  });

  if (!res.ok) {
    throw new Error('request error');
  }

  const [contentType] = (res.headers.get('Content-Type') || '').split(';');
  if (contentType === 'application/json') {
    const result = await res.json();

    if (!result) {
      throw new Error('response expected');
    }

    return result;
  }

  return {};
}

export async function fetchSession(): Promise<Session> {
  await apiFetch('/session');
  return {}; // @todo more fields
}

export async function registerSpaceParticipant(
  accessCode: string
): Promise<SpaceRegistration> {
  const result = await apiFetch(
    '/client/registration',
    JSON.stringify({ accessCode })
  );

  return {
    spaceId: `${result.spaceId}`,
    participantId: `${result.participantId}`
  };
}

export async function fetchSpaceStatus(spaceId: string): Promise<SpaceStatus> {
  const result = await apiFetch(
    `/client/spaces/${encodeURIComponent(spaceId)}`
  );

  const resultParticipants = Array.isArray(result.participants)
    ? result.participants
    : [];

  return {
    spaceId: `${result.id}`,
    name: `${result.name}`,
    participants: resultParticipants.map((pct) => ({
      participantId: `${pct.id}`,
      name: `${pct.name}`
    }))
  };
}

export async function updateSpaceScreen(
  spaceId: string,
  participantId: string,
  imageBlob: Blob
) {
  await apiFetch(
    `/client/spaces/${encodeURIComponent(
      spaceId
    )}/participants/${encodeURIComponent(participantId)}/screen`,
    imageBlob
  );
}

export function createServerSocket() {
  return io(`${SERVER_URL}/nm-telepresence`);
}
