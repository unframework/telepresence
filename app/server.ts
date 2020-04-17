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

async function apiFetch(url: string, body?: string | Blob): Promise<unknown> {
  const res = await fetch(url, {
    method: body ? 'POST' : 'GET',
    body
  });

  if (!res.ok) {
    throw new Error('request error');
  }

  if (!body) {
    return res.json();
  }
}

export async function signIn(): Promise<Session> {
  // @todo implement
  await new Promise((res) => setTimeout(res, 500));
  return {};
}

export async function registerSpaceParticipant(
  accessCode: string
): Promise<SpaceRegistration> {
  // @todo implement
  await new Promise((res) => setTimeout(res, 500));
  return {
    spaceId: 'TESTROOM',
    participantId: 'c8dc45a2-e684-48f1-818f-54d2628bd377'
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
    `${SERVER_URL}/client/spaces/${encodeURIComponent(
      spaceId
    )}/participants/${encodeURIComponent(participantId)}/screen`,
    imageBlob
  );
}

export function createServerSocket() {
  return io(`${SERVER_URL}/nm-telepresence`);
}
