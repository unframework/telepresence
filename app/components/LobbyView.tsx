import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useAsync } from 'react-async-hook';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';

import {
  createSpace,
  registerSpaceParticipant,
  SpaceRegistration
} from '../server';
import BasicForm, { BasicTextField } from './BasicForm';

const STORAGE_PREFERRED_NAME_KEY = 'telepresence-prefname-93ebbb67';

function getPreferredName(): string | undefined {
  const savedName = localStorage.getItem(STORAGE_PREFERRED_NAME_KEY);
  return savedName ? savedName : undefined;
}

function savePreferredName(name: string) {
  localStorage.setItem(STORAGE_PREFERRED_NAME_KEY, name);
}

const LobbyView: React.FC<RouteComponentProps> = ({ history }) => {
  const preferredName = useMemo(() => getPreferredName(), []);

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

            <BasicForm
              initialValues={{
                name: '',
                accessCode: '',
                participantName: preferredName || ''
              }}
              actionLabel="Create"
              action={({ name, accessCode, participantName }) => {
                savePreferredName(participantName);
                return createSpace(name, accessCode, participantName);
              }}
              onComplete={({ spaceId, participantId }: SpaceRegistration) => {
                // @todo toast notification
                history.push(
                  `/space/${encodeURIComponent(spaceId)}/${encodeURIComponent(
                    participantId
                  )}`
                );
              }}
            >
              <BasicTextField
                name="name"
                label="Space Name"
                placeholder="Name of the new space"
              />
              <BasicTextField
                name="accessCode"
                label="Access Code"
                placeholder="Secret code that will grant access"
              />
              <BasicTextField
                name="participantName"
                label="Your Name"
                placeholder="This will be your name online"
              />
            </BasicForm>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box flex="1 1 0" ml={2}>
            <Typography variant="h6" gutterBottom>
              Join Space
            </Typography>

            <BasicForm
              initialValues={{ accessCode: '', name: preferredName || '' }}
              actionLabel="Join"
              action={({ accessCode, name }) => {
                savePreferredName(name);
                return registerSpaceParticipant(accessCode, name);
              }}
              onComplete={({ spaceId, participantId }: SpaceRegistration) => {
                // @todo toast notification
                history.push(
                  `/space/${encodeURIComponent(spaceId)}/${encodeURIComponent(
                    participantId
                  )}`
                );
              }}
            >
              <BasicTextField
                name="accessCode"
                label="Access Code"
                placeholder="Ask organizer for this code"
              />
              <BasicTextField
                name="name"
                label="Your Name"
                placeholder="This will be your name online"
              />
            </BasicForm>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default LobbyView;
