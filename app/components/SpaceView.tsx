import React, { useState, useEffect, useRef } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Link from '@material-ui/core/Link';
import Divider from '@material-ui/core/Divider';
import CircularProgress from '@material-ui/core/CircularProgress';

import { createServerSocket, updateSpaceScreen } from '../server';

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

const SpaceView: React.FC = () => {
  const spaceId = 'TESTROOM'; // @todo
  const participantId = '09bdabae-3fd3-4769-b46e-ba748164f9ff'; // @todo

  const videoNodeRef = useRef<HTMLVideoElement>(null);
  const streamAsync = useAsyncCallback(getStream);

  const [participants, setParticipants] = useState<{
    [id: string]: Participant;
  }>({});

  // maintain socket instance
  useEffect(() => {
    const socket = createServerSocket();

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

      await updateSpaceScreen(spaceId, participantId, imageBlob);
    }, 5000);

    return () => {
      clearInterval(captureIntervalId);
    };
  }, [streamAsync.result]);

  return (
    <Paper>
      <Box p={2}>
        <Box mb={2}>
          <video
            ref={videoNodeRef}
            width="10"
            height="10"
            style={{ display: 'none' }}
          />

          <Link
            variant="body1"
            href="#"
            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
              event.preventDefault();
              streamAsync.execute();
            }}
          >
            Start Sharing Screen
          </Link>
        </Box>

        <Divider />

        {streamAsync.result ? (
          <Box mt={2}>
            <Typography variant="subtitle1">
              Sharing with Space Participants
            </Typography>
            {Object.keys(participants).map((participantId) => (
              <Box key={participantId} display="inline-block" mr={1} mb={1}>
                {participantId}:<br />
                <BitmapImage
                  data={participants[participantId].screenImageData}
                />
              </Box>
            ))}
          </Box>
        ) : (
          <Box mt={2}>
            {streamAsync.error ? (
              <Typography variant="body1" color="error">
                Error: {`${streamAsync.error}`}
              </Typography>
            ) : (
              <Typography variant="body1">
                Ready to share video{' '}
                {streamAsync.loading ? <CircularProgress size="small" /> : null}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default SpaceView;
