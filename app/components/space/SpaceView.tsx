import React, { useState, useEffect, useRef } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useAsync } from 'react-async-hook';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Link from '@material-ui/core/Link';
import Divider from '@material-ui/core/Divider';
import CircularProgress from '@material-ui/core/CircularProgress';

import {
  createServerSocket,
  fetchSpaceStatus,
  updateSpaceScreen,
  SpaceStatus
} from '../../server';
import { useStreamCapture } from '../capture/StreamCapture';
import { useScreenMediaRequest } from '../capture/ScreenRequest';

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

  return <img ref={imageRef} style={{ width: '100%', height: 'auto' }} />;
};

const SpaceParticipantsBlock: React.FC<{
  spaceStatus: SpaceStatus;
  participantScreenData: { [id: string]: ArrayBuffer | null | undefined };
}> = ({ spaceStatus, participantScreenData }) => {
  const { participants } = spaceStatus;

  return (
    <Box
      display="flex"
      flexWrap="wrap"
      mt={1}
      ml="auto"
      mr="auto"
      justifyContent="flex-start"
      width={500}
    >
      {participants.map((participant) => {
        const imageData = participantScreenData[participant.participantId];

        return (
          <Box key={participant.participantId} p={1} width="50%">
            {participant.name}:<br />
            {imageData && <BitmapImage data={imageData} />}
          </Box>
        );
      })}
    </Box>
  );
};

const SpaceView: React.FC<RouteComponentProps<{
  spaceId: string;
  participantId: string;
}>> = ({ match }) => {
  const spaceId = decodeURIComponent(match.params.spaceId);
  const participantId = decodeURIComponent(match.params.participantId);

  // @todo handle error
  const spaceStatusAsync = useAsync(fetchSpaceStatus, [spaceId], {
    // preserve existing data, if any
    setLoading(prevState) {
      return {
        ...prevState,
        status: 'loading',
        loading: true
      };
    }
  });

  const spaceStatus = spaceStatusAsync.result;
  const spaceStatusLoaded = !!spaceStatus;

  // manage per-participant dynamic data
  const [participantScreenData, setParticipantScreenData] = useState<{
    [id: string]: ArrayBuffer | null | undefined;
  }>({});

  useEffect(() => {
    if (!spaceStatus) {
      return;
    }

    // on any roster changes, synchronize the participant dictionary
    setParticipantScreenData((prevData) => {
      const updatedData = { ...prevData };

      // fill in any missing participant ID keys
      for (const pct of spaceStatus.participants) {
        if (updatedData[pct.participantId] === undefined) {
          updatedData[pct.participantId] = null;
        }
      }

      // remove stale participant ID keys to free up memory
      for (const prevPctID of Object.keys(prevData)) {
        const participantIsIntact = spaceStatus.participants.some(
          (pct) => pct.participantId === prevPctID
        );

        if (!participantIsIntact) {
          delete updatedData[prevPctID];
        }
      }

      return updatedData;
    });
  }, [spaceStatus]);

  // maintain socket instance
  useEffect(() => {
    if (!spaceStatusLoaded) {
      return;
    }

    const socket = createServerSocket();

    socket.on('spaceScreenUpdate', (data?: { [key: string]: unknown }) => {
      if (typeof data !== 'object') {
        return;
      }

      const eventSpaceId = `${data.spaceId}`;
      const participantId = `${data.participantId}`;
      const imageData = data.image;

      if (!(imageData instanceof ArrayBuffer)) {
        return;
      }

      if (eventSpaceId !== spaceId) {
        return;
      }

      setParticipantScreenData((prevData) => {
        // ignore if there is no existing known key for this ID
        if (prevData[participantId] === undefined) {
          return prevData;
        }

        return {
          ...prevData,
          [participantId]: imageData
        };
      });
    });

    return () => {
      socket.close();
    };
  }, [spaceId, spaceStatusLoaded]);

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
            Sharing with Space Participants:{' '}
            {spaceStatusAsync.result ? spaceStatusAsync.result.name : '--'}
          </Typography>

          {spaceStatusAsync.result && (
            <SpaceParticipantsBlock
              spaceStatus={spaceStatusAsync.result}
              participantScreenData={participantScreenData}
            />
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default SpaceView;
