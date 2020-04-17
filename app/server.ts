import io from 'socket.io-client';

const SERVER_URL = 'https://nm-telepresence-server-dev.glitch.me';

export interface Session {}

export interface SpaceRegistration {
  spaceId: string;
  participantId: string;
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

export async function updateSpaceScreen(
  spaceId: string,
  participantId: string,
  imageBlob: Blob
) {
  const res = await fetch(
    `${SERVER_URL}/client/spaces/${encodeURIComponent(
      spaceId
    )}/participants/${encodeURIComponent(participantId)}/screen`,
    {
      method: 'POST',
      body: imageBlob
    }
  );

  if (!res.ok) {
    throw new Error('error posting image data');
  }
}

export function createServerSocket() {
  return io(`${SERVER_URL}/nm-telepresence`);
}
