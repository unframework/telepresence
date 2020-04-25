import { useEffect, useRef } from 'react';
import { useAsyncCallback } from 'react-async-hook';

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

export type ScreenMediaRequestState = [() => void, boolean, Error | undefined];

export function useScreenMediaRequest(
  onComplete: (mediaStream: MediaStream) => void
): ScreenMediaRequestState {
  // wrap in ref to avoid triggering effect
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const streamAsync = useAsyncCallback(async () => {
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
  });

  useEffect(() => {
    const mediaStream = streamAsync.result;

    if (!mediaStream) {
      return;
    }

    onCompleteRef.current(mediaStream);
  }, [streamAsync.result]);

  return [streamAsync.execute, streamAsync.loading, streamAsync.error];
}
