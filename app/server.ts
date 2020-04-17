import io from 'socket.io-client';

const SERVER_URL = 'https://nm-telepresence-server-dev.glitch.me';

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
