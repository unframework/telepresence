import React, { useState, useEffect, useRef } from 'react';
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

async function getStream() {
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
}

const BitmapPreview: React.FC<{ bitmap: ImageBitmap }> = ({ bitmap }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      throw new Error('missing canvas');
    }

    const ctx = canvasRef.current.getContext('2d');

    if (!ctx) {
      throw new Error('missing 2D context');
    }

    ctx.drawImage(bitmap, 0, 0);
  }, [bitmap]);

  return <canvas ref={canvasRef} width={bitmap.width} height={bitmap.height} />;
};

const MainActionMenu: React.FC = () => {
  const videoNodeRef = useRef<HTMLVideoElement>(null);
  const streamAsync = useAsyncCallback(getStream);

  const [bitmapInfoList, setBitmapInfoList] = useState<
    { bitmap: ImageBitmap; bitmapId: number }[]
  >([]);

  useEffect(() => {
    const mediaStream = streamAsync.result;

    if (!mediaStream) {
      return;
    }

    if (!videoNodeRef.current) {
      throw new Error('missing video element');
    }

    videoNodeRef.current.srcObject = mediaStream;

    const mainTrack = mediaStream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(mainTrack);

    let captureCount = 0;
    const captureIntervalId = setInterval(async () => {
      const bitmap = await imageCapture.grabFrame();

      setBitmapInfoList((prevBitmapInfoList) => {
        // constrain to last N bitmaps
        const bitmapId = (captureCount += 1);
        const newList = [{ bitmap, bitmapId }, ...prevBitmapInfoList];

        const trimmedList = newList.slice(0, 100);

        // extra cleanup
        const removedBitmaps = newList.slice(100);
        for (const removedBitmapInfo of removedBitmaps) {
          removedBitmapInfo.bitmap.close();
        }

        return trimmedList;
      });
    }, 5000);

    return () => {
      clearInterval(captureIntervalId);
    };
  }, [streamAsync.result]);

  return (
    <div className="home-page">
      <a
        href="#"
        onClick={(event) => {
          event.preventDefault();
          streamAsync.execute();
        }}
      >
        Get Desktop
      </a>

      <hr />

      <div style={{ display: 'flex' }}>
        {streamAsync.result ? (
          <div style={{ flex: '1 1 0' }}>
            Desktop video active{' '}
            <video
              ref={videoNodeRef}
              width="8"
              height="8"
              style={{ border: '1px solid #000' }}
            />
          </div>
        ) : (
          <div style={{ flex: '1 1 0' }}>
            -- no video --
            <br />
            {streamAsync.error && `Error: ${streamAsync.error}`}
          </div>
        )}
        <div style={{ flex: '3 3 0' }}>
          {bitmapInfoList.map(({ bitmap, bitmapId }) => (
            <div
              key={bitmapId}
              style={{
                display: 'inline-block',
                margin: '0 10px 10px 0',
                border: '1px solid #eee'
              }}
            >
              <BitmapPreview bitmap={bitmap} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainActionMenu;
