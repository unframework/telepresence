import React, { useState, useEffect, useRef } from 'react';
import { useAsyncCallback } from 'react-async-hook';

async function getStream() {
  const streamId = await new Promise((resolve) =>
    chrome.desktopCapture.chooseDesktopMedia(['screen', 'window'], resolve)
  );

  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: streamId,
        maxWidth: 320,
        maxHeight: 240
      }
    }
  });
}

function BitmapPreview(props) {
  const { bitmap } = props;

  const canvasRef = useRef();

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
  }, [bitmap]);

  return <canvas ref={canvasRef} width={bitmap.width} height={bitmap.height} />;
}

function MainActionMenu() {
  const videoNodeRef = useRef();
  const streamAsync = useAsyncCallback(getStream);

  const [bitmapInfoList, setBitmapInfoList] = useState([]);

  useEffect(() => {
    const mediaStream = streamAsync.result;

    if (!mediaStream) {
      return;
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
        const newList = [...prevBitmapInfoList, { bitmap, bitmapId }];

        const trimmedList = newList.slice(-10);

        // extra cleanup
        const removedBitmaps = newList.slice(0, -trimmedList.length);
        for (const removedBitmapInfo of removedBitmaps) {
          removedBitmapInfo.bitmap.close();
        }

        return trimmedList;
      });
    }, 4000);

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
            Desktop Video
            <br />
            <video ref={videoNodeRef} width="640" height="480" />
            <br />
            <button type="button" onClick={() => videoNodeRef.current.play()}>
              Play
            </button>
            <button type="button" onClick={() => videoNodeRef.current.pause()}>
              Pause
            </button>
          </div>
        ) : (
          <div style={{ flex: '1 1 0' }}>
            -- no video --
            <br />
            {streamAsync.error && `Error: ${streamAsync.error}`}
          </div>
        )}
        <div style={{ flex: '1 1 0' }}>
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
}

export default MainActionMenu;
