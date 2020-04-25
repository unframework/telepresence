import React, { useEffect, useRef } from 'react';

import { createServerSocket } from '../../server';

export function useSpaceSocket(
  spaceId: string,
  isEnabled: boolean,
  handlers: {
    onScreenUpdate(participantId: string, imageData: ArrayBuffer): void;
  }
) {
  // wrap in ref to prevent triggering
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // maintain socket instance
  useEffect(() => {
    if (!isEnabled) {
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

      handlersRef.current.onScreenUpdate(participantId, imageData);
    });

    return () => {
      socket.close();
    };
  }, [spaceId, isEnabled]);
}
