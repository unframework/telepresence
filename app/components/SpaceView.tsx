import React, { useState, useEffect, useRef } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Link from '@material-ui/core/Link';
import Divider from '@material-ui/core/Divider';
import CircularProgress from '@material-ui/core/CircularProgress';

import { createServerSocket, updateSpaceScreen } from '../server';
import { useStreamCapture } from './capture/StreamCapture';
import { useScreenMediaRequest } from './capture/ScreenRequest';

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

const SpaceView: React.FC<RouteComponentProps<{
  spaceId: string;
  participantId: string;
}>> = ({ match }) => {
  const spaceId = decodeURIComponent(match.params.spaceId);
  const participantId = decodeURIComponent(match.params.participantId);

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

  const [
    setVideoStream,
    activeVideoElement,
    lastVideoShareError
  ] = useStreamCapture((data: Blob) =>
    updateSpaceScreen(spaceId, participantId, data)
  );

  const [
    startScreenRequest,
    screenRequestIsPending,
    screenRequestError
  ] = useScreenMediaRequest(setVideoStream);

  const displayedScreenShareError = screenRequestError || lastVideoShareError;

  return (
    <Paper>
      <Box p={2}>
        <Box display="flex" alignItems="center" mb={2}>
          {activeVideoElement}

          {activeVideoElement ? (
            <Link
              variant="body1"
              href="#"
              onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                event.preventDefault();
                setVideoStream(null);
              }}
            >
              Stop Sharing Screen
            </Link>
          ) : (
            <Link
              variant="body1"
              href="#"
              onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                event.preventDefault();
                startScreenRequest();
              }}
            >
              Start Sharing Screen
            </Link>
          )}

          <Box display="flex" alignItems="center" ml={2}>
            {displayedScreenShareError ? (
              <Typography variant="body1" color="error">
                Error: {`${displayedScreenShareError}`}
              </Typography>
            ) : (
              <Typography variant="body1">
                {activeVideoElement
                  ? 'Screen sharing is active'
                  : 'Ready to share video'}
              </Typography>
            )}
            &nbsp;
            {screenRequestIsPending ? <CircularProgress size={16} /> : null}
          </Box>
        </Box>

        <Divider />

        <Box mt={2}>
          <Typography variant="subtitle1">
            Sharing with Space Participants
          </Typography>
          {Object.keys(participants).map((participantId) => (
            <Box key={participantId} display="inline-block" mr={1} mb={1}>
              {participantId}:<br />
              <BitmapImage data={participants[participantId].screenImageData} />
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default SpaceView;
