import React, { useState, useEffect, useRef } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useAsync } from 'react-async-hook';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';

const LobbyView: React.FC = () => {
  return (
    <Paper>
      <Box p={2}>Lobby view</Box>
    </Paper>
  );
};

export default LobbyView;
