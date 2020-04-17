import React, { useState, useEffect, useRef } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import Box from '@material-ui/core/Box';

import SpaceView from './SpaceView';

const HomePage: React.FC = () => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="flex-start"
      width="100%"
      height="100%"
    >
      <Box flex="none" minWidth={480} m={4}>
        <SpaceView />
      </Box>
    </Box>
  );
};

export default HomePage;
