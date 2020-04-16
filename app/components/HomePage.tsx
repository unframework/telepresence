import React, { useState, useEffect, useRef } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import io from 'socket.io-client';

const SERVER_URL = 'https://nm-telepresence-server-dev.glitch.me';

declare global {
  // Chrome-specific constraints
  interface MediaTrackConstraints {
    mandatory: {
      chromeMediaSource: string;
      chromeMediaSourceId: string;
      maxWidth: number;
      maxHeight: number;
      maxFrameRate: number;
    };
  }
}

async function getStream() {
  const streamId = await new Promise<string>((resolve) =>
    chrome.desktopCapture.chooseDesktopMedia(['screen', 'window'], resolve)
  );

  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: streamId,
        maxWidth: 320,
        maxHeight: 240,
        maxFrameRate: 2
      }
    }
  });
}

async function convertBitmapToBlob(bitmap: ImageBitmap) {
  const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
  const writeCtx = offscreen.getContext('bitmaprenderer');

  if (!writeCtx) {
    throw new Error('did not get renderer');
  }

  writeCtx.transferFromImageBitmap(bitmap);

  const blob = await offscreen.convertToBlob({
    type: 'image/jpeg',
    quality: 0.95
  });

  return blob;
}

interface Participant {
  id: string;
  screenImageData: ArrayBuffer;
}

const BitmapImage: React.FC<{ data: ArrayBuffer }> = ({ data }) => {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imageRef.current) {
      throw new Error('missing canvas');
    }

    const dataUint8 = new Uint8Array(data);
    const blob = new Blob([dataUint8], { type: 'image/jpeg' });
    imageRef.current.src = URL.createObjectURL(blob);
  }, [data]);

  return <img ref={imageRef} />;
};

const HomePage: React.FC = () => {
  const roomId = 'TESTROOM'; // @todo
  const participantId = '09bdabae-3fd3-4769-b46e-ba748164f9ff'; // @todo

  const videoNodeRef = useRef<HTMLVideoElement>(null);
  const streamAsync = useAsyncCallback(getStream);

  const [participants, setParticipants] = useState<{
    [id: string]: Participant;
  }>({});

  // maintain socket instance
  useEffect(() => {
    const socket = io(`${SERVER_URL}/nm-telepresence`);

    socket.on('spaceScreenUpdate', (data?: { [key: string]: unknown }) => {
      if (typeof data !== 'object') {
        return;
      }

      const participantId = `${data.participantId}`;
      const imageData = data.image;

      if (!(imageData instanceof ArrayBuffer)) {
        return;
      }

      setParticipants((prevParticipants) => {
        return {
          ...prevParticipants,
          [participantId]: { id: participantId, screenImageData: imageData }
        };
      });
    });

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    const mediaStream = streamAsync.result;

    if (!mediaStream) {
      return;
    }

    if (!videoNodeRef.current) {
      throw new Error('missing video element');
    }

    videoNodeRef.current.srcObject = mediaStream;

    const mainTrack = mediaStream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(mainTrack);

    let captureCount = 0;
    const captureIntervalId = setInterval(async () => {
      const bitmap = await imageCapture.grabFrame();
      const imageBlob = await convertBitmapToBlob(bitmap);

      const res = await fetch(
        `${SERVER_URL}/client/spaces/${encodeURIComponent(
          roomId
        )}/participants/${encodeURIComponent(participantId)}/screen`,
        {
          method: 'POST',
          body: imageBlob
        }
      );

      if (!res.ok) {
        throw new Error('error posting image data');
      }
    }, 5000);

    return () => {
      clearInterval(captureIntervalId);
    };
  }, [streamAsync.result]);

  return (
    <div className="home-page">
      <a
        href="#"
        onClick={(event) => {
          event.preventDefault();
          streamAsync.execute();
        }}
      >
        Get Desktop
      </a>

      <hr />

      <div style={{ display: 'flex' }}>
        {streamAsync.result ? (
          <div style={{ flex: '1 1 0' }}>
            Desktop video active{' '}
            <video
              ref={videoNodeRef}
              width="8"
              height="8"
              style={{ border: '1px solid #000' }}
            />
          </div>
        ) : (
          <div style={{ flex: '1 1 0' }}>
            -- no video --
            <br />
            {streamAsync.error && `Error: ${streamAsync.error}`}
          </div>
        )}
        <div style={{ flex: '3 3 0' }}>
          {Object.keys(participants).map((participantId) => (
            <div
              key={participantId}
              style={{
                display: 'inline-block',
                margin: '0 10px 10px 0',
                border: '1px solid #eee'
              }}
            >
              {participantId}:<br />
              <BitmapImage data={participants[participantId].screenImageData} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
