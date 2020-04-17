import React, { useState, useEffect, useRef } from 'react';

async function convertBitmapToBlob(bitmap: ImageBitmap) {
  const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
  const writeCtx = offscreen.getContext('bitmaprenderer');

  if (!writeCtx) {
    throw new Error('did not get renderer');
  }

  writeCtx.transferFromImageBitmap(bitmap);

  const blob = await offscreen.convertToBlob({
    type: 'image/jpeg',
    quality: 0.95
  });

  return blob;
}

export type StreamCaptureState = [
  (mediaStream: MediaStream | null) => void, // start handler
  React.ReactElement | null, // invisible video element if stream is active
  string | null // error message
];

// captures given stream, and catches any errors (including downstream processing ones)
export function useStreamCapture(
  processImage: (data: Blob) => Promise<void>
): StreamCaptureState {
  // wrap in ref to not trigger effect
  const processImageRef = useRef(processImage);
  processImageRef.current = processImage;

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const videoNodeRef = useRef<HTMLVideoElement>(null);

  const startHandler = useEffect(() => {
    if (!mediaStream) {
      return;
    }

    const videoNode = videoNodeRef.current;

    if (!videoNode) {
      throw new Error('missing video element');
    }

    videoNode.srcObject = mediaStream;

    const mainTrack = mediaStream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(mainTrack);

    const finishWithError = (error: Error | undefined) => {
      // ignore error if this video element/etc has already been unmounted
      if (videoNodeRef.current !== videoNode) {
        return;
      }

      // stop current activity and report error
      setMediaStream(null);
      setErrorMessage((error && error.message) || 'Unknown error');
    };

    const updater = async () => {
      try {
        const bitmap = await imageCapture.grabFrame();
        const imageBlob = await convertBitmapToBlob(bitmap);

        await processImageRef.current(imageBlob);
      } catch (error) {
        finishWithError(error);
      }
    };

    // periodic update loop
    // @todo also listen for stream end event
    const captureIntervalId = setInterval(updater, 5000);

    // trigger initial update (no need to cancel this timeout
    // due to built-in unmount checks)
    setTimeout(updater, 0);

    // listen for events
    mainTrack.addEventListener('ended', () => {
      finishWithError(new Error('Capture stream finished'));
    });

    // clear out old error
    setErrorMessage(null);

    return () => {
      clearInterval(captureIntervalId);

      // always stop stream just in case @todo catch?
      for (const track of mediaStream.getTracks()) {
        track.stop();
      }
    };
  }, [mediaStream]);

  const videoElement = mediaStream ? (
    <video
      ref={videoNodeRef}
      width="10"
      height="10"
      style={{ display: 'none' }}
    />
  ) : null;

  return [setMediaStream, videoElement, errorMessage];
}
