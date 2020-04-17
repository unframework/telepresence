import React, { useState, useEffect, useRef } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useAsync } from 'react-async-hook';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';

import { registerSpaceParticipant } from '../server';
import BasicForm, { BasicTextField } from './BasicForm';

const LobbyView: React.FC = () => {
  return (
    <Paper>
      <Box p={2}>
        <Typography variant="h5" gutterBottom>
          Get Online!
        </Typography>

        <Box display="flex">
          <Box flex="1 1 0" mr={2}>
            <Typography variant="h6" gutterBottom>
              Start New Space
            </Typography>

            <Button variant="contained" disabled>
              Create
            </Button>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box flex="1 1 0" ml={2}>
            <Typography variant="h6" gutterBottom>
              Join Space
            </Typography>

            <BasicForm
              initialValues={{ accessCode: '' }}
              actionLabel="Join"
              action={({ accessCode }) => registerSpaceParticipant(accessCode)}
              onComplete={() => {
                // @todo toast notification
                console.log('hi');
              }}
            >
              <BasicTextField
                name="accessCode"
                label="Access Code"
                placeholder="Ask organizer for access code"
              />
            </BasicForm>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default LobbyView;
