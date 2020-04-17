import React, { useState, useEffect, useRef } from 'react';
import {
  HashRouter as Router,
  Route,
  Switch,
  Redirect
} from 'react-router-dom';
import { useAsync } from 'react-async-hook';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';

import { fetchSession } from '../server';
import LobbyView from './LobbyView';
import SpaceView from './SpaceView';

const MainRoutes: React.FC = React.memo(() => {
  return (
    <Switch>
      <Route path="/" exact component={LobbyView} />
      <Route path="/space/:spaceId/:participantId" component={SpaceView} />
      <Redirect to="/" />
    </Switch>
  );
});

const HomePage: React.FC = () => {
  const sessionAsync = useAsync(fetchSession, []);

  return (
    <Router>
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
          <Box flex="none" minWidth={600} m={4}>
            {sessionAsync.result ? (
              <MainRoutes />
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
    </Router>
  );
};

export default HomePage;
