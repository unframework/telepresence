import React, { useState, useEffect, useRef } from 'react';
import { useAsync } from 'react-async-hook';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';

import { signIn } from '../server';
import SpaceView from './SpaceView';

const HomePage: React.FC = () => {
  const sessionAsync = useAsync(signIn, []);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="flex-start"
      width="100%"
      height="100%"
    >
      {sessionAsync.loading ? (
        <Box alignSelf="center">
          <CircularProgress />
        </Box>
      ) : (
        <Box flex="none" minWidth={480} m={4}>
          {sessionAsync.result ? (
            <SpaceView />
          ) : (
            <Typography variant="body1">
              Error connecting to server:
              <br />
              {`${sessionAsync.error}`}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default HomePage;
