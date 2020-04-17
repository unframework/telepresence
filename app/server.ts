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
    headers: body
      ? {
          'Content-Type': 'application/json'
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
  // @todo implement
  await new Promise((res) => setTimeout(res, 500));
  return {
    spaceId: 'TESTROOM',
    name: 'Cool workspace',
    participants: [
      {
        participantId: 'c8dc45a2-e684-48f1-818f-54d2628bd377',
        name: 'Me!'
      }
    ]
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
